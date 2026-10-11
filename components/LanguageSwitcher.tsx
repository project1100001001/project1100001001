'use client'

import { useLanguage } from '@/lib/i18n'

interface LanguageSwitcherProps {
  className?: string
  compact?: boolean
}

export default function LanguageSwitcher({
  className = '',
  compact = false,
}: LanguageSwitcherProps) {
  const { locale, setLocale, toggleLocale } = useLanguage()

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleLocale}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white/80 px-2.5 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 transition-colors ${className}`}
        title={`Cambiar idioma / Switch language (Actual: ${locale.toUpperCase()})`}
        aria-label="Cambiar idioma"
      >
        <span className="text-sm">🌐</span>
        <span className="uppercase">{locale}</span>
      </button>
    )
  }

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-100/80 p-0.5 text-xs font-bold dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
      role="group"
      aria-label="Selector de idioma"
    >
      <button
        type="button"
        onClick={() => setLocale('es')}
        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
          locale === 'es'
            ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-zinc-100'
            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
      >
        <span>🇪🇸</span>
        <span>ES</span>
      </button>

      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
          locale === 'en'
            ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-zinc-100'
            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
      >
        <span>🇺🇸</span>
        <span>EN</span>
      </button>
    </div>
  )
}
