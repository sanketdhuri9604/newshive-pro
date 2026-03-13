import { NextRequest, NextResponse } from 'next/server'
import { translateText } from '@/lib/groq'
import { checkRateLimit, sanitizeInput } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req)
  if (limited) return limited

  try {
    const { text, targetLanguage } = await req.json()
    const translated = await translateText(
      sanitizeInput(text, 5000),
      sanitizeInput(targetLanguage, 50)
    )
    return NextResponse.json({ translated })
  } catch {
    return NextResponse.json({ error: 'AI error' }, { status: 500 })
  }
}
