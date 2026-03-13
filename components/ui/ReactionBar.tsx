'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../shared/AuthProvider'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

type ReactionType = 'fire' | 'heart' | 'wow'

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'heart', emoji: '❤️', label: 'Love' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
]

export default function ReactionBar({ newsUrl }: { newsUrl: string }) {
  const { user } = useAuth()
  const [counts, setCounts] = useState<Record<ReactionType, number>>({ fire: 0, heart: 0, wow: 0 })
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null)

  useEffect(() => { loadReactions() }, [newsUrl])

  const loadReactions = async () => {
    const { data, error } = await supabase
      .from('reactions')
      .select('reaction_type')
      .eq('news_url', newsUrl)

    if (!error && data) {
      const c: Record<ReactionType, number> = { fire: 0, heart: 0, wow: 0 }
      data.forEach((r: { reaction_type: string }) => {
        if (r.reaction_type in c) c[r.reaction_type as ReactionType]++
      })
      setCounts(c)
    }

    if (user) {
      const { data: ur } = await supabase
        .from('reactions')
        .select('reaction_type')
        .eq('news_url', newsUrl)
        .eq('user_id', user.id)
        .maybeSingle()
      setUserReaction((ur?.reaction_type as ReactionType) || null)
    }
  }

  const react = async (type: ReactionType) => {
    if (!user) { toast.error('Login to react'); return }
    try {
      if (userReaction === type) {
        const { error } = await supabase.from('reactions').delete().eq('news_url', newsUrl).eq('user_id', user.id)
        if (error) throw error
        setUserReaction(null)
        setCounts(p => ({ ...p, [type]: Math.max(0, p[type] - 1) }))
      } else {
        if (userReaction) {
          await supabase.from('reactions').delete().eq('news_url', newsUrl).eq('user_id', user.id)
          setCounts(p => ({ ...p, [userReaction]: Math.max(0, p[userReaction] - 1) }))
        }
        const { error } = await supabase.from('reactions').insert({ news_url: newsUrl, reaction_type: type, user_id: user.id })
        if (error) throw error
        setUserReaction(type)
        setCounts(p => ({ ...p, [type]: p[type] + 1 }))
      }
    } catch {
      toast.error('Could not react. Try again.')
    }
  }

  return (
    <div className="flex items-center gap-2">
      {REACTIONS.map(({ type, emoji }) => (
        <button
          key={type}
          onClick={() => react(type)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all hover:scale-105 min-h-[44px]',
            userReaction === type
              ? 'border-accent-purple/50 bg-accent-purple/15 text-text-primary'
              : 'border-white/5 text-text-muted hover:border-white/20 hover:bg-white/5'
          )}
        >
          <span>{emoji}</span>
          {counts[type] > 0 && <span className="font-mono text-xs">{counts[type]}</span>}
        </button>
      ))}
    </div>
  )
}