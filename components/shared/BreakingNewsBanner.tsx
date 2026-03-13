'use client'

import { useState, useEffect, useRef } from 'react'
import { useLang } from '@/components/shared/LangProvider'
import { Zap, X } from 'lucide-react'

interface Article {
  title: string
  url: string
  source: { name: string }
}

export default function BreakingNewsBanner() {
  const { lang } = useLang()
  const [headlines, setHeadlines] = useState<Article[]>([])
  const [dismissed, setDismissed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchBreaking()
    const interval = setInterval(fetchBreaking, 5 * 60 * 1000) // refresh every 5 min
    return () => clearInterval(interval)
  }, [lang])

  const fetchBreaking = async () => {
    try {
      const res = await fetch(`/api/news?category=general&lang=${lang}`)
      const data = await res.json()
      setHeadlines((data.articles || []).slice(0, 8))
      setDismissed(false)
    } catch {}
  }

  if (dismissed || headlines.length === 0) return null

  return (
    <div className="bg-accent-red/10 border-b border-accent-red/20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 h-9 flex items-center gap-3">
        {/* Label */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse" />
          <Zap size={11} className="text-accent-red" />
          <span className="text-accent-red text-xs font-bold tracking-wider uppercase">Breaking</span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-accent-red/30 flex-shrink-0" />

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden relative">
          <div
            ref={scrollRef}
            className="flex gap-12 animate-ticker whitespace-nowrap"
            style={{ animationDuration: `${headlines.length * 8}s` }}
          >
            {[...headlines, ...headlines].map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
              >
                <span className="text-accent-red/60 mr-2">●</span>
                {article.title}
                <span className="text-text-muted ml-2">— {article.source?.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Dismiss */}
        <button onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 text-text-muted hover:text-text-primary transition-colors">
          <X size={13} />
        </button>
      </div>
    </div>
  )
}