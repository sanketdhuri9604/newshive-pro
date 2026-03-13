import { NextRequest, NextResponse } from 'next/server'
import { getSummary } from '@/lib/groq'
import { checkRateLimit, sanitizeInput } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req)
  if (limited) return limited

  try {
    const { title, description, content } = await req.json()
    if (!title) return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    const text = `${sanitizeInput(title, 500)}. ${sanitizeInput(description || '', 1000)} ${sanitizeInput(content || '', 3000)}`.trim()
    const summary = await getSummary(text)
    return NextResponse.json({ summary })
  } catch (err) {
    return NextResponse.json({ error: 'AI error' }, { status: 500 })
  }
} 