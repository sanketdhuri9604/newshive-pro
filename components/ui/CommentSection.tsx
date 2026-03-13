'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useAuth } from '../shared/AuthProvider'
import { Send, Loader2, ShieldAlert, ChevronUp, ChevronDown } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Comment } from '@/lib/types'

export default function CommentSection({ newsUrl }: { newsUrl: string }) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [input, setInput] = useState('')
  const [posting, setPosting] = useState(false)
  const [open, setOpen] = useState(false)
  const supabase = getSupabase()

  useEffect(() => { loadComments() }, [newsUrl])

  const loadComments = async () => {
    const { data, error } = await supabase.from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('news_url', newsUrl)
      .eq('is_toxic', false)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) { toast.error('Could not load comments'); return }
    setComments((data as Comment[]) || [])
  }

  const postComment = async () => {
    if (!user) { toast.error('Login to comment'); return }
    if (!input.trim()) return
    setPosting(true)
    try {
      const toxRes = await fetch('/api/ai/toxicity', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: input })
      }).then(r => r.json())

      if (toxRes.toxic) {
        toast.error('Comment flagged as toxic and not posted.')
        setPosting(false)
        return
      }

      const { error } = await supabase.from('comments').insert({
        news_url: newsUrl, content: input, user_id: user.id, is_toxic: false
      })
      if (error) throw error

      setInput('')
      await loadComments()
      toast.success('Comment posted!')
    } catch {
      toast.error('Could not post comment. Try again.')
    }
    setPosting(false)
  }

  return (
    <div className="rounded-2xl border overflow-hidden transition-all"
      style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', borderColor: open ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)' }}>

      {/* Header */}
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
        <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <span className="text-lg">💬</span>
          Discussion ({comments.length})
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <ShieldAlert size={11} className="text-accent-green" />
            <span>AI moderated</span>
          </div>
          {open ? <ChevronUp size={15} className="text-accent-purple" /> : <ChevronDown size={15} className="text-text-muted" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
          {/* Input */}
          <div className="flex gap-2">
            <input
              className="input-field text-sm flex-1"
              placeholder={user ? "Share your thoughts..." : "Login to comment"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && postComment()}
              disabled={!user || posting}
            />
            <button onClick={postComment} disabled={!user || posting || !input.trim()}
              className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-xl disabled:opacity-40 transition-all">
              {posting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>

          {/* Comments */}
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3 rounded-xl p-3 border border-white/5"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex-shrink-0 flex items-center justify-center text-xs text-white font-medium overflow-hidden">
                  {c.profiles?.avatar_url ? (
                    <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    c.profiles?.username?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-text-primary">{c.profiles?.username || 'Anonymous'}</span>
                    <span className="text-xs text-text-muted">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-text-muted text-sm py-4">No comments yet. Be the first!</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}