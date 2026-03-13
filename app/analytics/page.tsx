'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { BarChart2, Clock, BookOpen, Trophy, Flame, Calendar } from 'lucide-react'

interface CategoryStat { category: string; count: number }
interface DayStat { date: string; count: number }

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [totalRead, setTotalRead] = useState(0)
  const [totalSaved, setTotalSaved] = useState(0)
  const [totalQuizzes, setTotalQuizzes] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [last30Days, setLast30Days] = useState<DayStat[]>([])

  useEffect(() => {
    if (user) fetchAll()
  }, [user])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [
        { count: rc },
        { count: sc },
        { data: history },
        { data: quizData },
      ] = await Promise.all([
        supabase.from('reading_history').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('saved_news').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('reading_history').select('category, read_at').eq('user_id', user!.id).order('read_at', { ascending: false }),
        supabase.from('quiz_scores').select('score, total').eq('user_id', user!.id),
      ])

      setTotalRead(rc || 0)
      setTotalSaved(sc || 0)

      // Quiz stats
      if (quizData) {
        setTotalQuizzes(quizData.length)
        const total = quizData.reduce((s, q) => s + q.score, 0)
        const max = quizData.reduce((s, q) => s + q.total, 0)
        setQuizScore(max > 0 ? Math.round((total / max) * 100) : 0)
      }

      // Category stats
      if (history) {
        const catMap: Record<string, number> = {}
        history.forEach(h => {
          const cat = h.category || 'general'
          catMap[cat] = (catMap[cat] || 0) + 1
        })
        setCategoryStats(
          Object.entries(catMap)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)
        )

        // Last 30 days heatmap
        const days: Record<string, number> = {}
        const now = new Date()
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 86400000)
          days[d.toDateString()] = 0
        }
        history.forEach(h => {
          const d = new Date(h.read_at).toDateString()
          if (days[d] !== undefined) days[d]++
        })
        setLast30Days(Object.entries(days).map(([date, count]) => ({ date, count })))

        // Streak
        const uniqueDays = Array.from(new Set(history.map(h => new Date(h.read_at).toDateString())))
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        let s = 0
        let check = new Date()
        for (const day of uniqueDays) {
          if (day === check.toDateString()) { s++; check = new Date(check.getTime() - 86400000) }
          else break
        }
        setStreak(s)
      }
    } catch {}
    finally { setLoading(false) }
  }

  const maxDay = Math.max(...last30Days.map(d => d.count), 1)
  const maxCat = Math.max(...categoryStats.map(c => c.count), 1)

  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-white/5'
    if (count <= 1) return 'bg-accent-purple/30'
    if (count <= 3) return 'bg-accent-purple/60'
    return 'bg-accent-purple'
  }

  const CATEGORY_COLORS: Record<string, string> = {
    technology: 'bg-accent-cyan', sports: 'bg-accent-green', politics: 'bg-accent-red',
    business: 'bg-accent-yellow', entertainment: 'bg-accent-pink', health: 'bg-green-400',
    science: 'bg-blue-400', world: 'bg-orange-400', cricket: 'bg-accent-green',
    bollywood: 'bg-accent-pink', general: 'bg-accent-purple',
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center text-text-muted">
      Login to see your analytics
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-5xl tracking-wider">
          MY<span className="text-accent-cyan"> STATS</span>
        </h1>
        <p className="text-text-muted text-sm mt-1">Your reading analytics 📊</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-24 animate-pulse border border-white/5" />)}
        </div>
      ) : (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="glass rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={14} className="text-accent-purple" />
                <span className="text-xs text-text-muted">Articles Read</span>
              </div>
              <p className="text-4xl font-bold font-display text-text-primary">{totalRead}</p>
            </div>
            <div className="glass rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Flame size={14} className="text-accent-orange" />
                <span className="text-xs text-text-muted">Current Streak</span>
              </div>
              <p className="text-4xl font-bold font-display text-accent-orange">{streak} 🔥</p>
            </div>
            <div className="glass rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={14} className="text-accent-yellow" />
                <span className="text-xs text-text-muted">Quiz Accuracy</span>
              </div>
              <p className="text-4xl font-bold font-display text-accent-yellow">{quizScore}%</p>
              <p className="text-xs text-text-muted mt-1">{totalQuizzes} quizzes played</p>
            </div>
            <div className="glass rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-accent-cyan" />
                <span className="text-xs text-text-muted">Saved Articles</span>
              </div>
              <p className="text-4xl font-bold font-display text-accent-cyan">{totalSaved}</p>
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="glass rounded-2xl border border-white/10 p-5 mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Calendar size={14} className="text-accent-purple" /> Last 30 Days Activity
            </h3>
            <div className="grid grid-cols-10 gap-1.5">
              {last30Days.map((day, i) => (
                <div key={i} title={`${day.date}: ${day.count} articles`}
                  className={`aspect-square rounded-md transition-all ${getCellColor(day.count)}`} />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-xs text-text-muted">Less</span>
              <div className="w-3 h-3 rounded-sm bg-white/5" />
              <div className="w-3 h-3 rounded-sm bg-accent-purple/30" />
              <div className="w-3 h-3 rounded-sm bg-accent-purple/60" />
              <div className="w-3 h-3 rounded-sm bg-accent-purple" />
              <span className="text-xs text-text-muted">More</span>
            </div>
          </div>

          {/* Category Breakdown */}
          {categoryStats.length > 0 && (
            <div className="glass rounded-2xl border border-white/10 p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <BarChart2 size={14} className="text-accent-cyan" /> Top Categories
              </h3>
              <div className="space-y-3">
                {categoryStats.map(cat => (
                  <div key={cat.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary capitalize">{cat.category}</span>
                      <span className="text-text-muted">{cat.count} articles</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${CATEGORY_COLORS[cat.category] || 'bg-accent-purple'}`}
                        style={{ width: `${(cat.count / maxCat) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}