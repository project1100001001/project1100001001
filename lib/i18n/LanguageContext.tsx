'use client'

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { Locale, Dictionary } from './types'
import { es } from './dictionaries/es'
import { en } from './dictionaries/en'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  t: Dictionary
}

const dictionaries: Record<Locale, Dictionary> = { es, en }

const LanguageContext = createContext<LanguageContextType>({
  locale: 'es',
  setLocale: () => {},
  toggleLocale: () => {},
  t: es,
})

const STORAGE_KEY = 'marketplace_locale'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
      if (saved && (saved === 'es' || saved === 'en')) {
        setLocaleState(saved)
        document.documentElement.lang = saved
      } else {
        // Check browser preference if no saved locale
        const browserLang = navigator.language.slice(0, 2)
        if (browserLang === 'en') {
          setLocaleState('en')
          document.documentElement.lang = 'en'
        }
      }
    } catch {
      // Ignore storage errors
    } finally {
      setMounted(true)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem(STORAGE_KEY, newLocale)
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
      document.documentElement.lang = newLocale
    } catch {
      // Ignore storage errors
    }
  }

  const toggleLocale = () => {
    setLocale(locale === 'es' ? 'en' : 'es')
  }

  const t = useMemo(() => dictionaries[locale] || es, [locale])

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export function useTranslation() {
  const { t, locale } = useLanguage()
  return { t, locale }
}
