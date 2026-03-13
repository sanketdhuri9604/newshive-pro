'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Target, Save } from 'lucide-react'
import toast from 'react-hot-toast'


export default function ReadingGoals() {
  const { user } = useAuth()
  const [dailyGoal, setDailyGoal] = useState(5)
  const [weeklyGoal, setWeeklyGoal] = useState(20)
  const [todayCount, setTodayCount] = useState(0)
  const [weekCount, setWeekCount] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) fetchAll()
  }, [user])

  const fetchAll = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

      const [{ data: goal }, { count: tc }, { count: wc }] = await Promise.all([
        supabase.from('reading_goals').select('*').eq('user_id', user!.id).single(),
        supabase.from('reading_history').select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id).gte('read_at', today),
        supabase.from('reading_history').select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id).gte('read_at', weekAgo),
      ])

      if (goal) { setDailyGoal(goal.daily_goal); setWeeklyGoal(goal.weekly_goal) }
      setTodayCount(tc || 0)
      setWeekCount(wc || 0)
    } catch {}
  }

  const saveGoals = async () => {
    if (!user) return
    setSaving(true)
    try {
      await supabase.from('reading_goals').upsert({
        user_id: user.id,
        daily_goal: dailyGoal,
        weekly_goal: weeklyGoal,
      }, { onConflict: 'user_id' })
      toast.success('Goals saved! 🎯')
    } catch {
      toast.error('Could not save goals')
    } finally { setSaving(false) }
  }

  const dailyPct = Math.min(100, Math.round((todayCount / dailyGoal) * 100))
  const weeklyPct = Math.min(100, Math.round((weekCount / weeklyGoal) * 100))

  return (
    <div className="glass rounded-2xl border border-white/10 p-6 mb-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Target size={16} className="text-accent-green" /> Reading Goals
      </h3>

      {/* Daily */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-text-muted">Today</span>
          <span className="text-xs font-medium text-text-primary">{todayCount}/{dailyGoal} articles</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 mb-1">
          <div className="h-full rounded-full bg-gradient-to-r from-accent-green to-accent-cyan transition-all duration-700"
            style={{ width: `${dailyPct}%` }} />
        </div>
        {dailyPct >= 100 && <p className="text-xs text-accent-green">✅ Daily goal achieved!</p>}
      </div>

      {/* Weekly */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-text-muted">This Week</span>
          <span className="text-xs font-medium text-text-primary">{weekCount}/{weeklyGoal} articles</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 mb-1">
          <div className="h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-pink transition-all duration-700"
            style={{ width: `${weeklyPct}%` }} />
        </div>
        {weeklyPct >= 100 && <p className="text-xs text-accent-purple">✅ Weekly goal achieved!</p>}
      </div>

      {/* Set Goals */}
      <div className="border-t border-white/5 pt-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <label className="text-xs text-text-muted whitespace-nowrap">Daily Goal</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setDailyGoal(p => Math.max(1, p - 1))}
              className="w-7 h-7 rounded-lg border border-white/10 text-text-muted hover:text-text-primary flex items-center justify-center text-sm transition-all">−</button>
            <span className="text-text-primary font-bold w-6 text-center text-sm">{dailyGoal}</span>
            <button onClick={() => setDailyGoal(p => Math.min(50, p + 1))}
              className="w-7 h-7 rounded-lg border border-white/10 text-text-muted hover:text-text-primary flex items-center justify-center text-sm transition-all">+</button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <label className="text-xs text-text-muted whitespace-nowrap">Weekly Goal</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeeklyGoal(p => Math.max(1, p - 5))}
              className="w-7 h-7 rounded-lg border border-white/10 text-text-muted hover:text-text-primary flex items-center justify-center text-sm transition-all">−</button>
            <span className="text-text-primary font-bold w-8 text-center text-sm">{weeklyGoal}</span>
            <button onClick={() => setWeeklyGoal(p => Math.min(200, p + 5))}
              className="w-7 h-7 rounded-lg border border-white/10 text-text-muted hover:text-text-primary flex items-center justify-center text-sm transition-all">+</button>
          </div>
        </div>
        <button onClick={saveGoals} disabled={saving}
          className="w-full py-2 bg-accent-green/10 hover:bg-accent-green/20 border border-accent-green/20 text-accent-green text-xs font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
          <Save size={12} /> {saving ? 'Saving...' : 'Save Goals'}
        </button>
      </div>
    </div>
  )
}