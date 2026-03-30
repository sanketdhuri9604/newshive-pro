'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Bookmark, BookmarkCheck, Clock, GitCompare, Calendar } from 'lucide-react'
import { getReadingTime, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Article } from '@/lib/types'

interface NewsCardProps {
  article: Article
  index: number
  onCompareSelect?: (article: Article) => void
  isSelectedForCompare?: boolean
}

const PLACEHOLDER_MAP: Record<string, { color: string; label: string }> = {
  technology: { color: 'rgba(6,182,212,0.15)',  label: '💻' },
  business:   { color: 'rgba(139,92,246,0.15)', label: '📈' },
  sports:     { color: 'rgba(249,115,22,0.15)', label: '⚽' },
  health:     { color: 'rgba(16,185,129,0.15)', label: '🩺' },
  science:    { color: 'rgba(236,72,153,0.15)', label: '🔬' },
  world:      { color: 'rgba(6,182,212,0.12)',  label: '🌍' },
  general:    { color: 'rgba(139,92,246,0.08)', label: '📰' },
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 2)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export default function NewsCard({ article, index, onCompareSelect, isSelectedForCompare }: NewsCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (!user || !article.url) return
    supabase.from('saved_news')
      .select('id')
      .eq('user_id', user.id)
      .eq('url', article.url)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data))
  }, [user, article.url])

  const handleClick = () => {
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

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) { toast.error('Login to save articles'); return }
    setSaving(true)
    try {
      if (saved) {
        const { error } = await supabase
          .from('saved_news').delete()
          .eq('user_id', user.id).eq('url', article.url)
        if (error) throw error
        setSaved(false)
        toast('Removed from saved', { icon: '🗑️' })
      } else {
        const { error } = await supabase.from('saved_news').insert({
          user_id: user.id,
          title: article.title,
          url: article.url,
          image_url: article.urlToImage,
          description: article.description,
          source: article.source?.name,
        })
        if (error) throw error
        setSaved(true)
        toast(
          (t) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>Saved!</span>
              <button
                onClick={async () => {
                  toast.dismiss(t.id)
                  await supabase.from('saved_news').delete()
                    .eq('user_id', user.id).eq('url', article.url)
                  setSaved(false)
                  toast('Undone', { icon: '↩️' })
                }}
                style={{
                  fontSize: '11px', fontWeight: 700,
                  color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.4)',
                  borderRadius: '6px', padding: '2px 8px',
                  background: 'rgba(139,92,246,0.1)', cursor: 'pointer',
                }}
              >
                Undo
              </button>
            </div>
          ),
          { icon: '🔖', duration: 4000 }
        )
      }
    } catch {
      toast.error('Could not save. Try again.')
    }
    setSaving(false)
  }

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCompareSelect?.(article)
  }

  const readMins = getReadingTime(`${article.description || ''} ${article.content || ''}`)
  const showPlaceholder = !article.urlToImage || imgError
  const sourceLower = (article.source?.name || '').toLowerCase()
  const placeholderKey = Object.keys(PLACEHOLDER_MAP).find(k => sourceLower.includes(k)) || 'general'
  const placeholder = PLACEHOLDER_MAP[placeholderKey]
  const publishedTime = timeAgo(article.publishedAt || '')

  return (
    <div
      onClick={handleClick}
      className={cn(
        'news-card group relative rounded-2xl overflow-hidden border cursor-pointer',
        'transition-all duration-300 hover:-translate-y-2 animate-fade-in',
        isSelectedForCompare ? 'news-card--selected' : 'news-card--default'
      )}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
    >
      {/* Image / Placeholder */}
      <div className="relative h-48 overflow-hidden">
        {!showPlaceholder ? (
          <Image
            src={article.urlToImage!}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-3"
            style={{ background: placeholder.color }}
          >
            <span className="text-5xl opacity-60 group-hover:scale-110 transition-transform duration-300">
              {placeholder.label}
            </span>
            <span className="text-[10px] font-mono text-text-muted tracking-widest uppercase opacity-60">
              {article.source?.name || 'News'}
            </span>
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.3) 0px, transparent 1px, transparent 24px), repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0px, transparent 1px, transparent 24px)',
              backgroundSize: '24px 24px',
            }} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,4,15,0.9)] via-transparent to-transparent" />

        {/* Source badge */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-1 rounded-lg
            bg-[rgba(4,4,15,0.8)] backdrop-blur-sm border border-accent-cyan/30 text-accent-cyan">
            {article.source?.name}
          </span>
        </div>

        {/* ✅ Action buttons — always visible (removed md:opacity-0) */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {onCompareSelect && (
            <button
              onClick={handleCompare}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-all backdrop-blur-sm',
                isSelectedForCompare
                  ? 'bg-accent-cyan/40 border border-accent-cyan/60 text-accent-cyan'
                  : 'bg-[rgba(4,4,15,0.75)] border border-white/10 text-text-muted hover:border-accent-cyan/40 hover:text-accent-cyan'
              )}
            >
              <GitCompare size={12} />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-all backdrop-blur-sm',
              saved
                ? 'bg-accent-purple/30 border border-accent-purple/50 text-accent-purple'
                : 'bg-[rgba(4,4,15,0.75)] border border-white/10 text-text-muted hover:border-accent-purple/40 hover:text-accent-purple'
            )}
          >
            {saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
          </button>
        </div>

        {/* Selected indicator */}
        {isSelectedForCompare && (
          <div className="absolute bottom-3 left-3">
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg
              bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan">
              ✓ Selected
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-serif text-sm font-bold leading-snug mb-2 line-clamp-2
          text-text-primary group-hover:text-accent-purple transition-colors duration-200">
          {article.title}
        </h3>
        <p className="text-text-muted text-xs leading-relaxed line-clamp-2 mb-3">
          {article.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-text-muted text-xs">
            <div className="flex items-center gap-1">
              <Clock size={10} />
              <span>{readMins} min read</span>
            </div>
            {publishedTime && (
              <div className="flex items-center gap-1">
                <Calendar size={10} />
                <span>{publishedTime}</span>
              </div>
            )}
          </div>
          <span className="text-xs text-accent-purple font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Read more →
          </span>
        </div>
      </div>

      {/* Bottom glow on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300
        bg-gradient-to-r from-transparent via-accent-purple/50 to-transparent" />
    </div>
  )
}
