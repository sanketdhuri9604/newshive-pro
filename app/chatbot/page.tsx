'use client'

import { useState, useRef, useEffect } from 'react'
import { useLang } from '@/components/shared/LangProvider'
import { Send, Bot, User, Zap } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatbotPage() {
  const { t } = useLang()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm NewsHive AI 🤖 Ask me anything about news, current events, politics, sports, technology, or world affairs. I'm here to help you understand the news better!"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const sendMessage = async () => {
    const msg = input.trim()
    if (!msg || loading) return

    setInput('')
    setLoading(true)
    setStreaming('')

    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)

    try {
      const res = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok) throw new Error('Failed')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') break
              try {
                const json = JSON.parse(data)
                const token = json.choices?.[0]?.delta?.content || ''
                full += token
                setStreaming(full)
              } catch {}
            }
          }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: full }])
      setStreaming('')
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again!"
      }])
    } finally {
      setLoading(false)
      setStreaming('')
      inputRef.current?.focus()
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-4rem)]">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center shadow-glow-purple">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">NewsHive AI</h1>
          <p className="text-xs text-text-muted">Powered by Groq • News & Current Events</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-400/10 border border-green-400/20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-none">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center flex-shrink-0 mt-1">
                <Zap size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent-purple/20 border border-accent-purple/30 text-text-primary rounded-br-sm'
                : 'glass border border-white/5 text-text-secondary rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                <User size={14} className="text-text-muted" />
              </div>
            )}
          </div>
        ))}

        {/* Streaming response */}
        {streaming && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center flex-shrink-0 mt-1">
              <Zap size={14} className="text-white" />
            </div>
            <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-sm glass border border-white/5 text-text-secondary text-sm leading-relaxed">
              {streaming}
              <span className="inline-block w-1.5 h-4 bg-accent-purple ml-0.5 animate-pulse" />
            </div>
          </div>
        )}

        {/* Loading dots */}
        {loading && !streaming && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center flex-shrink-0">
              <Zap size={14} className="text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm glass border border-white/5">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className="w-2 h-2 rounded-full bg-accent-purple/60 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3 pt-4 border-t border-white/5">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask about any news topic..."
          disabled={loading}
          className="flex-1 input-field disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-4 py-3 bg-accent-purple hover:bg-accent-purple/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all hover:shadow-glow-purple flex items-center gap-2 min-w-[44px] justify-center"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}