'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Bookmark, BookmarkCheck, Clock, GitCompare } from 'lucide-react'
import { getReadingTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Article } from '@/lib/types'

interface NewsCardProps {
  article: Article
  index: number
  onCompareSelect?: (article: Article) => void
  isSelectedForCompare?: boolean
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
        const { error } = await supabase.from('saved_news').delete().eq('user_id', user.id).eq('url', article.url)
        if (error) throw error
        setSaved(false)
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
        toast.success('Saved!')
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

  return (
    <div
      onClick={handleClick}
      className="group relative rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 hover:-translate-y-2"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        borderColor: isSelectedForCompare ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.08)',
        boxShadow: isSelectedForCompare
          ? '0 0 30px rgba(6,182,212,0.2), 0 8px 32px rgba(0,0,0,0.3)'
          : '0 8px 32px rgba(0,0,0,0.2)',
        animationDelay: `${index * 60}ms`,
      }}
      onMouseEnter={e => {
        if (!isSelectedForCompare) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.4)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 60px rgba(0,0,0,0.4), 0 0 30px rgba(139,92,246,0.12)'
        }
      }}
      onMouseLeave={e => {
        if (!isSelectedForCompare) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)'
        }
      }}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {article.urlToImage && !imgError ? (
          <Image
            src={article.urlToImage}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.05)' }}>
            <span className="text-4xl opacity-20">📰</span>
          </div>
        )}

        {/* Image overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(4,4,15,0.9) 0%, transparent 60%)' }} />

        {/* Source badge */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-1 rounded-lg"
            style={{
              background: 'rgba(4,4,15,0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(6,182,212,0.3)',
              color: '#06B6D4'
            }}>
            {article.source?.name}
          </span>
        </div>

        {/* Action buttons — always visible on mobile, hover on desktop */}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {onCompareSelect && (
            <button
              onClick={handleCompare}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: isSelectedForCompare ? 'rgba(6,182,212,0.4)' : 'rgba(4,4,15,0.75)',
                backdropFilter: 'blur(8px)',
                border: isSelectedForCompare ? '1px solid rgba(6,182,212,0.6)' : '1px solid rgba(255,255,255,0.1)',
                color: isSelectedForCompare ? '#06B6D4' : '#8080A0',
              }}
            >
              <GitCompare size={12} />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: saved ? 'rgba(139,92,246,0.3)' : 'rgba(4,4,15,0.75)',
              backdropFilter: 'blur(8px)',
              border: saved ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
              color: saved ? '#8B5CF6' : '#8080A0',
            }}
          >
            {saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
          </button>
        </div>

        {/* Selected indicator */}
        {isSelectedForCompare && (
          <div className="absolute bottom-3 left-3">
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
              style={{
                background: 'rgba(6,182,212,0.2)',
                border: '1px solid rgba(6,182,212,0.4)',
                color: '#06B6D4'
              }}>
              ✓ Selected
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-serif text-sm font-bold leading-snug mb-2 line-clamp-2 text-text-primary group-hover:text-accent-purple transition-colors">
          {article.title}
        </h3>
        <p className="text-text-muted text-xs leading-relaxed line-clamp-2 mb-3">
          {article.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-text-muted text-xs">
            <Clock size={10} />
            <span>{readMins} min read</span>
          </div>
          <span className="text-xs text-accent-purple font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            Read more →
          </span>
        </div>
      </div>

      {/* Bottom glow on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.5), transparent)' }} />
    </div>
  )
}