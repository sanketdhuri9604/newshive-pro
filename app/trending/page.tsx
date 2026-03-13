'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/components/shared/LangProvider'
import { Flame, TrendingUp, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Article } from '@/lib/types'

export default function TrendingPage() {
  const { t, lang } = useLang()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState('')
  const [analysisLoading, setAnalysisLoading] = useState(false)

  useEffect(() => { fetchTrending() }, [lang])

  const fetchTrending = async () => {
    setLoading(true)
    setAnalysis('') // language change pe purana analysis reset
    try {
      const res = await fetch(`/api/news?category=general&lang=${lang}`)
      const data = await res.json()
      setArticles(data.articles?.slice(0, 10) || [])
    } catch {
      toast.error('Failed to load trending news')
    }
    finally { setLoading(false) }
  }

  const fetchAnalysis = async () => {
    if (!articles.length) return
    setAnalysisLoading(true)
    try {
      const res = await fetch('/api/ai/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headlines: articles.slice(0, 6).map(a => a.title)
        }),
      })
      const data = await res.json()
      setAnalysis(data.analysis || '')
    } catch {
      toast.error('Failed to analyze trends')
    }
    finally { setAnalysisLoading(false) }
  }

  const handleArticleClick = (article: Article) => {
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
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Flame size={20} className="text-accent-orange" />
          <h1 className="font-display text-5xl tracking-wider">
            TREND<span className="text-accent-orange">ING</span>
          </h1>
        </div>
        <p className="text-text-muted text-sm">Top stories right now — AI ranked</p>
      </div>

      {/* AI Analysis Button */}
      {!analysis && (
        <button
          onClick={fetchAnalysis}
          disabled={analysisLoading || loading}
          className="flex items-center gap-2 px-4 py-2.5 mb-6 bg-accent-purple/10 hover:bg-accent-purple/20 border border-accent-purple/20 text-accent-purple text-sm rounded-xl transition-all font-medium disabled:opacity-50"
        >
          <Zap size={14} />
          {analysisLoading ? 'Analyzing trends...' : 'AI Trend Analysis'}
        </button>
      )}

      {/* AI Analysis Result */}
      {analysis && (
        <div className="glass rounded-2xl border border-accent-purple/20 p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-accent-purple" />
            <span className="text-sm font-semibold text-accent-purple">AI Trend Analysis</span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">{analysis}</p>
        </div>
      )}

      {/* Articles List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article, i) => (
            <div
              key={i}
              onClick={() => handleArticleClick(article)}
              className="flex gap-4 p-4 glass rounded-2xl border border-white/5 hover:border-accent-purple/30 transition-all cursor-pointer group hover:-translate-x-1"
            >
              {/* Rank number */}
              <div className="flex-shrink-0 w-10 flex items-center justify-center">
                <span className={`font-display text-3xl ${
                  i === 0 ? 'text-accent-orange' :
                  i === 1 ? 'text-gray-400' :
                  i === 2 ? 'text-amber-600' :
                  'text-text-muted opacity-40'
                }`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Image */}
              {article.urlToImage && (
                <img
                  src={article.urlToImage}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-semibold line-clamp-2 group-hover:text-accent-purple transition-colors">
                  {article.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-text-muted">{article.source?.name}</span>
                  <span className="text-text-muted opacity-30">•</span>
                  <span className="text-xs text-text-muted">
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 flex items-center">
                <span className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity text-sm">→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}