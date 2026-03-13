'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Bookmark, Trash2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import type { SavedArticle } from '@/lib/types'

export default function SavedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [saved, setSaved] = useState<SavedArticle[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    fetchSaved()
  }, [user, loading])

  const fetchSaved = async () => {
    setFetching(true)
    try {
      const { data, error } = await supabase
        .from('saved_news')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setSaved(data || [])
    } catch {
      toast.error('Failed to load saved articles')
    } finally {
      setFetching(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('saved_news').delete().eq('id', id)
      if (error) throw error
      setSaved(prev => prev.filter(s => s.id !== id))
      toast.success('Removed from saved')
    } catch {
      toast.error('Failed to remove article')
    }
  }

  const handleCardClick = (article: SavedArticle) => {
    const params = new URLSearchParams({
      title: article.title || '',
      description: (article.description || '').slice(0, 500),
      url: article.url || '',
      image: article.image_url || '',
      source: article.source || '',
    })
    router.push(`/news?${params.toString()}`)
  }

  // Auth loading — wait karo
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Bookmark size={20} className="text-accent-purple" />
          <h1 className="font-display text-5xl tracking-wider">
            SAVED<span className="text-accent-purple"> NEWS</span>
          </h1>
        </div>
        <p className="text-text-muted text-sm">{saved.length} article{saved.length !== 1 ? 's' : ''} saved</p>
      </div>

      {/* Loading */}
      {fetching && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-white/5">
              <div className="skeleton h-44" />
              <div className="p-4 space-y-3 bg-bg-card">
                <div className="skeleton h-4 rounded-full w-3/4" />
                <div className="skeleton h-3 rounded-full w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!fetching && saved.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center mx-auto mb-4">
            <Bookmark size={28} className="text-accent-purple opacity-50" />
          </div>
          <h3 className="text-text-primary font-semibold mb-2">No saved articles yet</h3>
          <p className="text-text-muted text-sm mb-4">Click the bookmark icon on any article to save it</p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 bg-accent-purple hover:bg-accent-purple/90 text-white text-sm font-medium rounded-xl transition-all"
          >
            Browse News →
          </button>
        </div>
      )}

      {/* Saved Grid */}
      {!fetching && saved.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map((article) => (
            <div
              key={article.id}
              onClick={() => handleCardClick(article)}
              className="group bg-bg-card rounded-2xl overflow-hidden border border-white/5 hover:border-accent-purple/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-purple cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden bg-bg-secondary">
                {article.image_url ? (
                  <img
                    src={article.image_url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl opacity-20">📰</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-card/90 to-transparent" />

                {/* Source */}
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-mono text-accent-cyan bg-bg-primary/80 backdrop-blur-sm border border-accent-cyan/20 px-2 py-1 rounded-md">
                    {article.source}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(article.id) }}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-bg-primary/60 backdrop-blur-sm border border-white/10 text-text-muted hover:text-accent-red hover:border-accent-red/30 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-text-primary font-semibold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-accent-purple transition-colors">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-text-muted text-xs leading-relaxed line-clamp-2 mb-3">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    {new Date(article.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-accent-purple opacity-0 group-hover:opacity-100 transition-opacity font-medium flex items-center gap-1">
                    <ExternalLink size={10} /> Read more
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}