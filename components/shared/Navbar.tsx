'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { useLang } from './LangProvider'
import LanguageSelector from './LanguageSelector'
import {
  Zap, Home, Flame, GitCompare, Bot, Bookmark,
  User, LogOut, Menu, X, ChevronDown, Search, Sparkles, Clock,
  Trophy, Users, BarChart2, StickyNote, Swords, Calendar, Target, Medal, MessageSquare,
  Download, MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const { t } = useLang()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      toast.success('NewsHive installed! 🎉')
    })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallPrompt(null)
  }

  // ── All t() — koi hardcoded string nahi ──
  const NAV_LINKS = [
    { href: '/',          label: t('nav.feed'),        icon: Home       },
    { href: '/foryou',    label: t('nav.forYou'),      icon: Sparkles   },
    { href: '/trending',  label: t('nav.trending'),    icon: Flame      },
    { href: '/compare',   label: t('nav.compare'),     icon: GitCompare },
    { href: '/chatbot',   label: t('nav.aiChat'),      icon: Bot        },
    { href: '/community', label: t('nav.community'),   icon: Users      },
    { href: '/challenge', label: t('nav.challenge'),   icon: Target     },
    { href: '/debate',    label: t('nav.debate'),      icon: Swords     },
    { href: '/timeline',  label: t('nav.timeline'),    icon: Calendar   },
    { href: '/map',       label: t('nav.map'),         icon: MapPin     },
    { href: '/saved',     label: t('nav.saved'),       icon: Bookmark   },
  ]

  const MOBILE_MENU_LINKS = [
    { href: '/compare',   label: t('nav.compare'),     icon: GitCompare },
    { href: '/chatbot',   label: t('nav.aiChat'),      icon: Bot        },
    { href: '/community', label: t('nav.community'),   icon: Users      },
    { href: '/challenge', label: t('nav.challenge'),   icon: Target     },
    { href: '/debate',    label: t('nav.debate'),      icon: Swords     },
    { href: '/timeline',  label: t('nav.timeline'),    icon: Calendar   },
  ]

  const handleSignOut = async () => {
    await signOut()
    toast.success(t('nav.signedOut'))
    router.push('/')
    setProfileOpen(false)
  }

  const renderAuthSection = () => {
    if (user) {
      return (
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {profile?.username?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <span className="text-sm text-text-primary hidden sm:block max-w-[80px] truncate">
              {profile?.username || 'User'}
            </span>
            <ChevronDown size={12} className="text-text-muted" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-bg-card border border-white/10 rounded-2xl shadow-xl z-20 overflow-hidden">
                <div className="p-3 border-b border-white/5">
                  <p className="text-text-primary text-sm font-semibold">@{profile?.username}</p>
                  <p className="text-text-muted text-xs truncate">{user.email}</p>
                </div>
                <div className="p-2">
                  <Link href="/profile" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-all w-full">
                    <User size={14} /> {t('nav.profile')}
                  </Link>
                  <Link href="/history" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-all w-full">
                    <Clock size={14} /> {t('nav.readingHistory')}
                  </Link>
                  <Link href="/badges" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-all w-full">
                    <Medal size={14} /> {t('nav.myBadges')}
                  </Link>
                  <Link href="/notes" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-all w-full">
                    <StickyNote size={14} /> {t('nav.myNotes')}
                  </Link>
                  <Link href="/my-comments" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-all w-full">
                    <MessageSquare size={14} /> {t('nav.myComments')}
                  </Link>
                  <Link href="/analytics" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-all w-full">
                    <BarChart2 size={14} /> {t('nav.myAnalytics')}
                  </Link>
                  <Link href="/leaderboard" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-all w-full">
                    <Trophy size={14} /> {t('nav.leaderboard')}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-accent-red hover:bg-accent-red/10 transition-all w-full mt-1"
                  >
                    <LogOut size={14} /> {t('nav.logout')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <Link href="/login"
          className="px-3 py-2 text-sm text-text-muted hover:text-text-primary transition-colors hidden sm:block">
          {t('nav.login')}
        </Link>
        <Link href="/register"
          className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/90 text-white text-sm font-medium rounded-xl transition-all hover:shadow-glow-purple">
          {t('nav.signUp')}
        </Link>
      </div>
    )
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-white/5">
        <div className="h-16 flex items-center justify-between gap-4 px-4">

          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center shadow-glow-purple">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-display text-2xl tracking-wider hidden sm:block">
              NEWS<span className="text-accent-purple">HIVE</span>
            </span>
            <span className="text-[9px] font-mono text-accent-cyan border border-accent-cyan/30 px-1.5 py-0.5 rounded-full hidden sm:block">
              PRO
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className={cn(
                'p-2 rounded-xl border border-white/10 hover:border-white/20 transition-all',
                pathname === '/search' ? 'text-accent-purple border-accent-purple/30' : 'text-text-muted'
              )}
            >
              <Search size={15} />
            </Link>

            {installPrompt && !isInstalled && (
              <button
                onClick={handleInstall}
                title={t('nav.installApp')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-accent-purple/30 text-accent-purple hover:bg-accent-purple/10 transition-all text-xs font-medium"
              >
                <Download size={14} />
                <span className="hidden sm:block">{t('nav.install')}</span>
              </button>
            )}

            <LanguageSelector />
            {renderAuthSection()}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl border border-white/10 text-text-muted"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 bg-bg-primary/95 backdrop-blur-xl">
            <div className="px-4 py-3">
              <p className="text-[10px] font-black tracking-widest uppercase text-text-muted px-3 mb-2">
                {t('nav.moreFeatures')}
              </p>
              <div className="space-y-1">
                {MOBILE_MENU_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                      pathname === href
                        ? 'bg-accent-purple/15 text-accent-purple'
                        : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                ))}
              </div>

              {installPrompt && !isInstalled && (
                <button
                  onClick={() => { handleInstall(); setMobileOpen(false) }}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium text-accent-purple hover:bg-accent-purple/10 transition-all w-full mt-1"
                >
                  <Download size={16} />
                  {t('nav.installApp')}
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className={cn(
          'hidden md:flex fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 flex-col py-3 border-r border-white/5 bg-bg-primary/80 backdrop-blur-xl transition-all duration-200',
          sidebarExpanded ? 'w-52' : 'w-14'
        )}
      >
        <div className="flex flex-col gap-1 px-2 flex-1 overflow-hidden">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all overflow-hidden',
                pathname === href
                  ? 'bg-accent-purple/15 text-accent-purple'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className={cn(
                'text-sm font-medium whitespace-nowrap transition-all duration-200',
                sidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
              )}>
                {label}
              </span>
            </Link>
          ))}
        </div>

        <div className="mx-2 h-px bg-white/5 mb-2" />

        <div className="px-2">
          <Link
            href="/search"
            className={cn(
              'flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all overflow-hidden',
              pathname === '/search'
                ? 'bg-accent-purple/15 text-accent-purple'
                : 'text-text-muted hover:text-text-primary hover:bg-white/5'
            )}
          >
            <Search size={18} className="flex-shrink-0" />
            <span className={cn(
              'text-sm font-medium whitespace-nowrap transition-all duration-200',
              sidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
            )}>
              {t('nav.search')}
            </span>
          </Link>
        </div>
      </aside>
    </>
  )
}
