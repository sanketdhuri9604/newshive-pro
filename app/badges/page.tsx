'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { BADGES, checkBadges, BadgeId } from '@/lib/badges'
import toast from 'react-hot-toast'

export default function BadgesPage() {
  const { user } = useAuth()
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [newBadges, setNewBadges] = useState<BadgeId[]>([])

  useEffect(() => {
    if (user) fetchAndSync()
  }, [user])

  const fetchAndSync = async () => {
    setLoading(true)
    try {
      const [
        { data: existing },
        { count: totalRead },
        { data: history },
        { data: quizData },
        { count: totalShares },
        { count: totalNotes },
        { count: challengesCompleted },
      ] = await Promise.all([
        supabase.from('user_badges').select('badge_id').eq('user_id', user!.id),
        supabase.from('reading_history').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('reading_history').select('read_at').eq('user_id', user!.id).order('read_at', { ascending: false }),
        supabase.from('quiz_scores').select('score, total').eq('user_id', user!.id),
        supabase.from('community_shares').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('article_notes').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('challenge_completions').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
      ])

      // Calculate streak
      const uniqueDays = Array.from(new Set((history || []).map(h => new Date(h.read_at).toDateString())))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      let streak = 0
      let check = new Date()
      for (const day of uniqueDays) {
        if (day === check.toDateString()) { streak++; check = new Date(check.getTime() - 86400000) }
        else break
      }

      const perfectQuizzes = (quizData || []).filter(q => q.score === q.total).length

      const shouldHave = checkBadges({
        totalRead: totalRead || 0,
        streak,
        totalQuizzes: (quizData || []).length,
        perfectQuizzes,
        totalShares: totalShares || 0,
        totalNotes: totalNotes || 0,
        challengesCompleted: challengesCompleted || 0,
        goalHit: false,
      })

      const existingIds = new Set((existing || []).map(b => b.badge_id))
      setEarnedIds(existingIds)

      // Award new badges
      const toAward = shouldHave.filter(b => !existingIds.has(b))
      if (toAward.length > 0) {
        await supabase.from('user_badges').insert(
          toAward.map(badge_id => ({ user_id: user!.id, badge_id }))
        )
        toAward.forEach(b => existingIds.add(b))
        setEarnedIds(new Set(existingIds))
        setNewBadges(toAward)
        toAward.forEach(b => toast.success(`Badge unlocked: ${BADGES[b].emoji} ${BADGES[b].label}!`))
      }
    } catch {}
    finally { setLoading(false) }
  }

  const allBadges = Object.values(BADGES)
  const earned = allBadges.filter(b => earnedIds.has(b.id))
  const locked = allBadges.filter(b => !earnedIds.has(b.id))

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center text-text-muted">
      Login to see your badges
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-5xl tracking-wider">
          MY<span className="text-accent-yellow"> BADGES</span>
        </h1>
        <p className="text-text-muted text-sm mt-1">{earned.length}/{allBadges.length} badges earned 🏅</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => <div key={i} className="glass rounded-2xl h-28 animate-pulse border border-white/5" />)}
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="glass rounded-2xl border border-white/10 p-5 mb-6">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-text-muted">Progress</span>
              <span className="text-accent-yellow font-medium">{earned.length}/{allBadges.length}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-accent-yellow to-accent-orange transition-all duration-700"
                style={{ width: `${(earned.length / allBadges.length) * 100}%` }} />
            </div>
          </div>

          {/* Earned */}
          {earned.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wider">Earned ({earned.length})</p>
              <div className="grid grid-cols-3 gap-3">
                {earned.map(badge => (
                  <div key={badge.id}
                    className={`glass rounded-2xl border p-4 text-center transition-all ${newBadges.includes(badge.id as BadgeId) ? 'border-accent-yellow/50 shadow-glow-yellow animate-pulse' : 'border-white/10'}`}>
                    <p className="text-3xl mb-2">{badge.emoji}</p>
                    <p className="text-text-primary text-xs font-semibold">{badge.label}</p>
                    <p className="text-text-muted text-[10px] mt-1 leading-tight">{badge.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked */}
          {locked.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wider">Locked ({locked.length})</p>
              <div className="grid grid-cols-3 gap-3">
                {locked.map(badge => (
                  <div key={badge.id} className="glass rounded-2xl border border-white/5 p-4 text-center opacity-40">
                    <p className="text-3xl mb-2 grayscale">{badge.emoji}</p>
                    <p className="text-text-muted text-xs font-semibold">{badge.label}</p>
                    <p className="text-text-muted text-[10px] mt-1 leading-tight">{badge.desc}</p>
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