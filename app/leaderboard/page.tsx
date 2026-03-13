'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/shared/AuthProvider'
import { Trophy, Medal, Zap, Crown } from 'lucide-react'

interface ScoreEntry {
  id: string
  user_id: string
  username: string
  score: number
  total: number
  article_title: string
  article_url: string
  played_at: string
}

interface LeaderEntry {
  username: string
  user_id: string
  totalScore: number
  totalQuizzes: number
  perfectScores: number
  avgPercent: number
}

const TABS = ['All Time', 'This Week', 'Today'] as const
type Tab = typeof TABS[number]

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [leaders, setLeaders] = useState<LeaderEntry[]>([])
  const [recentScores, setRecentScores] = useState<ScoreEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('All Time')
  const [myStats, setMyStats] = useState<LeaderEntry | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [tab])

  useEffect(() => {
    if (user) fetchMyStats()
  }, [user])

  const getDateFilter = () => {
    if (tab === 'Today') return new Date(new Date().setHours(0,0,0,0)).toISOString()
    if (tab === 'This Week') return new Date(Date.now() - 7 * 86400000).toISOString()
    return null
  }

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('quiz_scores')
        .select('*')
        .order('played_at', { ascending: false })

      const dateFilter = getDateFilter()
      if (dateFilter) query = query.gte('played_at', dateFilter)

      const { data } = await query.limit(200)
      if (!data) return

      setRecentScores(data.slice(0, 10))

      // Aggregate by user
      const userMap: Record<string, LeaderEntry> = {}
      for (const row of data) {
        if (!userMap[row.user_id]) {
          userMap[row.user_id] = {
            username: row.username,
            user_id: row.user_id,
            totalScore: 0,
            totalQuizzes: 0,
            perfectScores: 0,
            avgPercent: 0,
          }
        }
        userMap[row.user_id].totalScore += row.score
        userMap[row.user_id].totalQuizzes += 1
        if (row.score === row.total) userMap[row.user_id].perfectScores += 1
      }

      const sorted = Object.values(userMap)
        .map(u => ({
          ...u,
          avgPercent: Math.round((u.totalScore / (u.totalQuizzes * 4)) * 100),
        }))
        .sort((a, b) => b.totalScore - a.totalScore)

      setLeaders(sorted.slice(0, 20))
    } catch {}
    finally { setLoading(false) }
  }

  const fetchMyStats = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('quiz_scores')
        .select('*')
        .eq('user_id', user.id)

      if (!data || !data.length) return

      const totalScore = data.reduce((s, r) => s + r.score, 0)
      const perfectScores = data.filter(r => r.score === r.total).length
      setMyStats({
        username: data[0].username,
        user_id: user.id,
        totalScore,
        totalQuizzes: data.length,
        perfectScores,
        avgPercent: Math.round((totalScore / (data.length * 4)) * 100),
      })
    } catch {}
  }

  const getRankIcon = (i: number) => {
    if (i === 0) return <Crown size={16} className="text-yellow-400" />
    if (i === 1) return <Medal size={16} className="text-gray-300" />
    if (i === 2) return <Medal size={16} className="text-amber-600" />
    return <span className="text-text-muted font-mono text-sm w-4 text-center">{i + 1}</span>
  }

  const getRankBg = (i: number) => {
    if (i === 0) return 'border-yellow-400/30 bg-yellow-400/5'
    if (i === 1) return 'border-gray-300/20 bg-gray-300/5'
    if (i === 2) return 'border-amber-600/20 bg-amber-600/5'
    return 'border-white/5 bg-white/2'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      <div className="mb-8">
        <h1 className="font-display text-5xl tracking-wider">
          LEADER<span className="text-accent-yellow">BOARD</span>
        </h1>
        <p className="text-text-muted text-sm mt-1">Top quiz performers on NewsHive 🧩</p>
      </div>

      {/* My Stats */}
      {myStats && (
        <div className="glass rounded-2xl border border-accent-purple/20 p-5 mb-6">
          <p className="text-xs text-text-muted mb-3 flex items-center gap-1.5"><Zap size={12} className="text-accent-purple" /> Your Stats</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold font-display text-accent-purple">{myStats.totalScore}</p>
              <p className="text-xs text-text-muted">Total Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-display text-accent-cyan">{myStats.totalQuizzes}</p>
              <p className="text-xs text-text-muted">Quizzes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-display text-accent-yellow">{myStats.perfectScores}</p>
              <p className="text-xs text-text-muted">Perfect 🎯</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-muted">Accuracy</span>
              <span className="text-accent-purple font-medium">{myStats.avgPercent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-pink transition-all duration-1000" style={{ width: `${myStats.avgPercent}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t ? 'bg-accent-purple/20 border border-accent-purple/40 text-accent-purple' : 'border border-white/10 text-text-muted hover:text-text-primary hover:border-white/20'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="glass rounded-xl h-16 animate-pulse border border-white/5" />)}
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-4xl mb-3">🧩</p>
          <p>No scores yet for this period!</p>
          <p className="text-xs mt-1">Be the first to take a quiz.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-8">
          {leaders.map((entry, i) => (
            <div key={entry.user_id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getRankBg(i)} ${entry.user_id === user?.id ? 'ring-1 ring-accent-purple/30' : ''}`}>
              <div className="flex items-center justify-center w-6 flex-shrink-0">
                {getRankIcon(i)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-semibold truncate">
                  @{entry.username}
                  {entry.user_id === user?.id && <span className="text-xs text-accent-purple ml-2">(you)</span>}
                </p>
                <p className="text-text-muted text-xs">{entry.totalQuizzes} quizzes · {entry.perfectScores} perfect 🎯</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-text-primary font-bold font-display">{entry.totalScore}</p>
                <p className="text-text-muted text-xs">{entry.avgPercent}% acc</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Scores */}
      {recentScores.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Trophy size={14} className="text-accent-yellow" /> Recent Activity
          </h3>
          <div className="space-y-2">
            {recentScores.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 glass rounded-xl border border-white/5">
                <div className={`text-sm font-bold font-display w-10 text-center flex-shrink-0 ${s.score === s.total ? 'text-green-400' : s.score >= s.total / 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {s.score}/{s.total}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-xs font-medium truncate">@{s.username}</p>
                  <p className="text-text-muted text-xs truncate">{s.article_title}</p>
                </div>
                <p className="text-text-muted text-xs flex-shrink-0">
                  {new Date(s.played_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}