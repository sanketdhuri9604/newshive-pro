import { NextRequest, NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'
import { checkRateLimit, sanitizeInput } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req)
  if (limited) return limited

  try {
    const { title, description, content } = await req.json()
    if (!title) return NextResponse.json({ error: 'No content' }, { status: 400 })

    const safeTitle = sanitizeInput(title, 500)
    const safeDesc = sanitizeInput(description || '', 1000)
    const safeContent = sanitizeInput(content || '', 3000)

    const completion = await groq.chat.completions.create({
      model: MODELS.smart,
      messages: [{
        role: 'user',
        content: `Create a 4-question multiple choice quiz based on this news article. Reply ONLY with valid JSON, no extra text.

Title: ${safeTitle}
Description: ${safeDesc}
Content: ${safeContent}

Return exactly this format:
{
  "questions": [
    {
      "question": "question text here",
      "options": ["option A", "option B", "option C", "option D"],
      "correct": 0
    }
  ]
}`
      }],
      max_tokens: 800,
    })

    const text = completion.choices[0]?.message?.content || ''
    const json = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json(json)
  } catch (err) {
    return NextResponse.json({ error: 'Could not generate quiz' }, { status: 500 })
  }
}