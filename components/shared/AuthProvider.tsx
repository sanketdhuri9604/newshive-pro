'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  username: string
  email: string
  avatar_url: string | null
  bio: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

export function useAuth() { return useContext(AuthContext) }

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false) // ← true rakho — check hone tak

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) setProfile(data)
    } catch {}
  }

  // ── YAHAN SE ──
useEffect(() => {
  // ── Timeout safety — 3 seconds max ──
  const timeout = setTimeout(() => setLoading(false), 3000)

  supabase.auth.getSession().then(({ data: { session } }) => {
    clearTimeout(timeout)
    setUser(session?.user ?? null)
    if (session?.user) fetchProfile(session.user.id)
    setLoading(false)
  })

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null)
    if (session?.user) fetchProfile(session.user.id)
    else setProfile(null)
    setLoading(false)
  })

  return () => {
    clearTimeout(timeout)
    subscription.unsubscribe()
  }
}, [])
// ── YAHAN TAK ──

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}