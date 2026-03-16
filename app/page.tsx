'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import NewsCard from '@/components/news/NewsCard'
import { Search, TrendingUp, GitCompare, X, Zap, Flame, ArrowUp } from 'lucide-react'
import { useLang } from '@/components/shared/LangProvider'
import toast from 'react-hot-toast'
import type { Article } from '@/lib/types'

const PAGE_SIZE = 12
const CACHE_TTL = 10 * 60 * 1000

// ── Category icons ──
const CATEGORY_ICONS: Record<string, string> = {
  general:    '🌐',
  technology: '💻',
  business:   '📈',
  sports:     '⚽',
  health:     '🩺',
  science:    '🔬',
  world:      '🌍',
}

function getLocalCache(key: string): { articles: Article[]; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(key)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function setLocalCache(key: string, articles: Article[]) {
  try {
    localStorage.setItem(key, JSON.stringify({ articles, timestamp: Date.now() }))
  } catch {}
}

// ── Reading Progress Bar ──
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <div
        className="h-full transition-none"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(to right, #8B5CF6, #EC4899, #06B6D4)',
        }}
      />
    </div>
  )
}

// ── Hero Skeleton ──
function HeroSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      {/* Hero big card */}
      <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-white/5" style={{ minHeight: '400px' }}>
        <div className="skeleton w-full h-full" style={{ minHeight: '400px' }} />
      </div>
      {/* Side articles */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(13,13,32,0.6)' }}>
            <div className="skeleton w-20 h-20 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="skeleton h-3 rounded-full w-1/3" />
              <div className="skeleton h-4 rounded-full w-full" />
              <div className="skeleton h-4 rounded-full w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { t, lang } = useLang()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('general')
  const [query, setQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [compareList, setCompareList] = useState<Article[]>([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // ── Scroll to top ──
  const [showScrollTop, setShowScrollTop] = useState(false)
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const CATEGORIES = [
    { id: 'general',    label: t('categories.general') },
    { id: 'technology', label: t('categories.technology') },
    { id: 'business',   label: t('categories.business') },
    { id: 'sports',     label: t('categories.sports') },
    { id: 'health',     label: t('categories.health') },
    { id: 'science',    label: t('categories.science') },
    { id: 'world',      label: t('categories.world') },
  ]

  const FEATURE_CARDS = [
    {
      icon: '🧠',
      label: t('ai.summary'),
      color: 'purple',
      onClick: () => toast(t('ai.summaryUnavailable'), { icon: '🧠' }),
      cta: 'Explore →',
    },
    {
      icon: '💬',
      label: t('nav.aiChat'),
      color: 'cyan',
      onClick: () => router.push('/chatbot'),
      cta: 'Open →',
    },
    {
      icon: '📊',
      label: t('nav.compare'),
      color: 'pink',
      onClick: () => router.push('/compare'),
      cta: 'Compare →',
    },
    {
      icon: '🔥',
      label: t('nav.trending'),
      color: 'orange',
      onClick: () => router.push('/trending'),
      cta: 'View →',
    },
  ]

  const fetchNews = async (cat: string, q: string = '', forceRefresh = false) => {
    const cacheKey = `news-${lang}-${cat}-${q}`
    if (!forceRefresh && !q) {
      const cached = getLocalCache(cacheKey)
      if (cached) {
        setArticles(cached.articles)
        setLoading(false)
        return
      }
    }
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ category: cat, lang })
      if (q) params.set('q', q)
      const res = await fetch(`/api/news?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const fetched = data.articles || []
      if (!q) setLocalCache(cacheKey, fetched)
      setArticles(fetched)
      setVisibleCount(PAGE_SIZE)
    } catch {
      setArticles([])
      setError('Failed to load news. Please try again.')
      toast.error('Failed to fetch news')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setArticles([])
    setLoading(true)
    fetchNews(category, query)
  }, [category, lang]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => { setQuery(searchInput); fetchNews(category, searchInput) }

  const handleCompareSelect = (article: Article) => {
    setCompareList(prev => {
      const exists = prev.find(a => a.url === article.url)
      if (exists) return prev.filter(a => a.url !== article.url)
      if (prev.length >= 2) return [prev[1], article]
      return [...prev, article]
    })
  }

  const handleCompareNow = () => {
    if (compareList.length < 2) return
    const params = new URLSearchParams({
      title1: compareList[0].title || '',        desc1: compareList[0].description || '',
      source1: compareList[0].source?.name || '', image1: compareList[0].urlToImage || '',
      url1: compareList[0].url || '',            title2: compareList[1].title || '',
      desc2: compareList[1].description || '',   source2: compareList[1].source?.name || '',
      image2: compareList[1].urlToImage || '',   url2: compareList[1].url || '',
    })
    router.push(`/compare?${params.toString()}`)
  }

  const goToArticle = (article: Article) => {
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

  const hero = articles[0]
  const sideArticles = articles.slice(1, 4)
  const gridArticles = articles.slice(4, 4 + visibleCount)
  const hasMore = articles.length > 4 + visibleCount

  return (
    <>
      {/* ── Reading Progress Bar ── */}
      <ReadingProgressBar />

      <div className="max-w-7xl mx-auto px-4 py-8" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── HERO HEADER ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-red/10 border border-accent-red/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse-slow" />
              <span className="text-xs font-bold text-accent-red tracking-widest">LIVE</span>
            </div>
            <span className="text-text-muted text-xs tracking-wider">⚡ AI-POWERED EDITION</span>
          </div>
          <h1 className="font-display text-[48px] sm:text-[72px] md:text-[90px] lg:text-[120px] leading-none tracking-wider">
            {t('home.todaysBriefing').split(' ').slice(0, -1).join(' ')}<br />
            <span style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradShift 4s ease infinite',
            }}>
              {t('home.todaysBriefing').split(' ').slice(-1)[0]}
            </span>
          </h1>
        </div>

        {/* ── TICKER ── */}
        {!loading && articles.length > 0 && (
          <div className="flex items-center gap-0 mb-8 overflow-hidden rounded-xl border border-white/8"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 border-r border-white/8"
              style={{ background: 'rgba(249,115,22,0.15)' }}>
              <Zap size={10} className="text-accent-orange" />
              <span className="text-[10px] font-black text-accent-orange tracking-widest">{t('home.breaking')}</span>
            </div>
            <div className="ticker-wrap flex-1 py-2.5 px-4">
              <div className="ticker text-xs text-text-muted gap-12">
                {articles.slice(0, 8).map((a, i) => (
                  <span key={i} className="mx-8">◆ {a.title}</span>
                ))}
                {articles.slice(0, 8).map((a, i) => (
                  <span key={`d-${i}`} className="mx-8">◆ {a.title}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── AI FEATURES ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {FEATURE_CARDS.map((f, i) => (
            <div
              key={i}
              onClick={f.onClick}
              className={`feature-card feature-card--${f.color} animate-float`}
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-semibold text-sm text-text-primary mb-0.5">{f.label}</div>
              <div className="text-[11px] text-text-muted leading-relaxed">{t('ui.aipowered')}</div>
              <div
                className="mt-3 text-[10px] font-bold tracking-wider"
                style={{
                  color:
                    f.color === 'purple' ? '#8B5CF6' :
                    f.color === 'cyan'   ? '#06B6D4' :
                    f.color === 'pink'   ? '#EC4899' : '#F97316',
                }}
              >
                {f.cta}
              </div>
            </div>
          ))}
        </div>

        {/* ── SEARCH + CATEGORIES ── */}
        <div className="mb-8 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                className="input-field pl-11"
                placeholder={t('home.searchPlaceholder')}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:shadow-glow-purple"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}
            >
              {t('home.search')}
            </button>
          </div>

          {/* ── Category pills with icons ── */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id); setQuery(''); setSearchInput('') }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all border ${
                  category === cat.id
                    ? 'text-white border-accent-purple shadow-glow-purple'
                    : 'border-white/10 text-text-muted hover:border-white/20 hover:text-text-primary'
                }`}
                style={category === cat.id ? {
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.15))'
                } : {}}
              >
                <span style={{ fontSize: '12px' }}>{CATEGORY_ICONS[cat.id]}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compare hint */}
        {!loading && articles.length > 0 && compareList.length === 0 && (
          <div className="flex items-center gap-2 mb-5 text-text-muted text-xs">
            <GitCompare size={11} className="text-accent-cyan" />
            <span>Click ⇄ on any 2 cards to compare with AI</span>
          </div>
        )}

        {/* ── LOADING — Hero + side skeleton + card grid ── */}
        {loading && (
          <>
            <HeroSkeleton />
            <div className="flex items-center gap-3 mb-5">
              <div className="skeleton h-0.5 w-6 rounded-full" />
              <div className="skeleton h-3 w-24 rounded-full" />
              <div className="flex-1 skeleton h-px rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-white/5">
                  <div className="skeleton h-48" />
                  <div className="p-4 space-y-3" style={{ background: 'rgba(13,13,32,0.8)' }}>
                    <div className="skeleton h-4 rounded-full w-3/4" />
                    <div className="skeleton h-3 rounded-full w-full" />
                    <div className="skeleton h-3 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── MAIN LAYOUT ── */}
        {!loading && !query && articles.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              {hero && (
                <div
                  onClick={() => goToArticle(hero)}
                  className="lg:col-span-2 relative rounded-3xl overflow-hidden cursor-pointer group border border-white/8 transition-all duration-300 hover:border-accent-purple/40"
                  style={{ minHeight: '400px' }}
                >
                  {hero.urlToImage && (
                    <img
                      src={hero.urlToImage} alt=""
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(4,4,15,0.98) 0%, rgba(4,4,15,0.6) 50%, transparent 100%)' }}
                  />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ boxShadow: 'inset 0 0 60px rgba(139,92,246,0.15)' }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest text-accent-orange border border-accent-orange/30"
                        style={{ background: 'rgba(249,115,22,0.15)' }}>
                        <Flame size={10} /> TOP STORY
                      </span>
                      <span className="text-[11px] font-mono text-accent-cyan">{hero.source?.name}</span>
                    </div>
                    <h2 className="font-serif text-xl md:text-3xl font-bold text-white leading-tight mb-3 group-hover:text-accent-purple transition-colors">
                      {hero.title}
                    </h2>
                    <p className="text-white/60 text-sm line-clamp-2 hidden sm:block">{hero.description}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                {sideArticles.map((article, i) => (
                  <div key={i}
                    onClick={() => goToArticle(article)}
                    className="flex gap-3 p-4 rounded-2xl border border-white/8 cursor-pointer group transition-all hover:border-accent-purple/30 hover:translate-x-1"
                    style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
                  >
                    {article.urlToImage && (
                      <img src={article.urlToImage} alt=""
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono text-accent-cyan mb-1.5 uppercase tracking-wider">{article.source?.name}</p>
                      <h3 className="font-serif text-sm font-bold text-text-primary leading-snug line-clamp-3 group-hover:text-accent-purple transition-colors">
                        {article.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-6 h-0.5 rounded-full" style={{ background: 'linear-gradient(to right, #8B5CF6, #EC4899)' }} />
              <span className="text-[11px] font-black tracking-widest uppercase text-accent-purple">More Stories</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(139,92,246,0.3), transparent)' }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gridArticles.map((article, i) => (
                <NewsCard key={i} article={article} index={i}
                  onCompareSelect={handleCompareSelect}
                  isSelectedForCompare={compareList.some(a => a.url === article.url)}
                />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                  className="px-6 py-3 rounded-xl font-semibold text-sm text-accent-purple border border-accent-purple/30 hover:bg-accent-purple/10 transition-all"
                >
                  Load More Stories
                </button>
              </div>
            )}
          </>
        )}

        {/* ── SEARCH RESULTS ── */}
        {!loading && query && (
          <>
            <div className="flex items-center gap-2 mb-5 text-text-muted text-sm">
              <TrendingUp size={14} />
              <span>Results for <strong className="text-text-primary">"{query}"</strong> — {articles.length} stories</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article, i) => (
                <NewsCard key={i} article={article} index={i}
                  onCompareSelect={handleCompareSelect}
                  isSelectedForCompare={compareList.some(a => a.url === article.url)}
                />
              ))}
            </div>
          </>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && articles.length === 0 && (
          <div className="text-center py-20 text-text-muted empty-state">
            <div className="empty-state-icon text-5xl mb-4">📭</div>
            {error ? (
              <>
                <p className="text-accent-red mb-3">{error}</p>
                <button onClick={() => fetchNews(category, query)}
                  className="px-4 py-2 bg-accent-purple/20 border border-accent-purple/30 text-accent-purple text-sm rounded-xl hover:bg-accent-purple/30 transition-all">
                  Try Again
                </button>
              </>
            ) : (
              <p>No stories found.</p>
            )}
          </div>
        )}

        {/* ── COMPARE BAR — mobile pe bottom nav ke upar ── */}
        {compareList.length > 0 && (
          <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-accent-cyan/30"
            style={{
              background: 'rgba(13,13,32,0.92)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 0 40px rgba(6,182,212,0.2), 0 20px 60px rgba(0,0,0,0.5)',
            }}>
            <GitCompare size={16} className="text-accent-cyan" />
            <span className="text-sm font-semibold">
              {compareList.length === 1 ? 'Select 1 more' : '2 selected'}
            </span>
            <div className="flex gap-2">
              {compareList.map((a, i) => (
                <span key={i} className="text-xs font-mono text-accent-cyan px-2 py-1 rounded-lg max-w-[100px] truncate border border-accent-cyan/20"
                  style={{ background: 'rgba(6,182,212,0.1)' }}>
                  {a.source?.name}
                </span>
              ))}
            </div>
            {compareList.length === 2 && (
              <button onClick={handleCompareNow}
                className="px-4 py-1.5 rounded-xl text-sm font-black text-bg-primary transition-all hover:shadow-glow-cyan"
                style={{ background: '#06B6D4' }}>
                Compare →
              </button>
            )}
            <button onClick={() => setCompareList([])} className="text-text-muted hover:text-text-primary ml-1">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── SCROLL TO TOP ── */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="fixed bottom-24 md:bottom-8 right-5 z-50 w-10 h-10 rounded-xl flex items-center justify-center border border-accent-purple/30 text-accent-purple transition-all hover:bg-accent-purple/20 hover:shadow-glow-purple animate-fade-in-fast"
            style={{ background: 'rgba(13,13,32,0.85)', backdropFilter: 'blur(12px)' }}
          >
            <ArrowUp size={16} />
          </button>
        )}

        <div className="mt-16 pt-6 border-t border-white/5 text-center">
          <p className="text-text-muted text-xs tracking-widest font-mono uppercase">
            © NewsHive Pro · AI-Powered · Built for Eternia
          </p>
        </div>
      </div>
    </>
  )
}
