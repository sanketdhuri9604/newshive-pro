'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sparkles, Flame, MapPin, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/',         icon: Home,     label: 'Feed'     },
  { href: '/foryou',   icon: Sparkles, label: 'For You'  },
  { href: '/trending', icon: Flame,    label: 'Trending' },
  { href: '/map',      icon: MapPin,   label: 'Map'      },
  { href: '/saved',    icon: Bookmark, label: 'Saved'    },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/8"
      style={{
        background: 'rgba(4,4,15,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      <div className="flex items-center justify-around px-2 py-2">
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200',
                active ? 'text-accent-purple' : 'text-text-muted'
              )}>
              <div className={cn(
                'p-1.5 rounded-xl transition-all duration-200',
                active
                  ? 'bg-accent-purple/15 shadow-glow-purple'
                  : 'hover:bg-white/5'
              )}>
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className={cn(
                'text-[10px] font-semibold tracking-wide transition-all',
                active ? 'text-accent-purple' : 'text-text-muted'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}   