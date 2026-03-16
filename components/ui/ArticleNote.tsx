'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/shared/AuthProvider'
import { useLang } from '@/components/shared/LangProvider'
import { supabase } from '@/lib/supabase'
import { StickyNote, Save, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ArticleNote({ newsUrl, articleTitle }: { newsUrl: string; articleTitle: string }) {
  const { user } = useAuth()
  const { t } = useLang()
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (user && open) fetchNote()
  }, [user, open])

  const fetchNote = async () => {
    setFetching(true)
    try {
      const { data } = await supabase
        .from('article_notes')
        .select('note')
        .eq('user_id', user!.id)
        .eq('news_url', newsUrl)
        .single()
      if (data) { setNote(data.note); setSaved(data.note) }
    } catch {}
    finally { setFetching(false) }
  }

  const saveNote = async () => {
    if (!user) { toast.error(t('notes.loginToSave')); return }
    if (!note.trim()) { deleteNote(); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('article_notes').upsert({
        user_id: user.id,
        news_url: newsUrl,
        article_title: articleTitle,
        note: note.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,news_url' })
      if (error) throw error
      setSaved(note.trim())
      toast.success(t('notes.saved'))
    } catch {
      toast.error(t('notes.saveFailed'))
    } finally { setLoading(false) }
  }

  const deleteNote = async () => {
    if (!user) return
    setLoading(true)
    try {
      await supabase.from('article_notes').delete()
        .eq('user_id', user.id).eq('news_url', newsUrl)
      setNote('')
      setSaved('')
      toast.success(t('notes.deleted'))
    } catch {
      toast.error(t('notes.deleteFailed'))
    } finally { setLoading(false) }
  }

  if (!user) return null

  return (
    <div className="rounded-2xl border overflow-hidden transition-all"
      style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', borderColor: open ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)' }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left">
        <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <span className="text-lg">📝</span>
          {t('notes.myNote')}
          {saved && <span className="text-xs text-accent-yellow/70 font-normal">• {t('notes.savedLabel')}</span>}
        </span>
        {open ? <ChevronUp size={15} className="text-accent-yellow" /> : <ChevronDown size={15} className="text-text-muted" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {fetching ? (
            <div className="skeleton h-20 rounded-xl" />
          ) : (
            <>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder={t('notes.placeholder')}
                className="input-field resize-none text-sm"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{note.length}/500</span>
                <div className="flex gap-2">
                  {saved && (
                    <button onClick={deleteNote} disabled={loading}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-accent-red hover:bg-accent-red/10 border border-accent-red/20 transition-all disabled:opacity-50">
                      <Trash2 size={12} /> {t('notes.delete')}
                    </button>
                  )}
                  <button onClick={saveNote} disabled={loading || note === saved}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-accent-yellow/10 hover:bg-accent-yellow/20 border border-accent-yellow/20 text-accent-yellow transition-all disabled:opacity-50">
                    {loading ? <span className="w-3 h-3 border border-accent-yellow/30 border-t-accent-yellow rounded-full animate-spin" /> : <Save size={12} />}
                    {t('notes.save')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
