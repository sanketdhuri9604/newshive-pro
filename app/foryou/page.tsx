'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/components/shared/LangProvider'
import NewsCard from '@/components/news/NewsCard'
import { Sparkles, Flame } from 'lucide-react'

interface Article {
  title: string
  description: string
  url: string
  image: string
  publishedAt: string
  source: { name: string }
  category?: string
}

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

export default function ForYouPage() {
  const { user } = useAuth()
  const { lang } = useLang()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTopics, setActiveTopics] = useState<string[]>([])
  const [source, setSource] = useState<'topics' | 'history' | 'general'>('general')

  useEffect(() => {
    fetchForYou()
  }, [user, lang])

  const fetchForYou = async () => {
    setLoading(true)
    setArticles([])

    let topicsToFetch: string[] = []
    let feedSource: 'topics' | 'history' | 'general' = 'general'

    if (user) {
      // 1. Fetch followed topics first
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
          // 2. Fallback to reading history
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

    // Fetch news for topics
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
        // General feed
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
    if (user) {
      try {
        await supabase.from('reading_history').upsert({
          user_id: user.id,
          news_url: article.url,
          title: article.title,
          category: article.category || 'general',
          read_at: new Date().toISOString(),
        }, { onConflict: 'user_id,news_url' })
      } catch {}
    }
    window.open(article.url, '_blank')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
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
            {user ? 'Follow topics in your profile to personalize this feed! ⭐' : 'Login and follow topics to personalize your feed!'}
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-2xl border border-white/5 h-64 animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <p className="text-4xl mb-3">📭</p>
          <p>No articles found. Try following some topics in your profile!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article, i) => (
            <div key={i} onClick={() => handleArticleClick(article)} className="cursor-pointer">
              <NewsCard article={article} index={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}