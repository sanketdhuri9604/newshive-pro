'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Mail, Edit3, Save, X, Bookmark, Clock, Flame, Check, Lock, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ReadingGoals from '@/components/ui/ReadingGoals'

const ALL_TOPICS = [
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'sports', label: 'Sports', emoji: '🏆' },
  { id: 'politics', label: 'Politics', emoji: '🏛️' },
  { id: 'business', label: 'Business', emoji: '📈' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { id: 'health', label: 'Health', emoji: '❤️' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'world', label: 'World', emoji: '🌍' },
  { id: 'cricket', label: 'Cricket', emoji: '🏏' },
  { id: 'bollywood', label: 'Bollywood', emoji: '🎭' },
  { id: 'startups', label: 'Startups', emoji: '🚀' },
  { id: 'climate', label: 'Climate', emoji: '🌱' },
]

function calculateStreak(dates: string[]) {
  if (!dates.length) return { current: 0, longest: 0, todayRead: false }

  const uniqueDays = Array.from(new Set(dates.map(d => new Date(d).toDateString())))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const today = new Date().toDateString()
  const todayRead = uniqueDays[0] === today

  let current = 0
  let checkDate = new Date(todayRead ? Date.now() : Date.now() - 86400000)
  for (let i = 0; i < uniqueDays.length; i++) {
    if (uniqueDays[i] === checkDate.toDateString()) {
      current++
      checkDate = new Date(checkDate.getTime() - 86400000)
    } else break
  }

  let longest = 0
  let temp = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = new Date(uniqueDays[i - 1]).getTime() - new Date(uniqueDays[i]).getTime()
    if (Math.round(diff / 86400000) === 1) { temp++; longest = Math.max(longest, temp) }
    else temp = 1
  }
  longest = Math.max(longest, current, 1)

  return { current, longest, todayRead }
}

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()

  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [historyCount, setHistoryCount] = useState(0)
  const [streak, setStreak] = useState({ current: 0, longest: 0, todayRead: false })
  const [followedTopics, setFollowedTopics] = useState<string[]>([])
  const [savingTopics, setSavingTopics] = useState(false)

  // ── Change Password ──
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // ── Delete Account ──
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user) return
    if (profile) {
      setUsername(profile.username || '')
      setBio(profile.bio || '')
    }
    fetchStats()
    fetchStreak()
    fetchTopics()
  }, [user, profile])

  const fetchStats = async () => {
    if (!user) return
    try {
      const [{ count: sc }, { count: hc }] = await Promise.all([
        supabase.from('saved_news').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('reading_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      setSavedCount(sc || 0)
      setHistoryCount(hc || 0)
    } catch {}
  }

  const fetchStreak = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('reading_history')
        .select('read_at')
        .eq('user_id', user.id)
        .order('read_at', { ascending: false })
      setStreak(calculateStreak(data?.map(d => d.read_at) || []))
    } catch {}
  }

  const fetchTopics = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('profiles')
        .select('followed_topics')
        .eq('id', user.id)
        .single()
      setFollowedTopics(data?.followed_topics || [])
    } catch {}
  }

  const toggleTopic = (topicId: string) => {
    setFollowedTopics(prev =>
      prev.includes(topicId) ? prev.filter(t => t !== topicId) : [...prev, topicId]
    )
  }

  const saveTopics = async () => {
    if (!user) return
    setSavingTopics(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ followed_topics: followedTopics })
        .eq('id', user.id)
      if (error) throw error
      toast.success('Topics saved! ✅')
    } catch {
      toast.error('Could not save topics')
    } finally {
      setSavingTopics(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    if (username.trim().length < 3) { toast.error('Username must be at least 3 characters'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { toast.error('Only letters, numbers, underscore allowed'); return }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.toLowerCase().trim(), bio: bio.trim() })
        .eq('id', user.id)
      if (error) {
        if (error.message.includes('unique')) toast.error('Username already taken!')
        else toast.error('Could not save. Try again.')
      } else {
        toast.success('Profile updated! ✅')
        setEditing(false)
      }
    } catch {
      toast.error('Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out!')
    router.push('/')
  }

  // ── Change Password Handler ──
  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match!'); return }
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password changed successfully! ✅')
      setShowChangePassword(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Could not change password')
    } finally {
      setChangingPassword(false)
    }
  }

  // ── Delete Account Handler ──
  const handleDeleteAccount = async () => {
  if (deleteConfirmText !== 'DELETE') { toast.error('Type DELETE to confirm'); return }
  setDeleting(true)
  try {
    const res = await fetch('/api/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user!.id })
    })
    if (!res.ok) throw new Error('Failed')
    await signOut()
    toast.success('Account deleted. Goodbye! 👋')
    router.push('/')
  } catch {
    toast.error('Could not delete account. Try again.')
  } finally {
    setDeleting(false)
  }
}

  if (!user || !profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      <div className="mb-8">
        <h1 className="font-display text-5xl tracking-wider">
          MY<span className="text-accent-purple"> PROFILE</span>
        </h1>
      </div>

      {/* Profile Card */}
      <div className="glass rounded-2xl border border-white/10 p-6 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center shadow-glow-purple flex-shrink-0">
            <span className="text-white text-2xl font-bold font-display">
              {profile.username?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-text-primary">@{profile.username}</h2>
            <p className="text-text-muted text-sm">{user.email}</p>
            <p className="text-text-muted text-xs mt-1">
              Member since {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-text-muted hover:text-text-primary hover:border-white/20 text-sm transition-all">
            {editing ? <X size={14} /> : <Edit3 size={14} />}
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div onClick={() => router.push('/saved')}
            className="bg-white/3 rounded-xl p-4 border border-white/5 hover:border-accent-purple/30 transition-all cursor-pointer group">
            <div className="flex items-center gap-2 mb-1">
              <Bookmark size={14} className="text-accent-purple" />
              <span className="text-xs text-text-muted">Saved Articles</span>
            </div>
            <p className="text-2xl font-bold font-display text-text-primary group-hover:text-accent-purple transition-colors">{savedCount}</p>
          </div>
          <div onClick={() => router.push('/history')}
            className="bg-white/3 rounded-xl p-4 border border-white/5 hover:border-accent-cyan/30 transition-all cursor-pointer group">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-accent-cyan" />
              <span className="text-xs text-text-muted">Articles Read</span>
            </div>
            <p className="text-2xl font-bold font-display text-text-primary group-hover:text-accent-cyan transition-colors">{historyCount}</p>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4 border-t border-white/5 pt-5">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">@</span>
                <input value={username} onChange={e => setUsername(e.target.value)} className="input-field pl-8" placeholder="username" />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="input-field resize-none" placeholder="Tell us about yourself..." maxLength={160} />
              <p className="text-xs text-text-muted mt-1 text-right">{bio.length}/160</p>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 bg-accent-purple hover:bg-accent-purple/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-all hover:shadow-glow-purple flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="border-t border-white/5 pt-5">
            <p className="text-xs text-text-muted mb-1">Bio</p>
            <p className="text-text-secondary text-sm">{profile.bio || 'No bio yet — click Edit to add one!'}</p>
          </div>
        )}
      </div>

      {/* Reading Streak */}
      <div className="glass rounded-2xl border border-white/10 p-6 mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Flame size={16} className="text-accent-orange" /> Reading Streak
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/3 rounded-xl p-4 border border-white/5 text-center">
            <p className="text-3xl font-bold font-display text-accent-orange">{streak.current}</p>
            <p className="text-xs text-text-muted mt-1">Current</p>
            <p className="text-xs text-text-muted">days 🔥</p>
          </div>
          <div className="bg-white/3 rounded-xl p-4 border border-white/5 text-center">
            <p className="text-3xl font-bold font-display text-accent-purple">{streak.longest}</p>
            <p className="text-xs text-text-muted mt-1">Longest</p>
            <p className="text-xs text-text-muted">days 🏆</p>
          </div>
          <div className="bg-white/3 rounded-xl p-4 border border-white/5 text-center">
            <p className="text-3xl font-bold font-display text-accent-cyan">{historyCount}</p>
            <p className="text-xs text-text-muted mt-1">Total</p>
            <p className="text-xs text-text-muted">articles 📰</p>
          </div>
        </div>
        <p className="text-center text-xs mt-3">
          {streak.todayRead
            ? <span className="text-accent-orange flex items-center justify-center gap-1"><Flame size={11} /> You read today — streak alive!</span>
            : streak.current > 0
            ? <span className="text-text-muted">Read an article today to keep your streak! ⚡</span>
            : <span className="text-text-muted">Start reading to build your streak! 📖</span>
          }
        </p>
      </div>

      <ReadingGoals />

      {/* Topics Follow */}
      <div className="glass rounded-2xl border border-white/10 p-6 mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-1">⭐ Follow Topics</h3>
        <p className="text-xs text-text-muted mb-4">Select topics to personalize your For You feed</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {ALL_TOPICS.map(topic => (
            <button
              key={topic.id}
              onClick={() => toggleTopic(topic.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                followedTopics.includes(topic.id)
                  ? 'bg-accent-purple/20 border-accent-purple/40 text-accent-purple'
                  : 'bg-white/3 border-white/10 text-text-muted hover:border-white/20 hover:text-text-primary'
              }`}
            >
              {topic.emoji} {topic.label}
              {followedTopics.includes(topic.id) && <Check size={10} />}
            </button>
          ))}
        </div>
        <button onClick={saveTopics} disabled={savingTopics}
          className="w-full py-2.5 bg-accent-purple/10 hover:bg-accent-purple/20 border border-accent-purple/20 text-accent-purple text-sm font-medium rounded-xl transition-all disabled:opacity-50">
          {savingTopics ? 'Saving...' : `Save Topics (${followedTopics.length} selected)`}
        </button>
      </div>

      {/* Account Info */}
      <div className="glass rounded-2xl border border-white/10 p-5 mb-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Mail size={14} className="text-text-muted" /> Account
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Email</span>
            <span className="text-text-primary">{user.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">User ID</span>
            <span className="text-text-muted font-mono text-xs">{user.id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      {/* ── Change Password ── */}
      <div className="glass rounded-2xl border border-white/10 p-5 mb-4">
        <button
          onClick={() => setShowChangePassword(!showChangePassword)}
          className="w-full flex items-center justify-between text-sm font-semibold text-text-primary">
          <span className="flex items-center gap-2">
            <Lock size={14} className="text-accent-cyan" /> Change Password
          </span>
          <span className="text-text-muted text-xs">{showChangePassword ? '▲' : '▼'}</span>
        </button>

        {showChangePassword && (
          <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="input-field"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="w-full py-2.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-sm font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {changingPassword
                ? <><span className="w-4 h-4 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" /> Changing...</>
                : <><Lock size={13} /> Change Password</>
              }
            </button>
          </div>
        )}
      </div>

      {/* ── Sign Out ── */}
      <button onClick={handleSignOut}
        className="w-full py-3 border border-accent-red/20 text-accent-red hover:bg-accent-red/10 rounded-xl text-sm font-medium transition-all mb-4">
        Sign Out
      </button>

      {/* ── Delete Account ── */}
      <div className="glass rounded-2xl border border-accent-red/20 p-5">
        <button
          onClick={() => setShowDeleteAccount(!showDeleteAccount)}
          className="w-full flex items-center justify-between text-sm font-semibold text-accent-red">
          <span className="flex items-center gap-2">
            <Trash2 size={14} /> Delete Account
          </span>
          <span className="text-xs opacity-60">{showDeleteAccount ? '▲' : '▼'}</span>
        </button>

        {showDeleteAccount && (
          <div className="mt-4 space-y-3 border-t border-accent-red/10 pt-4">
            <p className="text-xs text-text-muted leading-relaxed">
              ⚠️ This will permanently delete your account and all data including saved articles, comments, notes, badges, and reading history. <strong className="text-accent-red">This cannot be undone!</strong>
            </p>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">
                Type <strong className="text-accent-red">DELETE</strong> to confirm
              </label>
              <input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="input-field border-accent-red/20 focus:border-accent-red/40"
              />
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirmText !== 'DELETE'}
              className="w-full py-2.5 bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/30 text-accent-red text-sm font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {deleting
                ? <><span className="w-4 h-4 border-2 border-accent-red/30 border-t-accent-red rounded-full animate-spin" /> Deleting...</>
                : <><Trash2 size={13} /> Permanently Delete Account</>
              }
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
