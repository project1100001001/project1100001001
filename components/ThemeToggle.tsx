'use client'

import { useTheme } from './ThemeProvider'
import { useTranslation } from '@/lib/i18n'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export default function ThemeToggle({
  className = '',
  showLabel = false,
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme, theme, setTheme } = useTheme()
  const { t } = useTranslation()

  const isDark = resolvedTheme === 'dark'

  if (showLabel) {
    return (
      <div
        className={`flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/60 ${className}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{isDark ? '🌙' : '☀️'}</span>
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            {isDark ? t.theme.dark : t.theme.light}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-300 transition-colors focus:outline-none dark:bg-emerald-600"
          role="switch"
          aria-checked={isDark}
          aria-label={t.theme.toggle}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isDark ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white/80 text-zinc-700 shadow-2xs hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 transition-colors ${className}`}
      title={isDark ? t.theme.light : t.theme.dark}
      aria-label={t.theme.toggle}
    >
      {isDark ? (
        <span className="text-base" role="img" aria-label="Sol">
          ☀️
        </span>
      ) : (
        <span className="text-base" role="img" aria-label="Luna">
          🌙
        </span>
      )}
    </button>
  )
}
