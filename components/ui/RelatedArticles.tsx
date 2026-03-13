'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/components/shared/LangProvider'
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

interface Article {
  title: string
  url: string
  urlToImage?: string
  source?: { name: string }
  publishedAt?: string
  description?: string
  content?: string
}

export default function RelatedArticles({ title, category }: { title: string; category?: string }) {
  const { lang } = useLang()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open && articles.length === 0) fetchRelated()
  }, [open])

  const fetchRelated = async () => {
    setLoading(true)
    try {
      // Extract 2-3 keywords from title
      const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is', 'was', 'are', 'with', 'that', 'this', 'it', 'as', 'by', 'from'])
      const keywords = title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .split(' ')
        .filter(w => w.length > 3 && !stopWords.has(w))
        .slice(0, 3)
        .join(' ')

      const query = keywords || category || 'general'
      const res = await fetch(`/api/news?q=${encodeURIComponent(query)}&lang=${lang}`)
      const data = await res.json()

      // Filter out current article
      const filtered = (data.articles || [])
        .filter((a: Article) => a.title !== title)
        .slice(0, 4)

      setArticles(filtered)
    } catch {}
    finally { setLoading(false) }
  }

  const handleClick = (article: Article) => {
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
    <div className="rounded-2xl border overflow-hidden transition-all"
      style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', borderColor: open ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.08)' }}>

      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
        <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <span className="text-lg">🔗</span> Related Articles
        </span>
        {open ? <ChevronUp size={15} className="text-accent-cyan" /> : <ChevronDown size={15} className="text-text-muted" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : articles.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-4">No related articles found</p>
          ) : (
            <div className="space-y-2">
              {articles.map((article, i) => (
                <div key={i} onClick={() => handleClick(article)}
                  className="flex gap-3 p-3 rounded-xl border border-white/5 hover:border-accent-cyan/20 hover:bg-white/3 cursor-pointer transition-all group">
                  {article.urlToImage && (
                    <img src={article.urlToImage} alt=""
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-xs font-medium line-clamp-2 group-hover:text-accent-cyan transition-colors">
                      {article.title}
                    </p>
                    <p className="text-text-muted text-xs mt-1">{article.source?.name}</p>
                  </div>
                  <ExternalLink size={12} className="text-text-muted flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}