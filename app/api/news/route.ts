import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/api-utils'
import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'

// ─── Supabase client ──────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const MIN_ARTICLES = 5 // agar kam ho toh english mix karo

// ─── RSS Parser with media tag support ───────────────────────────────────
const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:group', 'mediaGroup'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'contentEncoded'],
    ]
  }
})

// ─── RSS Feeds ────────────────────────────────────────────────────────────
const RSS_FEEDS: Record<string, Record<string, string[]>> = {
  en: {
    general: [
      'https://feeds.feedburner.com/ndtvnews-top-stories',
      'https://www.thehindu.com/feeder/default.rss',
      'https://indianexpress.com/feed/',
      'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
      'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
      'https://www.livemint.com/rss/news',
    ],
    technology: [
      'https://feeds.feedburner.com/ndtvnews-tech',
      'https://indianexpress.com/section/technology/feed/',
      'https://www.thehindu.com/sci-tech/feeder/default.rss',
      'https://www.livemint.com/rss/technology',
    ],
    business: [
      'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
      'https://www.thehindu.com/business/feeder/default.rss',
      'https://indianexpress.com/section/business/feed/',
      'https://www.livemint.com/rss/money',
    ],
    sports: [
      'https://feeds.feedburner.com/ndtvnews-sports',
      'https://www.thehindu.com/sport/feeder/default.rss',
      'https://indianexpress.com/section/sports/feed/',
      'https://www.hindustantimes.com/feeds/rss/cricket/rssfeed.xml',
    ],
    health: [
      'https://www.thehindu.com/sci-tech/health/feeder/default.rss',
      'https://indianexpress.com/section/lifestyle/health/feed/',
      'https://www.livemint.com/rss/science',
    ],
    science: [
      'https://www.thehindu.com/sci-tech/science/feeder/default.rss',
      'https://indianexpress.com/section/technology/science/feed/',
      'https://www.livemint.com/rss/science',
    ],
    world: [
      'https://feeds.feedburner.com/ndtvnews-world-news',
      'https://www.thehindu.com/news/international/feeder/default.rss',
      'https://indianexpress.com/section/world/feed/',
      'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml',
    ],
  },

  hi: {
    general: [
      'https://www.jagran.com/rss/news-national.xml',
      'https://navbharattimes.indiatimes.com/rssfeedstopstories.cms',
      'https://www.amarujala.com/rss/breaking-news.xml',
      'https://www.bhaskar.com/rss-feed/8/',
      'https://hindi.oneindia.com/rss/hindi-news.xml',
      'https://www.abplive.com/feed',
      'https://www.ndtv.com/rss/hindi',
    ],
    technology: [
      'https://navbharattimes.indiatimes.com/rssfeeds/2279764257.cms',
      'https://www.jagran.com/rss/technology.xml',
      'https://hindi.oneindia.com/rss/technology.xml',
    ],
    business: [
      'https://www.jagran.com/rss/business.xml',
      'https://navbharattimes.indiatimes.com/rssfeeds/1181578550.cms',
      'https://www.bhaskar.com/rss-feed/1036/',
    ],
    sports: [
      'https://www.jagran.com/rss/sports.xml',
      'https://navbharattimes.indiatimes.com/rssfeeds/4719157.cms',
      'https://hindi.oneindia.com/rss/sports.xml',
      'https://www.abplive.com/sports/feed',
    ],
    health: [
      'https://navbharattimes.indiatimes.com/rssfeeds/2279764233.cms',
      'https://www.bhaskar.com/rss-feed/1069/',
    ],
    science: [
      'https://navbharattimes.indiatimes.com/rssfeeds/2279764257.cms',
      'https://hindi.oneindia.com/rss/technology.xml',
    ],
    world: [
      'https://www.jagran.com/rss/news-international.xml',
      'https://navbharattimes.indiatimes.com/rssfeeds/2206009.cms',
      'https://www.abplive.com/world/feed',
    ],
  },

  ta: {
    general: [
      'https://www.dinamalar.com/rss_feed.asp',
      'https://www.dinamani.com/rss/top-news/',
      'https://tamil.oneindia.com/rss/tamil-news.xml',
      'https://www.vikatan.com/rss.xml',
      'https://www.puthiyathalaimurai.com/feed/',
      'https://www.maalaimalar.com/feed',
    ],
    technology: [
      'https://www.dinamalar.com/rss_feed.asp?id=17',
      'https://tamil.oneindia.com/rss/technology.xml',
    ],
    business: [
      'https://www.dinamalar.com/rss_feed.asp?id=9',
      'https://tamil.oneindia.com/rss/business.xml',
    ],
    sports: [
      'https://www.dinamalar.com/rss_feed.asp?id=6',
      'https://tamil.oneindia.com/rss/sports.xml',
    ],
    health: [
      'https://www.dinamalar.com/rss_feed.asp?id=14',
      'https://tamil.oneindia.com/rss/health.xml',
    ],
    science: [
      'https://www.dinamalar.com/rss_feed.asp?id=17',
      'https://tamil.oneindia.com/rss/technology.xml',
    ],
    world: [
      'https://www.dinamalar.com/rss_feed.asp?id=4',
      'https://tamil.oneindia.com/rss/world.xml',
    ],
  },

  te: {
    general: [
      'https://www.eenadu.net/rss.aspx',
      'https://www.sakshi.com/rss.xml',
      'https://telugu.oneindia.com/rss/telugu-news.xml',
      'https://www.tv9telugu.com/feed/',
      'https://www.andhrajyothy.com/feed',
      'https://www.ntv.co.in/feed/',
    ],
    technology: [
      'https://www.eenadu.net/rss.aspx?cat=technology',
      'https://telugu.oneindia.com/rss/technology.xml',
    ],
    business: [
      'https://www.eenadu.net/rss.aspx?cat=business',
      'https://telugu.oneindia.com/rss/business.xml',
    ],
    sports: [
      'https://www.eenadu.net/rss.aspx?cat=sports',
      'https://telugu.oneindia.com/rss/sports.xml',
    ],
    health: [
      'https://www.eenadu.net/rss.aspx?cat=health',
      'https://telugu.oneindia.com/rss/health.xml',
    ],
    science: [
      'https://www.eenadu.net/rss.aspx?cat=science',
      'https://telugu.oneindia.com/rss/technology.xml',
    ],
    world: [
      'https://www.eenadu.net/rss.aspx?cat=world',
      'https://telugu.oneindia.com/rss/world.xml',
    ],
  },

  mr: {
    general: [
      'https://www.loksatta.com/feed/',
      'https://maharashtratimes.com/rssfeedstopstories.cms',
      'https://www.lokmat.com/feed/',
      'https://www.tv9marathi.com/feed/',
      'https://marathi.oneindia.com/rss/marathi-news.xml',
      'https://www.abpmajha.com/feed',
    ],
    technology: [
      'https://maharashtratimes.com/rssfeeds/2279764257.cms',
      'https://marathi.oneindia.com/rss/technology.xml',
    ],
    business: [
      'https://maharashtratimes.com/rssfeeds/1181578550.cms',
      'https://marathi.oneindia.com/rss/business.xml',
    ],
    sports: [
      'https://maharashtratimes.com/rssfeeds/4719157.cms',
      'https://marathi.oneindia.com/rss/sports.xml',
    ],
    health: [
      'https://maharashtratimes.com/rssfeeds/2279764233.cms',
      'https://marathi.oneindia.com/rss/health.xml',
    ],
    science: [
      'https://maharashtratimes.com/rssfeeds/2279764257.cms',
      'https://marathi.oneindia.com/rss/technology.xml',
    ],
    world: [
      'https://maharashtratimes.com/rssfeeds/2206009.cms',
      'https://marathi.oneindia.com/rss/world.xml',
    ],
  },

  bn: {
    general: [
      'https://eisamay.indiatimes.com/rssfeedstopstories.cms',
      'https://www.anandabazar.com/rss/latest-news.xml',
      'https://bengali.oneindia.com/rss/bengali-news.xml',
      'https://www.aajkaal.in/feed/',
      'https://www.sangbadpratidin.in/feed/',
      'https://zeenews.india.com/bengali/rss/all.xml',
    ],
    technology: [
      'https://eisamay.indiatimes.com/rssfeeds/2279764257.cms',
      'https://bengali.oneindia.com/rss/technology.xml',
    ],
    business: [
      'https://eisamay.indiatimes.com/rssfeeds/1181578550.cms',
      'https://bengali.oneindia.com/rss/business.xml',
    ],
    sports: [
      'https://eisamay.indiatimes.com/rssfeeds/4719157.cms',
      'https://bengali.oneindia.com/rss/sports.xml',
    ],
    health: [
      'https://eisamay.indiatimes.com/rssfeeds/2279764233.cms',
      'https://bengali.oneindia.com/rss/health.xml',
    ],
    science: [
      'https://eisamay.indiatimes.com/rssfeeds/2279764257.cms',
      'https://bengali.oneindia.com/rss/technology.xml',
    ],
    world: [
      'https://eisamay.indiatimes.com/rssfeeds/2206009.cms',
      'https://bengali.oneindia.com/rss/world.xml',
    ],
  },

  gu: {
    general: [
      'https://www.divyabhaskar.co.in/rss-feed/1061/',
      'https://www.sandesh.com/rss/top-stories.xml',
      'https://gujarati.oneindia.com/rss/gujarati-news.xml',
      'https://www.gujaratsamachar.com/rss.xml',
      'https://www.tv9gujarati.com/feed/',
      'https://zeenews.india.com/gujarati/rss/all.xml',
    ],
    technology: [
      'https://www.divyabhaskar.co.in/rss-feed/1084/',
      'https://gujarati.oneindia.com/rss/technology.xml',
    ],
    business: [
      'https://www.divyabhaskar.co.in/rss-feed/1062/',
      'https://gujarati.oneindia.com/rss/business.xml',
    ],
    sports: [
      'https://www.divyabhaskar.co.in/rss-feed/1065/',
      'https://gujarati.oneindia.com/rss/sports.xml',
    ],
    health: [
      'https://www.divyabhaskar.co.in/rss-feed/1073/',
      'https://gujarati.oneindia.com/rss/health.xml',
    ],
    science: [
      'https://www.divyabhaskar.co.in/rss-feed/1084/',
      'https://gujarati.oneindia.com/rss/technology.xml',
    ],
    world: [
      'https://www.divyabhaskar.co.in/rss-feed/1063/',
      'https://gujarati.oneindia.com/rss/world.xml',
    ],
  },

  kn: {
    general: [
      'https://www.prajavani.net/feed/',
      'https://vijaykarnataka.com/rssfeedstopstories.cms',
      'https://kannada.oneindia.com/rss/kannada-news.xml',
      'https://www.tv9kannada.com/feed/',
      'https://www.udayavani.com/feed',
      'https://zeenews.india.com/kannada/rss/all.xml',
    ],
    technology: [
      'https://vijaykarnataka.com/rssfeeds/2279764257.cms',
      'https://kannada.oneindia.com/rss/technology.xml',
    ],
    business: [
      'https://vijaykarnataka.com/rssfeeds/1181578550.cms',
      'https://kannada.oneindia.com/rss/business.xml',
    ],
    sports: [
      'https://vijaykarnataka.com/rssfeeds/4719157.cms',
      'https://kannada.oneindia.com/rss/sports.xml',
    ],
    health: [
      'https://vijaykarnataka.com/rssfeeds/2279764233.cms',
      'https://kannada.oneindia.com/rss/health.xml',
    ],
    science: [
      'https://vijaykarnataka.com/rssfeeds/2279764257.cms',
      'https://kannada.oneindia.com/rss/technology.xml',
    ],
    world: [
      'https://vijaykarnataka.com/rssfeeds/2206009.cms',
      'https://kannada.oneindia.com/rss/world.xml',
    ],
  },

  ml: {
    general: [
      'https://www.mathrubhumi.com/rss.cms',
      'https://www.manoramaonline.com/rss/news.xml',
      'https://malayalam.oneindia.com/rss/malayalam-news.xml',
      'https://www.madhyamam.com/rss.xml',
      'https://www.keralakaumudi.com/feed/',
      'https://zeenews.india.com/malayalam/rss/all.xml',
    ],
    technology: [
      'https://www.mathrubhumi.com/rss/technology.cms',
      'https://malayalam.oneindia.com/rss/technology.xml',
    ],
    business: [
      'https://www.mathrubhumi.com/rss/business.cms',
      'https://malayalam.oneindia.com/rss/business.xml',
    ],
    sports: [
      'https://www.mathrubhumi.com/rss/sports.cms',
      'https://malayalam.oneindia.com/rss/sports.xml',
    ],
    health: [
      'https://www.mathrubhumi.com/rss/health.cms',
      'https://malayalam.oneindia.com/rss/health.xml',
    ],
    science: [
      'https://www.mathrubhumi.com/rss/science.cms',
      'https://malayalam.oneindia.com/rss/technology.xml',
    ],
    world: [
      'https://www.mathrubhumi.com/rss/world.cms',
      'https://malayalam.oneindia.com/rss/world.xml',
    ],
  },

  pa: {
    general: [
      'https://www.jagbani.com/rss/top-stories.xml',
      'https://punjabikhabar.com/feed/',
      'https://punjabi.oneindia.com/rss/punjabi-news.xml',
      'https://www.tribuneindia.com/rss/feed',
      'https://zeenews.india.com/punjabi/rss/all.xml',
    ],
    technology: [
      'https://www.jagbani.com/rss/technology.xml',
      'https://punjabi.oneindia.com/rss/technology.xml',
    ],
    business: [
      'https://www.jagbani.com/rss/business.xml',
      'https://punjabi.oneindia.com/rss/business.xml',
    ],
    sports: [
      'https://www.jagbani.com/rss/sports.xml',
      'https://punjabi.oneindia.com/rss/sports.xml',
    ],
    health: [
      'https://www.jagbani.com/rss/health.xml',
      'https://punjabi.oneindia.com/rss/health.xml',
    ],
    science: [
      'https://www.jagbani.com/rss/science.xml',
      'https://punjabi.oneindia.com/rss/technology.xml',
    ],
    world: [
      'https://www.jagbani.com/rss/world.xml',
      'https://punjabi.oneindia.com/rss/world.xml',
    ],
  },

  ur: {
    general: [
      'https://www.dawn.com/feeds/home',
      'https://jang.com.pk/rss/1.xml',
      'https://www.geo.tv/rss/10',
      'https://urdu.arynews.tv/feed/',
      'https://www.express.pk/feed/',
    ],
    technology: [
      'https://www.dawn.com/feeds/technology',
      'https://urdu.arynews.tv/category/technology/feed/',
    ],
    business: [
      'https://www.dawn.com/feeds/business',
      'https://urdu.arynews.tv/category/business/feed/',
    ],
    sports: [
      'https://www.dawn.com/feeds/sport',
      'https://urdu.arynews.tv/category/sports/feed/',
    ],
    health: [
      'https://www.dawn.com/feeds/health',
      'https://urdu.arynews.tv/category/health/feed/',
    ],
    science: [
      'https://www.dawn.com/feeds/science',
      'https://urdu.arynews.tv/category/technology/feed/',
    ],
    world: [
      'https://www.dawn.com/feeds/world',
      'https://urdu.arynews.tv/category/world/feed/',
    ],
  },
}

// ─── GNews/NewsAPI maps ───────────────────────────────────────────────────
const GNEWS_LANG: Record<string, string> = {
  en: 'en', hi: 'hi', bn: 'bn', ta: 'ta', te: 'te',
  mr: 'mr', gu: 'gu', kn: 'kn', ml: 'ml', pa: 'pa', ur: 'ur',
}
const GNEWS_COUNTRY: Record<string, string> = {
  en: 'in', hi: 'in', bn: 'in', ta: 'in', te: 'in',
  mr: 'in', gu: 'in', kn: 'in', ml: 'in', pa: 'in', ur: 'pk',
}
const NEWSAPI_LANG: Record<string, string> = { en: 'en', hi: 'hi', ur: 'ar' }
const REGION_KEYWORDS: Record<string, string> = {
  bn: 'Bengal India', ta: 'Tamil Nadu India', te: 'Telangana India',
  mr: 'Maharashtra India', gu: 'Gujarat India', kn: 'Karnataka India',
  ml: 'Kerala India', pa: 'Punjab India',
}

const SOURCE_MAP: Record<string, string> = {
  'ndtv.com': 'NDTV', 'thehindu.com': 'The Hindu',
  'indianexpress.com': 'Indian Express',
  'timesofindia.indiatimes.com': 'Times of India',
  'hindustantimes.com': 'Hindustan Times',
  'livemint.com': 'Live Mint',
  'economictimes.indiatimes.com': 'Economic Times',
  'jagran.com': 'Dainik Jagran',
  'navbharattimes.indiatimes.com': 'Navbharat Times',
  'amarujala.com': 'Amar Ujala',
  'bhaskar.com': 'Dainik Bhaskar',
  'abplive.com': 'ABP Live',
  'dinamalar.com': 'Dinamalar', 'dinamani.com': 'Dinamani',
  'vikatan.com': 'Vikatan', 'puthiyathalaimurai.com': 'Puthiya Thalaimurai',
  'maalaimalar.com': 'Maalai Malar',
  'eenadu.net': 'Eenadu', 'sakshi.com': 'Sakshi',
  'tv9telugu.com': 'TV9 Telugu', 'andhrajyothy.com': 'Andhra Jyothy',
  'loksatta.com': 'Loksatta', 'maharashtratimes.com': 'Maharashtra Times',
  'lokmat.com': 'Lokmat', 'tv9marathi.com': 'TV9 Marathi',
  'abpmajha.com': 'ABP Majha',
  'eisamay.indiatimes.com': 'Eisamay', 'anandabazar.com': 'Anandabazar',
  'aajkaal.in': 'Aaj Kaal', 'sangbadpratidin.in': 'Sangbad Pratidin',
  'divyabhaskar.co.in': 'Divya Bhaskar', 'sandesh.com': 'Sandesh',
  'tv9gujarati.com': 'TV9 Gujarati', 'gujaratsamachar.com': 'Gujarat Samachar',
  'prajavani.net': 'Prajavani', 'vijaykarnataka.com': 'Vijay Karnataka',
  'tv9kannada.com': 'TV9 Kannada', 'udayavani.com': 'Udayavani',
  'mathrubhumi.com': 'Mathrubhumi', 'manoramaonline.com': 'Manorama',
  'madhyamam.com': 'Madhyamam', 'keralakaumudi.com': 'Kerala Kaumudi',
  'jagbani.com': 'Jagbani', 'tribuneindia.com': 'Tribune India',
  'punjabikhabar.com': 'Punjabi Khabar',
  'dawn.com': 'Dawn', 'jang.com.pk': 'Jang',
  'geo.tv': 'Geo News', 'arynews.tv': 'ARY News', 'express.pk': 'Express',
}

function extractSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    return SOURCE_MAP[hostname] || hostname
  } catch { return 'News' }
}

function extractImageFromTags(item: any): string {
  if (item.mediaContent) {
    if (Array.isArray(item.mediaContent)) {
      const img = item.mediaContent.find((m: any) => m.$?.url)
      if (img) return img.$.url
    } else if (item.mediaContent.$?.url) {
      return item.mediaContent.$.url
    }
  }
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url
  if (item.mediaGroup?.['media:content']?.[0]?.$?.url) {
    return item.mediaGroup['media:content'][0].$.url
  }
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) {
    return item.enclosure.url
  }
  const html = item.contentEncoded || item.content || ''
  const match = html.match(/<img[^>]+src=["']([^"'>]+)["']/i)
  if (match) return match[1]
  return ''
}

async function scrapeOGImage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    if (ogMatch) return ogMatch[1]
    const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    if (twitterMatch) return twitterMatch[1]
    return ''
  } catch { return '' }
}

async function fetchRSS(url: string): Promise<any[]> {
  try {
    const feed = await parser.parseURL(url)
    return feed.items.map(item => ({
      title: item.title || '',
      description: item.contentSnippet || item.summary || '',
      url: item.link || '',
      urlToImage: extractImageFromTags(item),
      publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
      content: item.contentSnippet || '',
      source: { name: extractSourceName(url) },
    })).filter(a => a.title && a.url)
  } catch { return [] }
}

async function fillMissingImages(articles: any[]): Promise<any[]> {
  const toScrape = articles.slice(0, 12).map(async (article) => {
    if (!article.urlToImage) {
      article.urlToImage = await scrapeOGImage(article.url)
    }
    return article
  })
  const scraped = await Promise.all(toScrape)
  return [...scraped, ...articles.slice(12)]
}

function dedupe(articles: any[]) {
  const seen = new Set<string>()
  return articles.filter(a => {
    if (!a.url || !a.title || seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })
}

async function fetchGNews(lang: string, category: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://gnews.io/api/v4/top-headlines?category=${category}&lang=${GNEWS_LANG[lang] || 'en'}&country=${GNEWS_COUNTRY[lang] || 'in'}&max=20&apikey=${process.env.GNEWS_API_KEY}`
    )
    const data = await res.json()
    if (data.errors?.length) return []
    return (data.articles || []).map((a: any) => ({
      title: a.title, description: a.description,
      url: a.url, urlToImage: a.image,
      publishedAt: a.publishedAt, content: a.content,
      source: { name: a.source?.name || 'GNews' },
    }))
  } catch { return [] }
}

async function fetchNewsAPI(lang: string, category: string): Promise<any[]> {
  try {
    const nLang = NEWSAPI_LANG[lang] || 'en'
    const regionKeyword = REGION_KEYWORDS[lang] || 'India'
    const url = lang === 'en' || lang === 'hi' || lang === 'ur'
      ? `https://newsapi.org/v2/top-headlines?country=${lang === 'ur' ? 'pk' : 'in'}&category=${category}&language=${nLang}&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`
      : `https://newsapi.org/v2/everything?q=${encodeURIComponent(regionKeyword)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    return (data.articles || []).map((a: any) => ({
      title: a.title, description: a.description,
      url: a.url, urlToImage: a.urlToImage,
      publishedAt: a.publishedAt, content: a.content,
      source: { name: a.source?.name || 'NewsAPI' },
    })).filter((a: any) => a.title !== '[Removed]')
  } catch { return [] }
}

async function getSupabaseCache(key: string, allowExpired = false): Promise<any[] | null> {
  try {
    const { data } = await supabase
      .from('news_cache')
      .select('articles, cached_at')
      .eq('id', key)
      .single()
    if (!data) return null
    if (!allowExpired) {
      const isExpired = Date.now() - new Date(data.cached_at).getTime() > CACHE_TTL
      if (isExpired) return null
    }
    return data.articles
  } catch { return null }
}

async function setSupabaseCache(key: string, articles: any[]) {
  try {
    await supabase.from('news_cache').upsert({
      id: key, articles,
      cached_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  } catch {}
}

// ─── Main handler ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req)
  if (limited) return limited

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || 'general'
  const lang = searchParams.get('lang') || 'en'
  const q = searchParams.get('q') || ''
  const cacheKey = `${lang}-${category}-${q}`

  // ── Step 1: Supabase fresh cache ──
  if (!q) {
    const cached = await getSupabaseCache(cacheKey)
    if (cached) return NextResponse.json({ articles: cached })
  }

  let articles: any[] = []

  if (q) {
    // ── SEARCH MODE ──
    const enFeeds = RSS_FEEDS['en']['general'] || []
    const results = await Promise.all(enFeeds.map(fetchRSS))
    articles = dedupe(results.flat()).filter(a =>
      a.title.toLowerCase().includes(q.toLowerCase()) ||
      a.description.toLowerCase().includes(q.toLowerCase())
    )
  } else {
    // ── NORMAL MODE — native lang RSS ──
    const langFeeds = RSS_FEEDS[lang] || RSS_FEEDS['en']
    const categoryFeeds = langFeeds[category] || langFeeds['general'] || []
    const results = await Promise.all(categoryFeeds.map(fetchRSS))
    articles = dedupe(results.flat())

    // ── English articles hamesha mix karo extra ke liye ──
if (lang !== 'en') {
  const enFeeds = RSS_FEEDS['en'][category] || RSS_FEEDS['en']['general'] || []
  const enResults = await Promise.all(enFeeds.map(fetchRSS))
  const enArticles = dedupe(enResults.flat())
  articles = dedupe([...articles, ...enArticles])
}
  }

  // ── Images fill karo ──
  if (articles.length > 0) {
    articles = await fillMissingImages(articles)
  }

  // ── Step 3: GNews fallback ──
  if (articles.length === 0) {
    articles = await fetchGNews(lang, category)
  }

  // ── Step 4: NewsAPI fallback ──
  if (articles.length === 0) {
    articles = await fetchNewsAPI(lang, category)
  }

  // ── Step 5: Expired Supabase cache fallback ──
  if (articles.length === 0 && !q) {
    const expiredCache = await getSupabaseCache(cacheKey, true)
    if (expiredCache) return NextResponse.json({ articles: expiredCache })
  }

  // ── Supabase mein save ──
  if (!q && articles.length > 0) {
    await setSupabaseCache(cacheKey, articles)
  }

  return NextResponse.json({ articles })
}
