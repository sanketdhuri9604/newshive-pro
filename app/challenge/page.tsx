'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Zap, Trophy, CheckCircle, Lock } from 'lucide-react'
import QuizModal from '@/components/ai/QuizModal'
import toast from 'react-hot-toast'

interface Challenge {
  id: string
  date: string
  article_url: string
  article_title: string
  article_description: string
  article_image: string
  article_source: string
  category: string
}

export default function DailyChallengePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [completed, setCompleted] = useState(false)
  const [completedScore, setCompletedScore] = useState<number | null>(null)
  const [completedTotal, setCompletedTotal] = useState<number>(4)
  const [loading, setLoading] = useState(true)
  const [articleRead, setArticleRead] = useState(false)
  const [totalCompleted, setTotalCompleted] = useState(0)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchChallenge()
    if (user) fetchUserStats()
  }, [user])

  const fetchChallenge = async () => {
    setLoading(true)
    try {
      // Check if today's challenge exists
      let { data } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('date', today)
        .single()

      if (!data) {
        // Auto-create today's challenge by fetching a random article
        const res = await fetch('/api/news?category=general&lang=en')
        const newsData = await res.json()
        const articles = newsData.articles || []
        if (articles.length > 0) {
          const pick = articles[Math.floor(Math.random() * Math.min(5, articles.length))]
          const { data: created } = await supabase
            .from('daily_challenges')
            .insert({
              date: today,
              article_url: pick.url,
              article_title: pick.title,
              article_description: pick.description || '',
              article_image: pick.urlToImage || '',
              article_source: pick.source?.name || '',
              category: 'general',
            })
            .select()
            .single()
          data = created
        }
      }

      setChallenge(data)

      // Check if user already completed
      if (user && data) {
        const { data: completion } = await supabase
          .from('challenge_completions')
          .select('score')
          .eq('user_id', user.id)
          .eq('challenge_date', today)
          .maybeSingle()
        if (completion) {
          setCompleted(true)
          setCompletedScore(completion.score)
        }
      }
    } catch {}
    finally { setLoading(false) }
  }

  const fetchUserStats = async () => {
    if (!user) return
    const { count } = await supabase
      .from('challenge_completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    setTotalCompleted(count || 0)
  }

  const handleReadArticle = () => {
    if (!challenge) return
    const params = new URLSearchParams({
      title: challenge.article_title,
      description: challenge.article_description,
      url: challenge.article_url,
      image: challenge.article_image,
      source: challenge.article_source,
    })
    router.push(`/news?${params.toString()}`)
    setArticleRead(true)
    localStorage.setItem(`challenge_read_${today}`, '1')
  }

  useEffect(() => {
    if (localStorage.getItem(`challenge_read_${today}`)) setArticleRead(true)
  }, [])

  const handleQuizComplete = async (score: number, total: number) => {
    if (!user || completed) return
    try {
      const { error } = await supabase.from('challenge_completions').insert({
        user_id: user.id,
        challenge_date: today,
        score,
        completed_at: new Date().toISOString(),
      })
      if (error) {
        console.error('Challenge save error:', error)
        toast.error('Could not save score: ' + error.message)
        return
      }
      setCompleted(true)
      setCompletedScore(score)
      setCompletedTotal(total)
      setTotalCompleted(p => p + 1)
      toast.success(`Challenge complete! ${score}/${total} 🎉`)
    } catch (err) {
      console.error('Challenge catch error:', err)
    }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl h-32 animate-pulse border border-white/5" />)}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-5xl tracking-wider">
          DAILY<span className="text-accent-orange"> CHALLENGE</span>
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass rounded-2xl border border-white/10 p-4 text-center">
          <p className="text-3xl font-bold font-display text-accent-orange">{totalCompleted}</p>
          <p className="text-xs text-text-muted mt-1">Challenges Done</p>
        </div>
        <div className="glass rounded-2xl border border-white/10 p-4 text-center">
          <p className="text-3xl font-bold font-display text-accent-yellow">
            {completed ? `${completedScore}/${completedTotal}` : '—'}
          </p>
          <p className="text-xs text-text-muted mt-1">Today's Score</p>
        </div>
      </div>

      {challenge ? (
        <div className="space-y-4">
          {/* Completed banner */}
          {completed && (
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-accent-green/30 bg-accent-green/10">
              <CheckCircle size={20} className="text-accent-green flex-shrink-0" />
              <div>
                <p className="text-accent-green font-semibold text-sm">Challenge Complete! 🎉</p>
                <p className="text-text-muted text-xs">Score: {completedScore}/{completedTotal} — Come back tomorrow!</p>
              </div>
            </div>
          )}

          {/* Article card */}
          <div className="glass rounded-2xl border border-accent-orange/20 overflow-hidden">
            {challenge.article_image && (
              <img src={challenge.article_image} alt="" className="w-full h-48 object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-accent-orange flex items-center gap-1">
                  <Zap size={10} /> TODAY'S ARTICLE
                </span>
                <span className="text-xs text-text-muted">— {challenge.article_source}</span>
              </div>
              <h2 className="text-text-primary font-semibold text-base leading-snug mb-3">
                {challenge.article_title}
              </h2>
              {challenge.article_description && (
                <p className="text-text-muted text-sm line-clamp-2 mb-4">{challenge.article_description}</p>
              )}
              <button onClick={handleReadArticle}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-accent-orange/10 hover:bg-accent-orange/20 border border-accent-orange/20 text-accent-orange transition-all">
                {articleRead ? '✅ Article Read' : '📖 Read Article First'}
              </button>
            </div>
          </div>

          {/* Quiz section */}
          <div className="glass rounded-2xl border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={15} className="text-accent-yellow" />
              <h3 className="text-sm font-semibold text-text-primary">Quiz Time</h3>
              {!articleRead && !completed && (
                <span className="flex items-center gap-1 text-xs text-text-muted ml-auto">
                  <Lock size={11} /> Read article first
                </span>
              )}
            </div>

            {completed ? (
              <div className={`p-4 rounded-xl text-center text-sm font-medium border ${
                (completedScore || 0) >= 4 ? 'bg-green-400/10 border-green-400/20 text-green-400' :
                (completedScore || 0) >= 3 ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' :
                'bg-red-400/10 border-red-400/20 text-red-400'
              }`}>
                You scored {completedScore}/{completedTotal} today! 🎯
              </div>
            ) : articleRead ? (
              <QuizModal
                title={challenge.article_title}
                description={challenge.article_description}
                articleUrl={challenge.article_url}
                onComplete={handleQuizComplete}
                allowRetry={false}
              />
            ) : (
              <div className="text-center py-6 text-text-muted">
                <p className="text-3xl mb-2">🔒</p>
                <p className="text-sm">Read the article above to unlock the quiz!</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-text-muted">
          <p className="text-4xl mb-3">⚡</p>
          <p>No challenge available today. Check back soon!</p>
        </div>
      )}
    </div>
  )
}