'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { LANGUAGES, type LangCode, t as translate } from '@/lib/i18n'

interface LangContextType {
  lang: LangCode
  setLang: (lang: LangCode) => void
  t: (key: string) => string
  isRTL: boolean
  langName: string
  nativeName: string
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
  isRTL: false,
  langName: 'English',
  nativeName: 'English',
})

export function useLang() { return useContext(LangContext) }

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('newshive-lang') as LangCode | null
    if (saved && LANGUAGES[saved]) setLangState(saved)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.dir = LANGUAGES[lang].dir === 'rtl' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang, mounted])

  const setLang = useCallback((newLang: LangCode) => {
    setLangState(newLang)
    localStorage.setItem('newshive-lang', newLang)
  }, [])

  const t = useCallback((key: string) => translate(key, lang), [lang])

  return (
    <LangContext.Provider value={{
      lang,
      setLang,
      t,
      isRTL: LANGUAGES[lang]?.dir === 'rtl',
      langName: LANGUAGES[lang]?.name || 'English',
      nativeName: LANGUAGES[lang]?.nativeName || 'English',
    }}>
      {children}
    </LangContext.Provider>
  )
}