// app/api/ai/fact-check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { input, type } = await req.json()

    if (!input || typeof input !== 'string' || input.trim().length < 20) {
      return NextResponse.json({ error: 'Please provide more content to analyze.' }, { status: 400 })
    }

    let contentToAnalyze = input.trim()

    // If URL, try to extract readable content via a simple fetch
    if (type === 'url') {
      try {
        const res = await fetch(input.trim(), {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsHive/1.0)' },
          signal: AbortSignal.timeout(8000),
        })
        const html = await res.text()

        // Strip HTML tags to get raw text
        const stripped = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 3000) // Limit to avoid token overflow

        if (stripped.length > 100) {
          contentToAnalyze = stripped
        } else {
          return NextResponse.json({ error: 'Could not extract content from this URL. Try pasting the text directly.' }, { status: 400 })
        }
      } catch {
        return NextResponse.json({ error: 'Could not fetch the URL. Try pasting the article text directly.' }, { status: 400 })
      }
    }

    const res = await groq.chat.completions.create({
      model: MODELS.smart,
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `You are an expert fact-checker and misinformation analyst. Analyze the following news content and respond ONLY with valid JSON in this exact format:
{
  "verdict": "<real|fake|misleading|unverified>",
  "confidence": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "claims": [
    {
      "claim": "<specific claim extracted from the text>",
      "verdict": "<true|false|misleading|unverified>",
      "explanation": "<one sentence explanation>"
    }
  ],
  "redFlags": ["<red flag 1>", "<red flag 2>"],
  "positiveSignals": ["<signal 1>", "<signal 2>"]
}

Rules:
- Extract 2-4 key claims from the content
- redFlags: things that suggest this might be fake/misleading (sensational language, no sources, vague attribution, emotional manipulation, etc.)
- positiveSignals: things that suggest this might be credible (specific details, named sources, verifiable facts, neutral tone, etc.)
- Be objective and analytical
- If content is too short or unclear, set verdict to "unverified"

News Content:
${contentToAnalyze}`
      }]
    })

    const raw = res.choices[0]?.message?.content || '{}'
    const clean = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    return NextResponse.json(result)
  } catch (err) {
    console.error('[fact-check]', err)
    return NextResponse.json({
      verdict: 'unverified',
      confidence: 0,
      summary: 'Analysis failed. Please try again.',
      claims: [],
      redFlags: [],
      positiveSignals: []
    }, { status: 500 })
  }
}