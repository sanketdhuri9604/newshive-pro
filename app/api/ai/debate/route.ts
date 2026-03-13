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
        max_tokens: 1200,
        messages: [{
          role: 'user',
          content: `Generate a structured debate on this topic: "${topic}"

Respond ONLY with valid JSON in this exact format:
{
  "topic": "${topic}",
  "sideA": {
    "position": "one sentence FOR position",
    "arguments": ["argument 1", "argument 2", "argument 3"],
    "conclusion": "one sentence conclusion"
  },
  "sideB": {
    "position": "one sentence AGAINST position", 
    "arguments": ["argument 1", "argument 2", "argument 3"],
    "conclusion": "one sentence conclusion"
  },
  "verdict": "2-3 sentence balanced AI verdict considering both sides"
}

Be factual, balanced and concise. No markdown, just JSON.`
        }]
      })
    })

    const data = await res.json()
    console.log('Groq response:', JSON.stringify(data).slice(0, 300))

    if (data.error) {
      console.error('Groq error:', data.error)
      return NextResponse.json({ error: data.error.message || 'Groq error' }, { status: 500 })
    }

    const text = data.choices?.[0]?.message?.content || ''
    console.log('Raw text:', text.slice(0, 200))

    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Debate route error:', err)
    return NextResponse.json({ error: 'Failed to generate debate' }, { status: 500 })
  }
}