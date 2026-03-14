'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Heart, ExternalLink, Users, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Share {
  id: string
  user_id: string
  username: string
  news_url: string
  title: string
  description: string
  image: string
  source: string
  comment: string
  likes: number
  shared_at: string
  liked?: boolean
}

export default function CommunityPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [shares, setShares] = useState<Share[]>([])
  const [loading, setLoading] = useState(true)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  const openArticle = (share: Share) => {
    const params = new URLSearchParams({
      title: share.title || '',
      description: share.description || '',
      url: share.news_url || '',
      image: share.image || '',
      source: share.source || '',
    })
    router.push(`/news?${params.toString()}`)
  }

  useEffect(() => {
    fetchShares()
  }, [user])

  const fetchShares = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('community_shares')
        .select('*')
        .order('shared_at', { ascending: false })
        .limit(50)

      setShares(data || [])

      // Fetch user likes
      if (user && data) {
        const { data: likes } = await supabase
          .from('community_likes')
          .select('share_id')
          .eq('user_id', user.id)
        if (likes) setLikedIds(new Set(likes.map(l => l.share_id)))
      }
    } catch {}
    finally { setLoading(false) }
  }

  const deleteShare = async (shareId: string) => {
    try {
      await supabase.from('community_shares').delete().eq('id', shareId).eq('user_id', user!.id)
      setShares(prev => prev.filter(s => s.id !== shareId))
      toast.success('Post deleted!')
    } catch {
      toast.error('Could not delete post')
    }
  }

  const toggleLike = async (share: Share) => {
    if (!user) { toast.error('Login to like!'); return }
    const liked = likedIds.has(share.id)

    // Optimistic update
    setLikedIds(prev => {
      const next = new Set(prev)
      liked ? next.delete(share.id) : next.add(share.id)
      return next
    })
    setShares(prev => prev.map(s => s.id === share.id ? { ...s, likes: s.likes + (liked ? -1 : 1) } : s))

    try {
      if (liked) {
        await supabase.from('community_likes').delete()
          .eq('user_id', user.id).eq('share_id', share.id)
        await supabase.from('community_shares').update({ likes: share.likes - 1 }).eq('id', share.id)
      } else {
        await supabase.from('community_likes').insert({ user_id: user.id, share_id: share.id })
        await supabase.from('community_shares').update({ likes: share.likes + 1 }).eq('id', share.id)
      }
    } catch {
      // Revert on error
      setLikedIds(prev => {
        const next = new Set(prev)
        liked ? next.add(share.id) : next.delete(share.id)
        return next
      })
      setShares(prev => prev.map(s => s.id === share.id ? { ...s, likes: share.likes } : s))
    }
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-5xl tracking-wider">
          COMMUNITY<span className="text-accent-pink"> FEED</span>
        </h1>
        <p className="text-text-muted text-sm mt-1 flex items-center gap-1.5">
          <Users size={13} /> Articles shared by the NewsHive community
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-40 animate-pulse border border-white/5" />)}
        </div>
      ) : shares.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <p className="text-4xl mb-3">👥</p>
          <p>No shares yet!</p>
          <p className="text-xs mt-1">Share an article from the news page to start.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shares.map(share => (
            <div key={share.id} className="glass rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all">
              {/* Image */}
              {share.image && (
                <img src={share.image} alt={share.title}
                  className="w-full h-40 object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )}
              <div className="p-4">
                {/* User + time */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{share.username?.[0]?.toUpperCase()}</span>
                    </div>
                    <span className="text-text-secondary text-sm font-medium">@{share.username}</span>
                  </div>
                  <span className="text-text-muted text-xs">{timeAgo(share.shared_at)}</span>
                </div>

                {/* Comment */}
                {share.comment && (
                  <p className="text-text-primary text-sm mb-2 italic">"{share.comment}"</p>
                )}

                {/* Article */}
                <div className="bg-white/3 rounded-xl p-3 border border-white/5 mb-3">
                  <p className="text-text-primary text-sm font-medium line-clamp-2 mb-1">{share.title}</p>
                  {share.description && (
                    <p className="text-text-muted text-xs line-clamp-2">{share.description}</p>
                  )}
                  <p className="text-text-muted text-xs mt-1">— {share.source}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleLike(share)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      likedIds.has(share.id)
                        ? 'bg-accent-pink/20 border-accent-pink/40 text-accent-pink'
                        : 'border-white/10 text-text-muted hover:border-white/20 hover:text-text-primary'
                    }`}>
                    <Heart size={12} className={likedIds.has(share.id) ? 'fill-accent-pink' : ''} />
                    {share.likes}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); openArticle(share) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 text-text-muted hover:border-white/20 hover:text-text-primary transition-all">
                    <ExternalLink size={12} /> Read Article
                  </button>
                  {user?.id === share.user_id && (
                    <button onClick={() => deleteShare(share.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-accent-red/20 text-accent-red hover:bg-accent-red/10 transition-all ml-auto">
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}