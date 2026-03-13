import { NextRequest, NextResponse } from 'next/server'
import { checkToxicity } from '@/lib/groq'
import { checkRateLimit, sanitizeInput } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req)
  if (limited) return limited

  try {
    const { comment } = await req.json()
    const result = await checkToxicity(sanitizeInput(comment, 2000))
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'AI error' }, { status: 500 })
  }
}
