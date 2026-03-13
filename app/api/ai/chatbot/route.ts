import { NextRequest } from 'next/server'
import { groq, MODELS } from '@/lib/groq'
import { checkRateLimit, sanitizeInput } from '@/lib/api-utils'

const SYSTEM_PROMPT = `You are NewsHive AI, an expert news assistant. You ONLY discuss:
- Current events and news
- Politics and world affairs  
- Sports, technology, business, health, science
- Historical events and context

You MUST REFUSE politely if asked about:
- Math problems, coding help, jokes, recipes, personal advice
- Anything unrelated to news and current events

If asked something off-topic, say: "I'm NewsHive AI, specialized in news and current events. I can't help with that, but ask me about any news topic!"

Keep responses concise, factual, and helpful. Always cite context when possible.`

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req)
  if (limited) return limited

  try {
    const { messages } = await req.json()

    const groqMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...(messages || []).slice(-20).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: sanitizeInput(m.content, 2000),
      }))
    ]

    const stream = await groq.chat.completions.create({
      model: MODELS.smart,
      messages: groqMessages,
      max_tokens: 500,
      stream: true,
    })

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const data = `data: ${JSON.stringify(chunk)}\n\n`
          controller.enqueue(encoder.encode(data))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'AI error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}