'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'

interface MobileBottomNavProps {
  onOpenMobileMenu?: () => void
  userRole?: string | null
  hasUser?: boolean
}

export default function MobileBottomNav({
  onOpenMobileMenu,
  userRole,
  hasUser = false,
}: MobileBottomNavProps) {
  const pathname = usePathname()
  const { t } = useTranslation()

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 safe-area-bottom shadow-lg"
      aria-label="Navegación móvil inferior"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {/* 1. Inicio */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isActive('/') && pathname === '/'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          <span className="text-lg">🏠</span>
          <span className="text-[10px] mt-0.5 tracking-tight">{t.bottomNav.home}</span>
        </Link>

        {/* 2. Catálogo */}
        <Link
          href="/catalogo"
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isActive('/catalogo')
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          <span className="text-lg">🔍</span>
          <span className="text-[10px] mt-0.5 tracking-tight">{t.bottomNav.catalog}</span>
        </Link>

        {/* 3. Publicar (Featured Center Button) */}
        <Link
          href="/publicar"
          className="flex flex-col items-center justify-center -mt-4 py-1 group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-600/30 group-active:scale-95 transition-transform">
            <span className="text-xl">➕</span>
          </div>
          <span className="text-[10px] mt-1 font-bold text-emerald-700 dark:text-emerald-400">
            {t.bottomNav.publish}
          </span>
        </Link>

        {/* 4. Campañas / Anuncios */}
        <Link
          href={hasUser ? '/mis-campanas' : '/promocionar'}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isActive('/mis-campanas') || isActive('/promocionar')
              ? 'text-purple-600 dark:text-purple-400 font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          <span className="text-lg">📢</span>
          <span className="text-[10px] mt-0.5 tracking-tight">{t.bottomNav.campaigns}</span>
        </Link>

        {/* 5. Menú / Cuenta */}
        {onOpenMobileMenu ? (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              userRole === 'admin' && pathname.startsWith('/admin')
                ? 'text-purple-600 dark:text-purple-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <span className="text-lg">☰</span>
            <span className="text-[10px] mt-0.5 tracking-tight">{t.bottomNav.menu}</span>
          </button>
        ) : (
          <Link
            href={hasUser ? '/mis-publicaciones' : '/login'}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              isActive('/mis-publicaciones') || isActive('/login')
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <span className="text-lg">{hasUser ? '👤' : '🔑'}</span>
            <span className="text-[10px] mt-0.5 tracking-tight">{t.bottomNav.menu}</span>
          </Link>
        )}
      </div>
    </nav>
  )
}
