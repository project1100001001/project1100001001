'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-zinc-200 bg-white py-8 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand and tagline */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white text-xs">
              M
            </span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              Marketplace Pymes
            </span>
          </div>
          <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
          <p className="text-zinc-500 dark:text-zinc-400">
            {t.footer.tagline}
          </p>
        </div>

        {/* Links and Switchers */}
        <div className="flex flex-wrap items-center justify-center gap-5">
          <Link
            href="/catalogo"
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            {t.footer.catalog}
          </Link>
          <Link
            href="/publicar"
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            {t.footer.publish}
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <LanguageSwitcher compact />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  )
}
