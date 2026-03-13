'use client'

import { useState } from 'react'
import { Calendar, RefreshCw, ExternalLink } from 'lucide-react'
import { useLang } from '@/components/shared/LangProvider'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface TimelineEvent {
  date: string
  headline: string
  summary: string
  significance: string
}

interface TimelineResult {
  topic: string
  overview: string
  events: TimelineEvent[]
}

const SAMPLE_TOPICS = [
  'India-Pakistan tensions 2025',
  'OpenAI GPT developments',
  'Ukraine Russia war',
  'Israel Gaza conflict',
  'Indian general elections',
  'Tesla stock price',
]

export default function TimelinePage() {
  const { lang } = useLang()
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState<TimelineResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [relatedArticles, setRelatedArticles] = useState<any[]>([])

  const generateTimeline = async (t?: string) => {
    const timelineTopic = (t ?? topic).trim()
    if (!timelineTopic) { toast.error('Enter a topic first!'); return }
    setLoading(true)
    setResult(null)
    setRelatedArticles([])

    try {
      // Fetch AI timeline + related articles in parallel
      const [aiRes, newsRes] = await Promise.all([
        fetch('/api/ai/timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: timelineTopic }),
        }),
        fetch(`/api/news?q=${encodeURIComponent(timelineTopic)}&lang=${lang}`)
      ])

      const [aiData, newsData] = await Promise.all([aiRes.json(), newsRes.json()])

      if (aiData.error) throw new Error(aiData.error)
      setResult(aiData)
      setRelatedArticles((newsData.articles || []).slice(0, 4))
    } catch {
      toast.error('Could not generate timeline. Try again!')
    } finally { setLoading(false) }
  }

  const handleArticleClick = (article: any) => {
    const params = new URLSearchParams({
      title: article.title || '',
      description: (article.description || '').slice(0, 500),
      url: article.url || '',
      image: article.urlToImage || '',
      source: article.source?.name || '',
      publishedAt: article.publishedAt || '',
      content: (article.content || '').slice(0, 800),
    })
    router.push(`/news?${params.toString()}`)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-5xl tracking-wider">
          NEWS<span className="text-accent-cyan"> TIMELINE</span>
        </h1>
        <p className="text-text-muted text-sm mt-1">Track how any story evolved over time 📅</p>
      </div>

      {/* Input */}
      <div className="glass rounded-2xl border border-white/10 p-5 mb-6">
        <label className="text-xs text-text-muted mb-2 block">Enter a topic or ongoing story</label>
        <div className="flex gap-2">
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateTimeline()}
            placeholder="e.g. India-Pakistan tensions 2025"
            className="input-field flex-1 text-sm"
          />
          <button onClick={() => generateTimeline()} disabled={loading || !topic.trim()}
            className="px-4 py-2.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-sm font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Calendar size={14} />}
            {loading ? 'Building...' : 'Timeline'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {SAMPLE_TOPICS.map(t => (
            <button key={t} onClick={() => { setTopic(t); generateTimeline(t) }}
              className="text-xs px-3 py-1.5 rounded-xl border border-white/10 text-text-muted hover:border-accent-cyan/30 hover:text-text-primary transition-all">
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-white/10 animate-pulse" />
                {i < 3 && <div className="w-px flex-1 bg-white/5 mt-1" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="skeleton h-4 w-24 rounded mb-2" />
                <div className="skeleton h-16 rounded-xl" />
              </div>
            </div>
          ))}
          <p className="text-center text-xs text-text-muted">Building timeline...</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Overview */}
          <div className="glass rounded-2xl border border-accent-cyan/20 p-5"
            style={{ background: 'rgba(6,182,212,0.05)' }}>
            <p className="text-accent-cyan text-xs font-bold tracking-wider uppercase mb-2">Overview</p>
            <h2 className="text-text-primary font-semibold mb-2">"{result.topic}"</h2>
            <p className="text-text-secondary text-sm leading-relaxed">{result.overview}</p>
          </div>

          {/* Timeline events */}
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Timeline</p>
            <div className="space-y-0">
              {result.events.map((event, i) => (
                <div key={i} className="flex gap-4">
                  {/* Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${i === 0 ? 'bg-accent-cyan shadow-glow-cyan' : 'bg-accent-purple/50'}`} />
                    {i < result.events.length - 1 && (
                      <div className="w-px flex-1 bg-gradient-to-b from-accent-purple/30 to-transparent my-1" style={{ minHeight: '40px' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-5">
                    <p className="text-xs font-mono text-accent-cyan mb-1">{event.date}</p>
                    <div className="glass rounded-xl border border-white/5 p-4 hover:border-white/10 transition-all">
                      <p className="text-text-primary text-sm font-semibold mb-1">{event.headline}</p>
                      <p className="text-text-secondary text-xs leading-relaxed mb-2">{event.summary}</p>
                      <p className="text-accent-purple text-xs italic">{event.significance}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Latest News</p>
              <div className="space-y-2">
                {relatedArticles.map((article, i) => (
                  <div key={i} onClick={() => handleArticleClick(article)}
                    className="flex gap-3 p-3 glass rounded-xl border border-white/5 hover:border-accent-cyan/20 cursor-pointer transition-all group">
                    {article.urlToImage && (
                      <img src={article.urlToImage} alt=""
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-xs font-medium line-clamp-2 group-hover:text-accent-cyan transition-colors">{article.title}</p>
                      <p className="text-text-muted text-xs mt-1">{article.source?.name}</p>
                    </div>
                    <ExternalLink size={12} className="text-text-muted flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}