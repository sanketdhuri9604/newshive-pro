import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json()
    if (!topic) return NextResponse.json({ error: 'Topic required' }, { status: 400 })

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
       model: 'llama-3.1-8b-instant',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Create a news timeline for: "${topic}"

Respond ONLY with valid JSON in this exact format:
{
  "topic": "${topic}",
  "overview": "2-3 sentence overview of this story/topic",
  "events": [
    {
      "date": "Month Year or specific date",
      "headline": "Short headline of what happened",
      "summary": "2-3 sentence description of this event",
      "significance": "Why this moment was important"
    }
  ]
}

Include 5-7 key events in chronological order (oldest first). Focus on the most important developments. Use your knowledge up to your cutoff date. No markdown, just JSON.`
        }]
      })
    })

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Failed to generate timeline' }, { status: 500 })
  }
}