import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req)
  if (limited) return limited

  try {
    const { title, content } = await req.json()
    if (!title) return NextResponse.json({ minutes: 3 })
    const text = `${title}. ${content || ''}`
    const wordCount = text.trim().split(/\s+/).length
    const minutes = Math.max(1, Math.ceil(wordCount / 200))
    return NextResponse.json({ minutes })
  } catch {
    return NextResponse.json({ minutes: 3 })
  }
}