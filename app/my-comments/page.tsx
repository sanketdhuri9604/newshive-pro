'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { MessageSquare, Trash2, ExternalLink, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface Comment {
  id: string
  news_url: string
  content: string
  created_at: string
}

export default function MyCommentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user) fetchComments()
  }, [user])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('comments')
        .select('id, news_url, content, created_at')
        .eq('user_id', user!.id)
        .eq('is_toxic', false)
        .order('created_at', { ascending: false })
      setComments(data || [])
    } catch {}
    finally { setLoading(false) }
  }

  const deleteComment = async (id: string) => {
    try {
      await supabase.from('comments').delete().eq('id', id).eq('user_id', user!.id)
      setComments(prev => prev.filter(c => c.id !== id))
      toast.success('Comment deleted!')
    } catch {
      toast.error('Could not delete comment')
    }
  }

  const openArticle = (newsUrl: string) => {
    const params = new URLSearchParams({ url: newsUrl })
    router.push(`/news?${params.toString()}`)
  }

  const filtered = comments.filter(c =>
    c.content.toLowerCase().includes(search.toLowerCase())
  )

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center text-text-muted">
      Login to see your comments
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-5xl tracking-wider">
          MY<span className="text-accent-cyan"> COMMENTS</span>
        </h1>
        <p className="text-text-muted text-sm mt-1">{comments.length} comments total 💬</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search your comments..."
          className="input-field pl-10 text-sm"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl h-24 animate-pulse border border-white/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <p className="text-4xl mb-3">💬</p>
          <p>{search ? 'No comments match your search' : 'No comments yet!'}</p>
          <p className="text-xs mt-1">Go read some articles and join the discussion.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(comment => (
            <div key={comment.id} className="glass rounded-2xl border border-white/10 p-5 hover:border-accent-cyan/30 transition-all">
              {/* Comment content */}
              <p className="text-text-primary text-sm leading-relaxed mb-4">
                "{comment.content}"
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-xs">
                  {new Date(comment.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => openArticle(comment.news_url)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-white/10 text-text-muted hover:text-text-primary hover:border-white/20 transition-all">
                    <ExternalLink size={11} /> View Article
                  </button>
                  <button onClick={() => deleteComment(comment.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-accent-red/20 text-accent-red hover:bg-accent-red/10 transition-all">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {comments.length > 0 && (
        <p className="text-center text-text-muted text-xs mt-6">
          {filtered.length} of {comments.length} comments
        </p>
      )}
    </div>
  )
}