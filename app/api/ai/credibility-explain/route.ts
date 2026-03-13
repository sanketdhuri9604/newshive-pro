import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { title, description, source, score, verdict } = await req.json()

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `You are a media credibility analyst. Explain why this news article received a credibility score of ${score}% with verdict "${verdict}".

Article Title: ${title}
Description: ${description || 'N/A'}
Source: ${source || 'Unknown'}

Provide a clear explanation covering:
1. What factors contributed to this score
2. Any red flags or trust signals found
3. What readers should be aware of

Keep it concise (3-4 sentences max). Be specific and factual. Do not repeat the score or verdict.`
        }]
      })
    })

    const data = await res.json()
    const explanation = data.choices?.[0]?.message?.content || ''
    return NextResponse.json({ explanation })
  } catch {
    return NextResponse.json({ error: 'Failed to explain score' }, { status: 500 })
  }
}