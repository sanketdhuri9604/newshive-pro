import { NextRequest, NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'
import { checkRateLimit, sanitizeInput } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req)
  if (limited) return limited

  try {
    const { title, description } = await req.json()
    if (!title) return NextResponse.json({ error: 'No content' }, { status: 400 })

    const safeTitle = sanitizeInput(title, 500)
    const safeDesc = sanitizeInput(description || '', 1000)

    const completion = await groq.chat.completions.create({
      model: MODELS.fast,
      messages: [{
        role: 'user',
        content: `Analyze the political bias of this news article. Reply ONLY with valid JSON, no extra text.
Title: ${safeTitle}
Description: ${safeDesc}

Return: {"bias": "left" | "center" | "right", "confidence": 0-100, "reason": "one sentence"}`
      }],
      max_tokens: 100,
    })

    const text = completion.choices[0]?.message?.content || ''
    const json = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json(json)
  } catch {
    return NextResponse.json({ bias: 'center', confidence: 50, reason: 'Could not analyze' })
  }
}