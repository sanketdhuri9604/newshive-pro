'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { StickyNote, Trash2, ExternalLink, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface Note {
  id: string
  news_url: string
  article_title: string
  note: string
  updated_at: string
}

export default function NotesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user) fetchNotes()
  }, [user])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('article_notes')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
      setNotes(data || [])
    } catch {}
    finally { setLoading(false) }
  }

  const deleteNote = async (id: string) => {
    try {
      await supabase.from('article_notes').delete().eq('id', id)
      setNotes(prev => prev.filter(n => n.id !== id))
      toast.success('Note deleted!')
    } catch {
      toast.error('Could not delete note')
    }
  }

  const openArticle = (note: Note) => {
    const params = new URLSearchParams({
      title: note.article_title,
      url: note.news_url,
    })
    router.push(`/news?${params.toString()}`)
  }

  const filtered = notes.filter(n =>
    n.note.toLowerCase().includes(search.toLowerCase()) ||
    n.article_title.toLowerCase().includes(search.toLowerCase())
  )

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center text-text-muted">
      Login to see your notes
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-5xl tracking-wider">
          MY<span className="text-accent-yellow"> NOTES</span>
        </h1>
        <p className="text-text-muted text-sm mt-1">Your saved thoughts on articles 📝</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search your notes..."
          className="input-field pl-10 text-sm"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl h-32 animate-pulse border border-white/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <p className="text-4xl mb-3">📝</p>
          <p>{search ? 'No notes match your search' : 'No notes yet!'}</p>
          <p className="text-xs mt-1">Open any article and add a note from the article page.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(note => (
            <div key={note.id} className="glass rounded-2xl border border-white/10 p-5 hover:border-accent-yellow/30 transition-all">
              {/* Article title */}
              <p className="text-text-muted text-xs mb-2 line-clamp-1">
                📰 {note.article_title}
              </p>

              {/* Note content */}
              <p className="text-text-primary text-sm leading-relaxed mb-4 italic">
                "{note.note}"
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-xs">
                  {new Date(note.updated_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => openArticle(note)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-white/10 text-text-muted hover:text-text-primary hover:border-white/20 transition-all">
                    <ExternalLink size={11} /> Read Article
                  </button>
                  <button onClick={() => deleteNote(note.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-accent-red/20 text-accent-red hover:bg-accent-red/10 transition-all">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {notes.length > 0 && (
        <p className="text-center text-text-muted text-xs mt-6">
          {filtered.length} of {notes.length} notes
        </p>
      )}
    </div>
  )
}