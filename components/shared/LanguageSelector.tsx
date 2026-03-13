'use client'

import { useState, useRef, useEffect } from 'react'
import { useLang } from './LangProvider'
import { LANGUAGES, type LangCode } from '@/lib/i18n'
import { ChevronDown, Check, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LanguageSelector() {
  const { lang, setLang, t, nativeName } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all border border-transparent hover:border-white/10 text-sm"
        aria-label={t('ui.chooseLanguage')}
      >
        <Globe size={14} className="text-accent-cyan" />
        <span className="hidden sm:inline font-medium">{LANGUAGES[lang].flag} {nativeName}</span>
        <span className="sm:hidden">{LANGUAGES[lang].flag}</span>
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 glass rounded-2xl border border-white/10 shadow-glow-purple z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/5">
            <p className="text-xs text-text-muted font-mono">{t('ui.chooseLanguage')}</p>
          </div>

          {/* English first */}
          <div className="p-1">
            <LangOption code="en" current={lang} onSelect={(c) => { setLang(c); setOpen(false) }} />
          </div>

          {/* Divider */}
          <div className="px-3 py-1 border-t border-white/5">
            <p className="text-[10px] text-text-muted font-mono tracking-wider">INDIAN LANGUAGES</p>
          </div>

          {/* Indian languages */}
          <div className="p-1 pb-2 grid grid-cols-1 max-h-64 overflow-y-auto">
            {(Object.keys(LANGUAGES) as LangCode[])
              .filter(c => c !== 'en')
              .map(code => (
                <LangOption key={code} code={code} current={lang} onSelect={(c) => { setLang(c); setOpen(false) }} />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LangOption({ code, current, onSelect }: {
  code: LangCode
  current: LangCode
  onSelect: (c: LangCode) => void
}) {
  const lang = LANGUAGES[code]
  const isSelected = code === current

  return (
    <button
      onClick={() => onSelect(code)}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all",
        isSelected
          ? "bg-accent-purple/20 text-accent-purple"
          : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{lang.flag}</span>
        <div className="text-left">
          <p className="text-[13px] font-medium leading-none">{lang.nativeName}</p>
          <p className="text-[11px] text-text-muted mt-0.5">{lang.name}</p>
        </div>
      </div>
      {isSelected && <Check size={13} className="text-accent-purple flex-shrink-0" />}
    </button>
  )
}
