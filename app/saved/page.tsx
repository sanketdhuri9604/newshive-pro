'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Bookmark, Trash2, ExternalLink, GitCompare } from 'lucide-react'
import toast from 'react-hot-toast'
import type { SavedArticle } from '@/lib/types'

export default function SavedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [saved, setSaved] = useState<SavedArticle[]>([])
  const [fetching, setFetching] = useState(true)

  // ✅ Compare state
  const [compareList, setCompareList] = useState<SavedArticle[]>([])

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
      setCompareList(prev => prev.filter(s => s.id !== id))
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

  // ✅ Toggle article in compare list
  const toggleCompare = (e: React.MouseEvent, article: SavedArticle) => {
    e.stopPropagation()
    setCompareList(prev => {
      const already = prev.find(a => a.id === article.id)
      if (already) return prev.filter(a => a.id !== article.id)
      if (prev.length >= 2) {
        toast.error('Sirf 2 articles compare kar sakte ho!')
        return prev
      }
      return [...prev, article]
    })
  }

  // ✅ Navigate to compare page
  const goCompare = () => {
    if (compareList.length < 2) return
    const [a1, a2] = compareList
    const params = new URLSearchParams({
      title1: a1.title || '',
      desc1: (a1.description || '').slice(0, 300),
      source1: a1.source || '',
      image1: a1.image_url || '',
      url1: a1.url || '',
      title2: a2.title || '',
      desc2: (a2.description || '').slice(0, 300),
      source2: a2.source || '',
      image2: a2.image_url || '',
      url2: a2.url || '',
    })
    router.push(`/compare?${params.toString()}`)
  }

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
        <>
          {/* ✅ Compare hint */}
          {saved.length >= 2 && compareList.length === 0 && (
            <div className="mb-4 flex items-center gap-2 text-xs text-text-muted px-3 py-2 rounded-xl border border-white/5 w-fit"
              style={{ background: 'rgba(139,92,246,0.05)' }}>
              <GitCompare size={12} className="text-accent-purple" />
              Click on compare button on articles to cmpare them (max2)
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {saved.map((article) => {
              const isSelected = !!compareList.find(a => a.id === article.id)
              return (
                <div
                  key={article.id}
                  onClick={() => handleCardClick(article)}
                  className={`group bg-bg-card rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 cursor-pointer relative ${
                    isSelected
                      ? 'border-accent-purple/60 shadow-glow-purple'
                      : 'border-white/5 hover:border-accent-purple/30 hover:shadow-glow-purple'
                  }`}
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

                    {/* ✅ Compare button — top right */}
                    <button
                      onClick={(e) => toggleCompare(e, article)}
                      className={`absolute top-3 right-3 p-1.5 rounded-lg border text-[10px] font-semibold transition-all flex items-center gap-1 backdrop-blur-sm ${
                        isSelected
                          ? 'bg-accent-purple text-white border-accent-purple'
                          : 'bg-bg-primary/70 text-text-muted border-white/10 hover:border-accent-purple/40 hover:text-accent-purple'
                      }`}
                    >
                      <GitCompare size={11} />
                      {isSelected ? '✓' : 'Compare'}
                    </button>

                    {/* Delete button — bottom right of image */}
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(article.id) }}
                      className="absolute bottom-3 right-3 p-2 rounded-lg bg-bg-primary/60 backdrop-blur-sm border border-white/10 text-text-muted hover:text-accent-red hover:border-accent-red/30 transition-all opacity-0 group-hover:opacity-100"
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
              )
            })}
          </div>
        </>
      )}

      {/* ✅ Floating Compare Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border border-accent-purple/40 shadow-glow-purple backdrop-blur-md"
          style={{ background: 'rgba(10,10,30,0.92)' }}>
          <GitCompare size={16} className="text-accent-purple" />
          <span className="text-sm text-text-primary font-medium">
            {compareList.length}/2 selected
          </span>
          {compareList.map(a => (
            <span key={a.id} className="text-xs text-accent-purple/70 border border-accent-purple/20 px-2 py-0.5 rounded-lg max-w-[120px] truncate">
              {a.title}
            </span>
          ))}
          {compareList.length === 2 && (
            <button
              onClick={goCompare}
              className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}
            >
              Compare →
            </button>
          )}
          <button
            onClick={() => setCompareList([])}
            className="text-xs text-text-muted hover:text-text-primary transition-colors ml-1"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  )
}