'use client'

import { useAuth } from './AuthProvider'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Zap } from 'lucide-react'

const PUBLIC_ROUTES = ['/login', '/register', '/onboarding']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth() // ← loading use karo, undefined nahi
  const pathname = usePathname()
  const router = useRouter()

  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  useEffect(() => {
    if (!loading && user && (pathname === '/login' || pathname === '/register')) {
      router.replace('/')
    }
  }, [user, loading, pathname])

  // Public routes pe guard nahi
  if (isPublic) return <>{children}</>

 

  // ── Not logged in — login wall ──
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ position: 'relative', zIndex: 1 }}>
        <div className="w-full max-w-sm animate-fade-in">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center shadow-glow-purple mx-auto mb-4 animate-float">
              <Zap size={32} className="text-white" />
            </div>
            <h1 className="font-display text-4xl tracking-wider mb-1">
              NEWS<span className="text-accent-purple">HIVE</span>
            </h1>
            <span className="text-[10px] font-mono text-accent-cyan border border-accent-cyan/30 px-2 py-0.5 rounded-full">
              PRO
            </span>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-white/10 p-6 space-y-4"
            style={{ background: 'rgba(13,13,32,0.85)', backdropFilter: 'blur(24px)' }}>

            <div className="text-center space-y-1.5 mb-2">
              <h2 className="text-lg font-bold text-text-primary">Welcome to NewsHive Pro</h2>
              <p className="text-text-muted text-sm">
                Sign in to access AI-powered news, analysis, and more
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-2 py-2">
              {[
                { icon: '🤖', label: 'AI Chatbot',     color: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.25)'   },
                { icon: '📍', label: 'News Map',        color: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)'  },
                { icon: '⚔️', label: 'Debate Mode',     color: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)'   },
                { icon: '📅', label: 'News Timeline',   color: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.25)'  },
              ].map((f, i) => (
                <div key={i} style={{
                  background: f.color,
                  border: `1px solid ${f.border}`,
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '16px' }}>{f.icon}</span>
                  <span style={{ fontSize: '12px', color: '#a0a0c0' }}>{f.label}</span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="space-y-2 pt-1">
              <a href="/login"
  className="w-full py-3 rounded-xl font-semibold text-sm text-white text-center block transition-all"
  style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
  Sign In
</a>
<a href="/register"
  className="w-full py-3 rounded-xl font-semibold text-sm text-text-primary border border-white/10 text-center block transition-all">
  Create Free Account
</a>
            </div>

          </div>

          <p className="text-center text-text-muted text-xs mt-4 font-mono tracking-widest uppercase">
            AI-Powered · Real News · No Noise
          </p>
        </div>
      </div>
    )
  }

  // ── Logged in — normal app ──
  return <>{children}</>
}