'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/components/shared/LangProvider'
import { Sparkles, Flame, GitCompare, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Article } from '@/lib/types'

const TOPIC_TO_QUERY: Record<string, string> = {
  technology: 'technology',
  sports: 'sports',
  politics: 'politics',
  business: 'business',
  entertainment: 'entertainment',
  health: 'health',
  science: 'science',
  world: 'world',
  cricket: 'cricket',
  bollywood: 'bollywood',
  startups: 'startups',
  climate: 'climate change',
}

function extractTopicsFromHistory(titles: string[]): string[] {
  const keywords: Record<string, string[]> = {
    technology: ['tech', 'ai', 'software', 'app', 'digital', 'cyber', 'robot', 'internet', 'data'],
    sports: ['sport', 'match', 'team', 'player', 'game', 'championship', 'tournament', 'win', 'loss'],
    politics: ['government', 'minister', 'election', 'party', 'parliament', 'vote', 'policy', 'political'],
    business: ['market', 'stock', 'economy', 'company', 'startup', 'investment', 'finance', 'trade'],
    entertainment: ['film', 'movie', 'music', 'actor', 'celebrity', 'award', 'box office'],
    health: ['health', 'covid', 'hospital', 'doctor', 'medicine', 'disease', 'vaccine'],
    science: ['science', 'research', 'study', 'space', 'nasa', 'discovery', 'climate'],
    cricket: ['cricket', 'ipl', 'bcci', 'test match', 'wicket', 'century', 'kohli', 'rohit'],
    bollywood: ['bollywood', 'hindi film', 'srk', 'salman', 'deepika', 'ranveer'],
  }
  const counts: Record<string, number> = {}
  const allText = titles.join(' ').toLowerCase()
  for (const [topic, words] of Object.entries(keywords)) {
    counts[topic] = words.filter(w => allText.includes(w)).length
  }
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
    .slice(0, 3)
}

function ForYouContent() {
  const { user } = useAuth()
  const { lang } = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isCompareMode = searchParams.get('compareMode') === 'true'

  const compareArticle1 = isCompareMode
    ? (() => { try { return JSON.parse(sessionStorage.getItem('compare_article1') || '') } catch { return null } })()
    : null

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTopics, setActiveTopics] = useState<string[]>([])
  const [source, setSource] = useState<'topics' | 'history' | 'general'>('general')

  const [compareList, setCompareList] = useState<Article[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = sessionStorage.getItem('foryou_compareList')
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  useEffect(() => {
    sessionStorage.setItem('foryou_compareList', JSON.stringify(compareList))
  }, [compareList])

  useEffect(() => {
    fetchForYou()
  }, [user, lang])

  const fetchForYou = async () => {
    setLoading(true)
    setArticles([])

    let topicsToFetch: string[] = []
    let feedSource: 'topics' | 'history' | 'general' = 'general'

    if (user) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('followed_topics')
          .eq('id', user.id)
          .single()

        const followed: string[] = profileData?.followed_topics || []

        if (followed.length > 0) {
          topicsToFetch = followed.slice(0, 3)
          feedSource = 'topics'
        } else {
          const { data: historyData } = await supabase
            .from('reading_history')
            .select('title')
            .eq('user_id', user.id)
            .order('read_at', { ascending: false })
            .limit(30)

          const titles = historyData?.map(d => d.title) || []
          if (titles.length >= 3) {
            topicsToFetch = extractTopicsFromHistory(titles)
            if (topicsToFetch.length > 0) feedSource = 'history'
          }
        }
      } catch {}
    }

    setActiveTopics(topicsToFetch)
    setSource(feedSource)

    try {
      if (topicsToFetch.length > 0) {
        const results = await Promise.all(
          topicsToFetch.map(t =>
            fetch(`/api/news?q=${encodeURIComponent(TOPIC_TO_QUERY[t] || t)}&lang=${lang}`)
              .then(r => r.json())
              .then(d => (d.articles || []).slice(0, 5).map((a: Article) => ({ ...a, category: t })))
              .catch(() => [])
          )
        )
        const merged = results.flat()
        const seen = new Set<string>()
        const deduped = merged.filter(a => {
          if (seen.has(a.url)) return false
          seen.add(a.url)
          return true
        })
        setArticles(deduped)
      } else {
        const res = await fetch(`/api/news?category=general&lang=${lang}`)
        const data = await res.json()
        setArticles(data.articles || [])
      }
    } catch {
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  const handleArticleClick = async (article: Article) => {
    // Compare mode — select as article 2 and go to compare page
    if (isCompareMode && compareArticle1) {
      sessionStorage.removeItem('compare_article1')
      const params = new URLSearchParams({
        title1: compareArticle1.title || '',
        desc1: compareArticle1.desc || '',
        source1: compareArticle1.source || '',
        image1: compareArticle1.image || '',
        url1: compareArticle1.url || '',
        title2: article.title || '',
        desc2: (article.description || '').slice(0, 300),
        source2: article.source?.name || '',
        image2: article.urlToImage || '',
        url2: article.url || '',
      })
      router.push(`/compare?${params.toString()}`)
      return
    }

    // Normal flow — save to reading history and navigate
    if (user) {
      try {
        await supabase.from('reading_history').upsert({
          user_id: user.id,
          news_url: article.url,
          title: article.title,
          description: article.description,
          read_at: new Date().toISOString(),
        }, { onConflict: 'user_id,news_url' })
      } catch {}
    }
    const params = new URLSearchParams({
      title: article.title || '',
      description: (article.description || '').slice(0, 500),
      url: article.url || '',
      image: article.urlToImage || '',
      source: article.source?.name || '',
      publishedAt: article.publishedAt || '',
    })
    router.push(`/news?${params.toString()}`)
  }

  const toggleCompare = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation()

    const already = compareList.find(x => x.url === article.url)

    if (already) {
      setCompareList(prev => prev.filter(x => x.url !== article.url))
      return
    }

    if (compareList.length >= 2) {
      toast.error('You can only compare 2 articles at a time.')
      return
    }

    const newList = [...compareList, article]
    setCompareList(newList)

    if (newList.length === 1) {
      toast.success('First article selected! Pick one more.', { duration: 2000 })
    } else {
      toast.success('Both selected! Hit Compare below.', { duration: 2000 })
    }
  }

  const goCompare = () => {
    if (compareList.length < 2) return
    const [a1, a2] = compareList
    const params = new URLSearchParams({
      title1: a1.title || '',
      desc1: (a1.description || '').slice(0, 300),
      source1: a1.source?.name || '',
      image1: a1.urlToImage || '',
      url1: a1.url || '',
      title2: a2.title || '',
      desc2: (a2.description || '').slice(0, 300),
      source2: a2.source?.name || '',
      image2: a2.urlToImage || '',
      url2: a2.url || '',
    })
    router.push(`/compare?${params.toString()}`)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-5xl tracking-wider mb-2">
          FOR<span className="text-accent-purple"> YOU</span>
        </h1>
        {source === 'topics' && (
          <p className="text-text-muted text-sm flex items-center gap-1.5">
            <Sparkles size={13} className="text-accent-purple" />
            Based on your followed topics: {activeTopics.map(t => `#${t}`).join(', ')}
          </p>
        )}
        {source === 'history' && (
          <p className="text-text-muted text-sm flex items-center gap-1.5">
            <Flame size={13} className="text-accent-orange" />
            Based on your reading history: {activeTopics.map(t => `#${t}`).join(', ')}
          </p>
        )}
        {source === 'general' && (
          <p className="text-text-muted text-sm">
            {user
              ? 'Follow topics in your profile to personalize this feed!'
              : 'Log in and follow topics to personalize your feed!'}
          </p>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-white/5">
              <div className="skeleton h-44" />
              <div className="p-4 space-y-3 bg-bg-card">
                <div className="skeleton h-4 rounded-full w-3/4" />
                <div className="skeleton h-3 rounded-full w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <p className="text-4xl mb-3">📭</p>
          <p>No articles found. Try following some topics in your profile!</p>
        </div>
      ) : (
        <>
          {/* Compare mode banner */}
          {isCompareMode && compareArticle1 && (
            <div
              className="mb-5 flex items-center gap-3 px-4 py-3 rounded-2xl border border-accent-cyan/40"
              style={{ background: 'rgba(6,182,212,0.08)' }}
            >
              <GitCompare size={14} className="text-accent-cyan shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-accent-cyan mb-0.5">Compare Mode — Select a second article</p>
                <p className="text-xs text-text-muted truncate">Article 1: {compareArticle1.title}</p>
              </div>
              <button
                onClick={() => {
                  sessionStorage.removeItem('compare_article1')
                  router.push('/for-you')
                }}
                className="text-xs text-text-muted hover:text-text-primary transition-colors shrink-0"
              >
                ✕ Cancel
              </button>
            </div>
          )}

          {/* Regular compare hint */}
          {!isCompareMode && articles.length >= 2 && compareList.length === 0 && (
            <div
              className="mb-5 flex items-center gap-2 text-xs text-text-muted px-3 py-2 rounded-xl border border-white/5 w-fit"
              style={{ background: 'rgba(139,92,246,0.05)' }}
            >
              <GitCompare size={12} className="text-accent-purple" />
              Click Compare on any 2 articles to compare them side by side!
            </div>
          )}

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article, i) => {
              const isSelected = !!compareList.find(x => x.url === article.url)
              return (
                <div
                  key={i}
                  onClick={() => handleArticleClick(article)}
                  className={`group bg-bg-card rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 cursor-pointer relative ${
                    isCompareMode
                      ? 'border-accent-cyan/20 hover:border-accent-cyan/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                      : isSelected
                      ? 'border-accent-purple/60 shadow-glow-purple'
                      : 'border-white/5 hover:border-accent-purple/30 hover:shadow-glow-purple'
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden bg-bg-secondary">
                    {article.urlToImage ? (
                      <img
                        src={article.urlToImage}
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

                    {/* Source badge */}
                    {article.source?.name && (
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-mono text-accent-cyan bg-bg-primary/80 backdrop-blur-sm border border-accent-cyan/20 px-2 py-1 rounded-md">
                          {article.source.name}
                        </span>
                      </div>
                    )}

                    
                    {/* Compare button — hidden in compare mode, shown normally otherwise */}
                    {!isCompareMode && (
                      <button
                        onClick={(e) => toggleCompare(e, article)}
                        className={`absolute top-3 right-3 p-1.5 rounded-lg border text-[10px] font-semibold transition-all flex items-center gap-1 backdrop-blur-sm ${
                          isSelected
                            ? 'bg-accent-purple text-white border-accent-purple'
                            : 'bg-bg-primary/70 text-text-muted border-white/10 hover:border-accent-purple/40 hover:text-accent-purple'
                        }`}
                      >
                        <GitCompare size={11} />
                        {isSelected ? '✓ Selected' : 'Compare'}
                      </button>
                    )}

                    {/* Compare mode tap indicator */}
                    {isCompareMode && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-lg border border-accent-cyan/30 bg-bg-primary/70 backdrop-blur-sm text-[10px] text-accent-cyan font-semibold">
                        Tap to select
                      </div>
                    )}
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
                        {article.publishedAt
                          ? new Date(article.publishedAt).toLocaleDateString()
                          : ''}
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

      {/* Floating Compare Bar */}
      {!isCompareMode && compareList.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border border-accent-purple/40 backdrop-blur-md shadow-glow-purple"
          style={{ background: 'rgba(10,10,30,0.92)' }}
        >
          <GitCompare size={16} className="text-accent-purple" />
          <span className="text-sm text-text-primary font-medium">
            {compareList.length}/2 selected
          </span>
          {compareList.map((a, i) => (
            <span
              key={i}
              className="text-xs text-accent-purple/70 border border-accent-purple/20 px-2 py-0.5 rounded-lg max-w-[130px] truncate hidden sm:block"
            >
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
            onClick={() => {
              setCompareList([])
              sessionStorage.removeItem('foryou_compareList')
            }}
            className="text-xs text-text-muted hover:text-text-primary transition-colors ml-1"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  )
}

export default function ForYouPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="skeleton h-12 w-48 rounded-xl mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-white/5">
              <div className="skeleton h-44" />
              <div className="p-4 space-y-3 bg-bg-card">
                <div className="skeleton h-4 rounded-full w-3/4" />
                <div className="skeleton h-3 rounded-full w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <ForYouContent />
    </Suspense>
  )
}
