'use client'

import Link from 'next/link'
import { useSidebar } from './SidebarContext'
import { useTranslation } from '@/lib/i18n'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'

export default function AppMobileHeader() {
  const { isOpen, toggle, close } = useSidebar()
  const { t } = useTranslation()

  return (
    <header className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-t border-zinc-200 bg-white/95 px-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.12)] md:hidden">
      {/* Costado izquierdo: Logo y Nombre institucional completo (Clasificados debajo de Indie para máxima legibilidad) */}
      <Link href="/" onClick={close} className="flex items-center gap-2 z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/logo.png"
          alt="Indie Clasificados"
          className="h-7 w-7 shrink-0 object-contain"
        />
        <span className="flex flex-col font-extrabold text-xs tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
          <span className="block">Indie</span>
          <span className="block">Clasificados</span>
        </span>
      </Link>

      {/* Centro de la barra: Botón de menú en forma hamburguesa y sin el texto "Menú principal" */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <button
          type="button"
          onClick={toggle}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all shadow-2xs cursor-pointer ${
            isOpen
              ? 'border-amber-400 bg-amber-400 text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.45)]'
              : 'border-zinc-300 bg-zinc-50 text-zinc-800 hover:border-amber-400/60 hover:bg-amber-50/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-amber-500/50 dark:hover:bg-zinc-700'
          }`}
          aria-label={t.nav.menu}
          title={t.nav.menu}
        >
          <span className="text-lg leading-none">☰</span>
        </button>
      </div>

      {/* Costado derecho: Traductor y Modo Claro/Oscuro */}
      <div className="flex items-center gap-1.5 z-10">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  )
}
