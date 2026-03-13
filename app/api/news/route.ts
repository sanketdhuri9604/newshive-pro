import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/api-utils'

// ─── In-memory cache (5-minute TTL) ──────────────────────────────────────
const cache = new Map<string, { data: { articles: any[] }; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached(key: string) {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data
  return null
}

function setCache(key: string, data: { articles: any[] }) {
  cache.set(key, { data, timestamp: Date.now() })
  // Evict old entries when cache grows large
  if (cache.size > 50) {
    const now = Date.now()
    cache.forEach((v, k) => {
      if (now - v.timestamp > CACHE_TTL) cache.delete(k)
    })
  }
}

const GNEWS_LANG: Record<string, string> = {
  en: 'en', hi: 'hi', bn: 'bn', ta: 'ta',
  te: 'te', mr: 'mr', gu: 'gu', kn: 'kn',
  ml: 'ml', pa: 'pa', ur: 'ur',
}

const GNEWS_COUNTRY: Record<string, string> = {
  en: 'in', hi: 'in', bn: 'in', ta: 'in',
  te: 'in', mr: 'in', gu: 'in', kn: 'in',
  ml: 'in', pa: 'in', ur: 'pk',
}

const NEWSAPI_LANG: Record<string, string> = {
  en: 'en', hi: 'hi', ur: 'ar',
  // rest fallback to en
}

const REGION_KEYWORDS: Record<string, string> = {
  bn: 'Bengal India',
  ta: 'Tamil Nadu India',
  te: 'Telangana Andhra Pradesh India',
  mr: 'Maharashtra India',
  gu: 'Gujarat India',
  kn: 'Karnataka India',
  ml: 'Kerala India',
  pa: 'Punjab India',
}

function normalizeGNews(articles: any[]) {
  return articles.map(a => ({
    title: a.title,
    description: a.description,
    url: a.url,
    urlToImage: a.image,
    publishedAt: a.publishedAt,
    content: a.content,
    source: { name: a.source?.name || 'GNews' },
  }))
}

function normalizeNewsApi(articles: any[]) {
  return articles.map(a => ({
    title: a.title,
    description: a.description,
    url: a.url,
    urlToImage: a.urlToImage,
    publishedAt: a.publishedAt,
    content: a.content,
    source: { name: a.source?.name || 'NewsAPI' },
  }))
}

function dedupe(articles: any[]) {
  const seen = new Set<string>()
  return articles.filter(a => {
    if (!a.url || !a.title || a.title === '[Removed]' || seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })
}

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req)
  if (limited) return limited

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || 'general'
  const lang = searchParams.get('lang') || 'en'
  const q = searchParams.get('q') || ''
  const newsApiKey = process.env.NEWS_API_KEY
  const gNewsKey = process.env.GNEWS_API_KEY

  // Check cache first
  const cacheKey = `${category}-${lang}-${q}`
  const cached = getCached(cacheKey)
  if (cached) return NextResponse.json(cached)

  const gLang = GNEWS_LANG[lang] || 'en'
  const gCountry = GNEWS_COUNTRY[lang] || 'in'
  const nLang = NEWSAPI_LANG[lang] || 'en'
  const regionKeyword = REGION_KEYWORDS[lang] || 'India'

  try {
    let articles: any[] = []

    if (q) {
      // ── SEARCH MODE ──
      const searchQ = REGION_KEYWORDS[lang] 
        ? `${q} ${REGION_KEYWORDS[lang].split(' ')[0]}` 
        : q

      const [gRes, nRes] = await Promise.all([
        fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=${gLang}&country=${gCountry}&max=10&apikey=${gNewsKey}`),
        fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQ)}&language=${nLang}&sortBy=publishedAt&pageSize=15&apiKey=${newsApiKey}`),
      ])
      const [gData, nData] = await Promise.all([gRes.json(), nRes.json()])
      articles = dedupe([
        ...normalizeGNews(gData.articles || []),
        ...normalizeNewsApi(nData.articles || []),
      ])

    } else if (lang === 'en') {
      // ── ENGLISH — India + Global ──
      const [gIndiaRes, gWorldRes, nIndiaRes, nGlobalRes] = await Promise.all([
        fetch(`https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&country=in&max=10&apikey=${gNewsKey}`),
        fetch(`https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&max=10&apikey=${gNewsKey}`),
        fetch(`https://newsapi.org/v2/top-headlines?country=in&category=${category}&pageSize=15&apiKey=${newsApiKey}`),
        fetch(`https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=10&apiKey=${newsApiKey}`),
      ])
      const [gIndia, gWorld, nIndia, nGlobal] = await Promise.all([
        gIndiaRes.json(), gWorldRes.json(), nIndiaRes.json(), nGlobalRes.json()
      ])
      articles = dedupe([
        ...normalizeGNews(gIndia.articles || []),
        ...normalizeNewsApi(nIndia.articles || []),
        ...normalizeGNews(gWorld.articles || []),
        ...normalizeNewsApi(nGlobal.articles || []),
      ])

    } else if (lang === 'hi') {
      // ── HINDI ──
      const [gHiRes, nHiRes, nIndiaRes] = await Promise.all([
        fetch(`https://gnews.io/api/v4/top-headlines?category=${category}&lang=hi&country=in&max=15&apikey=${gNewsKey}`),
        fetch(`https://newsapi.org/v2/top-headlines?country=in&category=${category}&language=hi&pageSize=15&apiKey=${newsApiKey}`),
        fetch(`https://newsapi.org/v2/top-headlines?country=in&category=${category}&pageSize=10&apiKey=${newsApiKey}`),
      ])
      const [gHi, nHi, nIndia] = await Promise.all([gHiRes.json(), nHiRes.json(), nIndiaRes.json()])
      articles = dedupe([
        ...normalizeGNews(gHi.articles || []),
        ...normalizeNewsApi(nHi.articles || []),
        ...normalizeNewsApi(nIndia.articles || []),
      ])

    } else if (lang === 'ur') {
      // ── URDU ──
      const [gUrRes, nPkRes, nIndiaRes] = await Promise.all([
        fetch(`https://gnews.io/api/v4/top-headlines?category=${category}&lang=ur&country=pk&max=15&apikey=${gNewsKey}`),
        fetch(`https://newsapi.org/v2/top-headlines?country=pk&category=${category}&pageSize=12&apiKey=${newsApiKey}`),
        fetch(`https://newsapi.org/v2/top-headlines?country=in&category=${category}&pageSize=8&apiKey=${newsApiKey}`),
      ])
      const [gUr, nPk, nIndia] = await Promise.all([gUrRes.json(), nPkRes.json(), nIndiaRes.json()])
      articles = dedupe([
        ...normalizeGNews(gUr.articles || []),
        ...normalizeNewsApi(nPk.articles || []),
        ...normalizeNewsApi(nIndia.articles || []),
      ])

    } else {
      // ── REGIONAL INDIAN LANGUAGES (bn, ta, te, mr, gu, kn, ml, pa) ──
      const [gRegRes, gIndiaRes, nRegRes, nIndiaRes] = await Promise.all([
        // GNews in native language
        fetch(`https://gnews.io/api/v4/top-headlines?category=${category}&lang=${gLang}&country=in&max=10&apikey=${gNewsKey}`),
        // GNews India English
        fetch(`https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&country=in&max=8&apikey=${gNewsKey}`),
        // NewsAPI regional keyword search
        fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(regionKeyword)}&language=en&sortBy=publishedAt&pageSize=12&apiKey=${newsApiKey}`),
        // NewsAPI India top headlines
        fetch(`https://newsapi.org/v2/top-headlines?country=in&category=${category}&pageSize=10&apiKey=${newsApiKey}`),
      ])
      const [gReg, gIndia, nReg, nIndia] = await Promise.all([
        gRegRes.json(), gIndiaRes.json(), nRegRes.json(), nIndiaRes.json()
      ])
      articles = dedupe([
        ...normalizeGNews(gReg.articles || []),
        ...normalizeNewsApi(nIndia.articles || []),
        ...normalizeGNews(gIndia.articles || []),
        ...normalizeNewsApi(nReg.articles || []),
      ])
    }

    const result = { articles }
    setCache(cacheKey, result)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ articles: [], error: 'Failed to fetch' }, { status: 500 })
  }
}