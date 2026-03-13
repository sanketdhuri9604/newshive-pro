import { NextRequest, NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'
import { checkRateLimit, sanitizeInput } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req)
  if (limited) return limited

  try {
    const { title, description, source } = await req.json()
    if (!title) return NextResponse.json({ error: 'No content' }, { status: 400 })

    const safeTitle = sanitizeInput(title, 500)
    const safeDesc = sanitizeInput(description || '', 1000)
    const safeSource = sanitizeInput(source || 'Unknown', 100)

    const completion = await groq.chat.completions.create({
      model: MODELS.fast,
      messages: [{
        role: 'user',
        content: `Analyze the credibility of this news article. Reply ONLY with valid JSON, no extra text.
Title: ${safeTitle}
Description: ${safeDesc}
Source: ${safeSource}

Return exactly this format: {"credibilityScore": 85, "verdict": "Credible", "reason": "one sentence"}`
      }],
      max_tokens: 150,
    })

    const text = completion.choices[0]?.message?.content || ''
    const json = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json({
      ...json,
      credibilityScore: Number(json.credibilityScore) || 70,
    })
  } catch {
    return NextResponse.json({ credibilityScore: 70, verdict: 'Credible', reason: 'Could not analyze' })
  }
}