import { NextRequest, NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'
import { checkRateLimit, sanitizeInput } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req)
  if (limited) return limited

  try {
    const { article1, article2 } = await req.json()
    if (!article1 || !article2) return NextResponse.json({ comparison: '' })

    const safe1 = {
      title: sanitizeInput(article1.title || '', 500),
      description: sanitizeInput(article1.description || '', 1000),
      source: sanitizeInput(article1.source || '', 100),
    }
    const safe2 = {
      title: sanitizeInput(article2.title || '', 500),
      description: sanitizeInput(article2.description || '', 1000),
      source: sanitizeInput(article2.source || '', 100),
    }

    const completion = await groq.chat.completions.create({
      model: MODELS.smart,
      messages: [{
        role: 'user',
        content: `Compare these two news articles covering similar topics. Analyze differences in framing, tone, bias, and key points highlighted. Write 3-4 sentences as plain text only, no JSON, no bullet points.

Article 1 (${safe1.source}):
Title: ${safe1.title}
Description: ${safe1.description}

Article 2 (${safe2.source}):
Title: ${safe2.title}
Description: ${safe2.description}

Write your comparison analysis:`
      }],
      max_tokens: 300,
    })

    const comparison = completion.choices[0]?.message?.content?.trim() || ''
    return NextResponse.json({ comparison })
  } catch {
    return NextResponse.json({ comparison: 'Could not compare articles right now. Please try again.' })
  }
}