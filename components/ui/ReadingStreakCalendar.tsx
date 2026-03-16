'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/shared/AuthProvider'

export default function ReadingStreakCalendar() {
  const { user } = useAuth()
  const [readDays, setReadDays] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from('reading_history')
          .select('read_at')
          .eq('user_id', user.id)
        const days = new Set(
          (data || []).map(d => new Date(d.read_at).toDateString())
        )
        setReadDays(days)
      } catch {}
      finally { setLoading(false) }
    }
    fetch()
  }, [user])

  // Build last 10 weeks (70 days) grid
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: Date[] = []
  for (let i = 69; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(d)
  }

  // Group into weeks of 7
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const DAY_LABELS = ['S','M','T','W','T','F','S']

  // Get month label positions
  const monthLabels: { label: string; col: number }[] = []
  weeks.forEach((week, wi) => {
    const firstDay = week[0]
    if (firstDay.getDate() <= 7) {
      monthLabels.push({ label: MONTH_LABELS[firstDay.getMonth()], col: wi })
    }
  })

  if (loading) return (
    <div className="skeleton h-24 rounded-xl w-full" />
  )

  return (
    <div className="w-full overflow-x-auto scrollbar-none">
      {/* Month labels */}
      <div className="flex gap-1 mb-1 ml-6">
        {weeks.map((_, wi) => {
          const label = monthLabels.find(m => m.col === wi)
          return (
            <div key={wi} className="w-[14px] flex-shrink-0 text-[9px] text-text-muted text-center">
              {label?.label || ''}
            </div>
          )
        })}
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {DAY_LABELS.map((d, i) => (
            <div key={i} className="w-4 h-[14px] text-[9px] text-text-muted flex items-center justify-center">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => {
              const isRead = readDays.has(day.toDateString())
              const isToday = day.toDateString() === today.toDateString()
              const isFuture = day > today

              return (
                <div
                  key={di}
                  title={`${day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${isRead ? ' ✅ Read' : ''}`}
                  className="w-[14px] h-[14px] rounded-sm flex-shrink-0 transition-all duration-200"
                  style={{
                    background: isFuture
                      ? 'transparent'
                      : isRead
                      ? isToday
                        ? '#EC4899'
                        : '#8B5CF6'
                      : 'rgba(255,255,255,0.06)',
                    border: isToday
                      ? '1px solid rgba(236,72,153,0.6)'
                      : '1px solid transparent',
                    boxShadow: isRead && isToday
                      ? '0 0 6px rgba(236,72,153,0.5)'
                      : isRead
                      ? '0 0 4px rgba(139,92,246,0.3)'
                      : 'none',
                    opacity: isFuture ? 0 : 1,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 justify-end">
        <span className="text-[10px] text-text-muted">Less</span>
        {['rgba(255,255,255,0.06)', 'rgba(139,92,246,0.3)', 'rgba(139,92,246,0.6)', '#8B5CF6'].map((bg, i) => (
          <div key={i} className="w-[14px] h-[14px] rounded-sm" style={{ background: bg }} />
        ))}
        <span className="text-[10px] text-text-muted">More</span>
      </div>
    </div>
  )
}