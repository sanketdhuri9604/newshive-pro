'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Clock, Trash2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface HistoryArticle {
  id: string
  user_id: string
  title: string
  url: string
  image_url?: string | null
  description?: string
  source?: string
  read_at: string
}

export default function HistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [history, setHistory] = useState<HistoryArticle[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    fetchHistory()
  }, [user, loading])

  const fetchHistory = async () => {
    setFetching(true)
    try {
      const { data, error } = await supabase
        .from('reading_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('read_at', { ascending: false })
      if (error) throw error
      setHistory(data || [])
    } catch {
      toast.error('Failed to load reading history')
    } finally {
      setFetching(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('reading_history').delete().eq('id', id)
      if (error) throw error
      setHistory(prev => prev.filter(h => h.id !== id))
      toast.success('Removed from history')
    } catch {
      toast.error('Failed to remove')
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Clear all reading history?')) return
    try {
      const { error } = await supabase.from('reading_history').delete().eq('user_id', user!.id)
      if (error) throw error
      setHistory([])
      toast.success('History cleared!')
    } catch {
      toast.error('Failed to clear history')
    }
  }

  const handleCardClick = (article: HistoryArticle) => {
    const params = new URLSearchParams({
      title: article.title || '',
      description: (article.description || '').slice(0, 500),
      url: article.url || '',
      image: article.image_url || '',
      source: article.source || '',
    })
    router.push(`/news?${params.toString()}`)
  }

  // Group by date
  const grouped = history.reduce((acc, article) => {
    const date = new Date(article.read_at).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(article)
    return acc
  }, {} as Record<string, HistoryArticle[]>)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-accent-cyan" />
            <h1 className="font-display text-5xl tracking-wider">
              READ<span className="text-accent-cyan"> HISTORY</span>
            </h1>
          </div>
          <p className="text-text-muted text-sm">{history.length} article{history.length !== 1 ? 's' : ''} read</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-3 py-2 text-xs text-accent-red border border-accent-red/20 hover:bg-accent-red/10 rounded-xl transition-all"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Loading skeletons */}
      {fetching && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!fetching && history.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-accent-cyan opacity-50" />
          </div>
          <h3 className="text-text-primary font-semibold mb-2">No reading history yet</h3>
          <p className="text-text-muted text-sm mb-4">Articles you read will appear here</p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 bg-accent-cyan hover:bg-accent-cyan/90 text-white text-sm font-medium rounded-xl transition-all"
          >
            Browse News →
          </button>
        </div>
      )}

      {/* Grouped History */}
      {!fetching && history.length > 0 && (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, articles]) => (
            <div key={date}>
              <p className="text-xs font-mono text-text-muted mb-3 uppercase tracking-wider">{date}</p>
              <div className="space-y-2">
                {articles.map(article => (
                  <div
                    key={article.id}
                    onClick={() => handleCardClick(article)}
                    className="flex gap-4 p-4 glass rounded-2xl border border-white/5 hover:border-accent-cyan/30 transition-all cursor-pointer group"
                  >
                    {/* Image */}
                    {article.image_url && (
                      <img
                        src={article.image_url}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-semibold line-clamp-2 group-hover:text-accent-cyan transition-colors">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {article.source && (
                          <span className="text-xs text-text-muted">{article.source}</span>
                        )}
                        <span className="text-text-muted opacity-30">•</span>
                        <span className="text-xs text-text-muted">
                          {new Date(article.read_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <ExternalLink size={10} /> Open
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(article.id) }}
                        className="p-1.5 rounded-lg text-text-muted hover:text-accent-red transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}