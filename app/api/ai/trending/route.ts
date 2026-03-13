import { NextRequest, NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'
import { checkRateLimit, sanitizeInput } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req)
  if (limited) return limited

  try {
    const { headlines } = await req.json()
    if (!headlines?.length) return NextResponse.json({ analysis: '' })

    const safeHeadlines = (headlines as string[])
      .slice(0, 10)
      .map((h: string) => sanitizeInput(h, 300))

    const completion = await groq.chat.completions.create({
      model: MODELS.smart,
      messages: [{
        role: 'user',
        content: `Analyze these trending news headlines and write a 2-3 sentence summary of what major themes and events are dominating the news right now. Be concise and insightful.

Headlines:
${safeHeadlines.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n')}

Write only the analysis paragraph, no JSON, no bullet points, just plain text.`
      }],
      max_tokens: 200,
    })

    const analysis = completion.choices[0]?.message?.content || ''
    return NextResponse.json({ analysis })
  } catch {
    return NextResponse.json({ analysis: 'Could not analyze trends right now.' })
  }
}