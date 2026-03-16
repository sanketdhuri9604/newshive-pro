'use client'

import { useState, useEffect, useRef } from 'react'
import type { ComponentProps } from 'react'
import { useLang } from '@/components/shared/LangProvider'
import { MapPin, Newspaper, RefreshCw, Info } from 'lucide-react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface NewsLocation {
  name: string
  lat: number
  lng: number
  count: number
  articles: any[]
}

interface MapComponentProps {
  locations: NewsLocation[]
  onLocationClick: (location: NewsLocation) => void
}

const MapComponent = dynamic<MapComponentProps>(
  () => import('@/components/ui/NewsMapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] rounded-2xl border border-white/10 flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-muted text-sm">Loading map...</p>
        </div>
      </div>
    )
  }
)

const CATEGORIES = [
  { id: 'general', label: '🌐 General' },
  { id: 'technology', label: '💻 Tech' },
  { id: 'business', label: '📈 Business' },
  { id: 'sports', label: '🏆 Sports' },
  { id: 'health', label: '❤️ Health' },
  { id: 'science', label: '🔬 Science' },
  { id: 'world', label: '🌍 World' },
]

const SESSION_TTL = 6 * 60 * 60 * 1000 // 6 hours — same as API cache

function getSessionCache(key: string): NewsLocation[] | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { locations, savedAt } = JSON.parse(raw)
    if (Date.now() - savedAt > SESSION_TTL) {
      sessionStorage.removeItem(key)
      return null
    }
    return locations
  } catch { return null }
}

function setSessionCache(key: string, locations: NewsLocation[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ locations, savedAt: Date.now() }))
  } catch {}
}

export default function NewsMapPage() {
  const { lang } = useLang()
  const router = useRouter()
  const [locations, setLocations] = useState<NewsLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('general')
  const [selectedLocation, setSelectedLocation] = useState<NewsLocation | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    fetchLocations()
  }, [lang, category])

  const fetchLocations = async (forceRefresh = false) => {
    const cacheKey = `news-map-${lang}-${category}`

    // ── Check sessionStorage first (instant load, no API call) ──
    if (!forceRefresh) {
      const cached = getSessionCache(cacheKey)
      if (cached) {
        setLocations(cached)
        setLoading(false)
        return
      }
    }

    // ── No cache — fetch from API ──
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const res = await fetch(
        `/api/news-map?lang=${lang}&category=${category}`,
        { signal: controller.signal }
      )
      const data = await res.json()

      if (!controller.signal.aborted) {
        const locs = data.locations || []
        setLocations(locs)
        setLastUpdated(new Date())
        // Save to sessionStorage for instant reload next time
        setSessionCache(cacheKey, locs)
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error('Could not load map data')
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }

  const handleRefresh = () => {
    // Clear session cache for this key so fresh data is fetched
    try {
      sessionStorage.removeItem(`news-map-${lang}-${category}`)
    } catch {}
    fetchLocations(true)
  }

  const goToArticle = (article: any) => {
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
    <div className="max-w-6xl mx-auto px-4 py-8" style={{ position: 'relative', zIndex: 1 }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-5xl tracking-wider mb-2">
          NEWS<span className="text-accent-cyan"> MAP</span>
        </h1>
        <p className="text-text-muted text-sm">See where news is happening across India 🗺️</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-6">
        {CATEGORIES.map(cat => (
          <button key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all border ${
              category === cat.id
                ? 'text-white border-accent-cyan shadow-glow-cyan'
                : 'border-white/10 text-text-muted hover:border-white/20 hover:text-text-primary'
            }`}
            style={category === cat.id ? {
              background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(139,92,246,0.15))'
            } : {}}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-text-muted">
            <MapPin size={14} className="text-accent-cyan" />
            <span>{locations.length} locations detected</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-text-muted">
            <Newspaper size={14} className="text-accent-purple" />
            <span>{locations.reduce((acc, l) => acc + l.count, 0)} articles mapped</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-text-muted">
              Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={handleRefresh} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-white/10 text-text-muted hover:text-text-primary hover:border-white/20 transition-all disabled:opacity-40">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Map */}
      {loading ? (
        <div className="w-full h-[500px] rounded-2xl border border-white/10 flex items-center justify-center mb-6"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-text-muted text-sm">Detecting news locations...</p>
            <p className="text-text-muted text-xs mt-1">This may take a moment ⚡</p>
          </div>
        </div>
      ) : locations.length === 0 ? (
        <div className="w-full h-[500px] rounded-2xl border border-white/10 flex items-center justify-center mb-6"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-center">
            <p className="text-4xl mb-3">🗺️</p>
            <p className="text-text-muted">No locations found for this category</p>
            <p className="text-text-muted text-xs mt-1">Try a different category</p>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <MapComponent
            locations={locations}
            onLocationClick={setSelectedLocation}
          />
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mb-6 p-3 rounded-xl border border-white/8 flex-wrap"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <span className="text-xs text-text-muted flex items-center gap-1.5">
          <Info size={11} /> Legend:
        </span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-3 h-3 rounded-full bg-accent-cyan inline-block" /> 1 article
        </span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-4 h-4 rounded-full bg-accent-purple inline-block" /> 2-3 articles
        </span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-5 h-5 rounded-full bg-accent-orange inline-block" /> 4+ articles
        </span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-6 h-6 rounded-full bg-accent-red inline-block" /> 6+ articles 🔥
        </span>
      </div>

      {/* Selected Location Articles */}
      {selectedLocation && (
        <div className="glass rounded-2xl border border-accent-cyan/30 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <MapPin size={16} className="text-accent-cyan" />
              {selectedLocation.name}
              <span className="text-xs text-accent-cyan border border-accent-cyan/30 px-2 py-0.5 rounded-full">
                {selectedLocation.count} articles
              </span>
            </h3>
            <button onClick={() => setSelectedLocation(null)}
              className="text-text-muted hover:text-text-primary text-xs">✕</button>
          </div>
          <div className="space-y-3">
            {selectedLocation.articles.map((article, i) => (
              <div key={i}
                onClick={() => goToArticle(article)}
                className="flex gap-3 p-3 rounded-xl border border-white/8 cursor-pointer hover:border-accent-cyan/30 transition-all"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                {article.urlToImage && (
                  <img src={article.urlToImage} alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-accent-cyan mb-1">{article.source?.name}</p>
                  <h4 className="text-sm font-semibold text-text-primary line-clamp-2 hover:text-accent-cyan transition-colors">
                    {article.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Locations List */}
      {!loading && locations.length > 0 && (
        <div className="glass rounded-2xl border border-white/10 p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <MapPin size={14} className="text-accent-cyan" /> All Locations
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {locations
              .sort((a, b) => b.count - a.count)
              .map((loc, i) => (
                <button key={i}
                  onClick={() => setSelectedLocation(loc)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl border border-white/8 hover:border-accent-cyan/30 transition-all text-left"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-sm text-text-primary truncate">{loc.name}</span>
                  <span className="text-xs font-bold ml-2 flex-shrink-0"
                    style={{
                      color: loc.count >= 6 ? '#EF4444' :
                        loc.count >= 4 ? '#F97316' :
                        loc.count >= 2 ? '#8B5CF6' : '#06B6D4'
                    }}>
                    {loc.count}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

    </div>
  )
}