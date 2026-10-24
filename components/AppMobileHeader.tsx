'use client'

import Link from 'next/link'
import { useSidebar } from './SidebarContext'
import { useTranslation } from '@/lib/i18n'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'

export default function AppMobileHeader() {
  const { toggle } = useSidebar()
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 md:hidden">
      {/* Botón de apertura de barra lateral con indicación visual */}
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
        aria-label="Abrir menú de navegación"
      >
        <span className="text-base">☰</span>
        <span className="text-[11px] font-extrabold uppercase">{t.nav.menu}</span>
      </button>

      {/* Brand logo in header */}
      <Link href="/" className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-zinc-200 dark:border-zinc-700 text-sm shadow-2xs">
          🛠️
        </span>
        <span className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-zinc-50">
          Indie Clasificados
        </span>
      </Link>

      {/* Right controls: Theme & Language */}
      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
    </header>
  )
}
