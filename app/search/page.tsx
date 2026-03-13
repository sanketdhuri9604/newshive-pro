'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLang } from '@/components/shared/LangProvider'
import { Search, X, Clock, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Article } from '@/lib/types'

const HISTORY_KEY = 'newshive_search_history'
const MAX_HISTORY = 8

function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}

function saveToHistory(q: string) {
  try {
    const prev = getHistory().filter(h => h !== q)
    localStorage.setItem(HISTORY_KEY, JSON.stringify([q, ...prev].slice(0, MAX_HISTORY)))
  } catch {}
}

function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY) } catch {}
}

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang } = useLang()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    setHistory(getHistory())
    if (searchParams.get('q')) handleSearch(searchParams.get('q')!)
  }, [])

  const handleSearch = async (q?: string) => {
    const searchQ = (q ?? query).trim()
    if (!searchQ) return
    setLoading(true)
    setSearched(true)
    saveToHistory(searchQ)
    setHistory(getHistory())
    try {
      const res = await fetch(`/api/news?q=${encodeURIComponent(searchQ)}&lang=${lang}`)
      const data = await res.json()
      setArticles(data.articles || [])
    } catch {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleHistoryClick = (h: string) => {
    setQuery(h)
    handleSearch(h)
  }

  const removeFromHistory = (h: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = getHistory().filter(item => item !== h)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    setHistory(updated)
  }

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
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
    <div className="max-w-3xl mx-auto px-4 py-8">

      <div className="mb-8">
        <h1 className="font-display text-5xl tracking-wider mb-6">
          NEWS<span className="text-accent-purple">SEARCH</span>
        </h1>

        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search news..."
            className="input-field pl-11 pr-12 py-4 text-base"
          />
          {query && (
            <button onClick={() => { setQuery(''); setArticles([]); setSearched(false) }}
              className="absolute right-14 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X size={14} />
            </button>
          )}
          <button onClick={() => handleSearch()} disabled={loading || !query.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-accent-purple hover:bg-accent-purple/90 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all">
            {loading ? '...' : 'Go'}
          </button>
        </div>
      </div>

      {/* Search History — show when not searched */}
      {!searched && history.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
              <Clock size={12} /> Recent Searches
            </p>
            <button onClick={handleClearHistory}
              className="text-xs text-text-muted hover:text-accent-red transition-colors">
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map(h => (
              <div key={h}
                onClick={() => handleHistoryClick(h)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-sm text-text-secondary hover:border-accent-purple/30 hover:text-text-primary cursor-pointer transition-all group">
                <Clock size={11} className="text-text-muted" />
                {h}
                <button onClick={e => removeFromHistory(h, e)}
                  className="text-text-muted hover:text-accent-red opacity-0 group-hover:opacity-100 transition-all">
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={13} className="text-text-muted" />
            <p className="text-xs text-text-muted">
              {articles.length > 0 ? `${articles.length} results for "${query}"` : `No results for "${query}"`}
            </p>
            <button onClick={() => { setSearched(false); setArticles([]); setQuery('') }}
              className="ml-auto text-xs text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors">
              <X size={11} /> Clear
            </button>
          </div>
          <div className="space-y-3">
            {articles.map((article, i) => (
              <div key={i} onClick={() => handleArticleClick(article)}
                className="flex gap-4 p-4 glass rounded-2xl border border-white/5 hover:border-accent-purple/30 transition-all cursor-pointer group">
                {article.urlToImage && (
                  <img src={article.urlToImage} alt=""
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm font-semibold line-clamp-2 group-hover:text-accent-purple transition-colors">
                    {article.title}
                  </p>
                  {article.description && (
                    <p className="text-text-muted text-xs line-clamp-2 mt-1">{article.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-text-muted">{article.source?.name}</span>
                    <span className="text-text-muted opacity-30">•</span>
                    <span className="text-xs text-text-muted">
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Initial state */}
      {!loading && !searched && history.length === 0 && (
        <div className="text-center py-20">
          <Search size={40} className="mx-auto mb-3 text-text-muted opacity-20" />
          <p className="text-text-muted text-sm">Type something to search news</p>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="skeleton h-12 rounded-2xl mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}