'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/components/shared/LangProvider'
import { Eye, EyeOff, Zap, Mail, Lock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLang()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!email) e.email = 'Email required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email address'
    if (!password) e.password = 'Password required'
    else if (password.length < 6) e.password = 'Minimum 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Invalid login')) {
          setErrors({ email: 'Incorrect email or password' })
        } else {
          toast.error('Something went wrong. Please try again.')
        }
        return
      }
      toast.success('Welcome back! 👋')
      router.push('/')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-[radial-gradient(at_30%_20%,rgba(124,111,255,0.15)_0,transparent_50%),radial-gradient(at_70%_80%,rgba(255,111,216,0.08)_0,transparent_50%)] pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center shadow-glow-purple">
              <Zap size={20} className="text-white" />
            </div>
            <span className="font-display text-3xl tracking-wider">
              NEWS<span className="text-accent-purple">HIVE</span>
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">{t('auth.welcomeBack')} 👋</h1>
          <p className="text-text-muted text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl border border-white/10 p-8 shadow-glow-purple">

          {/* Email */}
          <div className="mb-4">
            <label className="text-sm text-text-secondary mb-1.5 block">{t('auth.email')}</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="you@example.com"
                className={`input-field pl-10 ${errors.email ? 'border-accent-red/50 focus:border-accent-red' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="flex items-center gap-1.5 text-accent-red text-xs mt-1.5">
                <AlertCircle size={12} /> {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="text-sm text-text-secondary mb-1.5 block">{t('auth.password')}</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className={`input-field pl-10 pr-10 ${errors.password ? 'border-accent-red/50 focus:border-accent-red' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="flex items-center gap-1.5 text-accent-red text-xs mt-1.5">
                <AlertCircle size={12} /> {errors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 bg-accent-purple hover:bg-accent-purple/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all hover:shadow-glow-purple flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('auth.signingIn')}
              </>
            ) : (
              t('auth.signIn')
            )}
          </button>

          <p className="text-center text-text-muted text-sm mt-5">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="text-accent-purple hover:text-accent-purple/80 font-medium transition-colors">
              {t('auth.signUpFree')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}