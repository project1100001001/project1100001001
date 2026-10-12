'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useTranslation } from '@/lib/i18n'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'
import { useSidebar } from './SidebarContext'
import { hasPermission } from '@/lib/permissions'

interface CategoryItem {
  slug: string
  name: string
  icon: string
}

const CATEGORIES: CategoryItem[] = [
  { slug: 'alimentos', name: 'Alimentos artesanales', icon: '🍲' },
  { slug: 'servicios-hogar', name: 'Servicios para el hogar', icon: '🔧' },
  { slug: 'belleza', name: 'Belleza y Estilo', icon: '💇' },
  { slug: 'ropa-accesorios', name: 'Ropa y Accesorios', icon: '👗' },
  { slug: 'clases-educacion', name: 'Clases y Educación', icon: '📚' },
  { slug: 'otros', name: 'Otros artículos', icon: '✨' },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const { t, locale } = useTranslation()
  const { isOpen, close, isCollapsed, toggleCollapsed } = useSidebar()

  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  // Accordion open/close state for suboptions
  const [catalogOpen, setCatalogOpen] = useState(true)
  const [listingsOpen, setListingsOpen] = useState(true)
  const [campaignsOpen, setCampaignsOpen] = useState(true)
  const [adminOpen, setAdminOpen] = useState(true)
  const [currentTab, setCurrentTab] = useState<string>('')
  const [currentSection, setCurrentSection] = useState<string>('')

  useEffect(() => {
    const updateFromUrl = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        setCurrentTab(params.get('tab') || params.get('filter') || '')
        setCurrentSection(params.get('section') || '')
      }
    }
    updateFromUrl()
    window.addEventListener('popstate', updateFromUrl)
    return () => window.removeEventListener('popstate', updateFromUrl)
  }, [pathname])

  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('app_user')
          .select('role')
          .eq('id', user.id)
          .single()
        setRole(profile?.role || null)

        if (profile?.role === 'admin') {
          const { count: listingCount } = await supabase
            .from('listing')
            .select('*', { count: 'exact', head: true })
            .in('status', ['submitted', 'pending_review'])

          let adCount = 0
          try {
            const { count, error } = await supabase
              .from('ad_order')
              .select('*', { count: 'exact', head: true })
              .in('status', ['submitted', 'in_review'])
            if (!error && typeof count === 'number') {
              adCount = count
            }
          } catch {
            // continue
          }

          setPendingCount((listingCount || 0) + adCount)
        }
      } else {
        setRole(null)
        setPendingCount(0)
      }

      setLoading(false)
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUser()
      } else {
        setRole(null)
        setPendingCount(0)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto p-4 select-none">
      {/* 1. Header / Brand & Collapse Control */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-2.5 group"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-sm transition-transform group-hover:scale-105">
              M
            </span>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Marketplace
              </span>
              <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">
                {locale === 'en' ? 'Local Businesses' : 'Pymes y Emprendedores'}
              </span>
            </div>
          </Link>

          {/* Desktop Collapse Button */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden md:flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-bold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            title={t.nav.collapseSidebar}
            aria-label={t.nav.collapseSidebar}
          >
            <span>◀</span>
            <span className="text-[10px]">{t.nav.collapseSidebar}</span>
          </button>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={close}
            className="flex md:hidden items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            aria-label="Cerrar menú"
          >
            <span>✕</span>
            <span>{t.common.close}</span>
          </button>
        </div>

        {/* 2. Hierarchical Navigation (Options & Suboptions) */}
        <nav className="space-y-1.5 text-xs font-semibold">
          {/* OPCIÓN 1: Inicio */}
          <Link
            href="/"
            onClick={close}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
              pathname === '/'
                ? 'bg-emerald-50 text-emerald-700 font-bold dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            <span className="text-base">🏠</span>
            <span>{t.nav.home}</span>
          </Link>

          {/* OPCIÓN 2: Catálogo & Categorías (Desplegable) */}
          <div className="pt-2">
            <div className="flex items-center justify-between rounded-xl px-3 py-2 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
              <div className="flex items-center gap-2">
                <span>🔍</span>
                <span>{t.nav.catalog}</span>
              </div>
              <button
                type="button"
                onClick={() => setCatalogOpen(!catalogOpen)}
                className="p-1 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                {catalogOpen ? '▼' : '▶'}
              </button>
            </div>

            {catalogOpen && (
              <div className="mt-1 ml-3 space-y-0.5 border-l-2 border-zinc-200 pl-2 dark:border-zinc-800">
                <Link
                  href="/catalogo"
                  onClick={close}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors ${
                    pathname === '/catalogo'
                      ? 'bg-emerald-50 text-emerald-700 font-bold dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>✨</span>
                  <span>{t.nav.allListings}</span>
                </Link>

                <div className="pt-1.5 pb-0.5 px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {locale === 'en' ? 'By Type' : 'Por Tipo'}
                </div>
                <Link
                  href="/catalogo?type=product"
                  onClick={close}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors text-xs font-medium"
                >
                  <span>🛍️</span>
                  <span>{locale === 'en' ? 'Products (New)' : 'Productos (Nuevos)'}</span>
                </Link>
                <Link
                  href="/catalogo?type=article"
                  onClick={close}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors text-xs font-medium"
                >
                  <span>📦</span>
                  <span>{locale === 'en' ? 'Articles (Used)' : 'Artículos (Usados)'}</span>
                </Link>
                <Link
                  href="/catalogo?type=service"
                  onClick={close}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors text-xs font-medium"
                >
                  <span>🛠️</span>
                  <span>{locale === 'en' ? 'Services' : 'Servicios'}</span>
                </Link>

                <div className="pt-1.5 pb-0.5 px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {locale === 'en' ? 'Categories' : 'Categorías'}
                </div>

                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/catalogo?category=${cat.slug}`}
                    onClick={close}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* OPCIÓN: Directorio de Vendedores (Compradores y Exploración) */}
          <Link
            href="/directorio"
            onClick={close}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              pathname === '/directorio'
                ? 'bg-purple-50 text-purple-700 font-bold dark:bg-purple-950/40 dark:text-purple-300'
                : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            <span>📇</span>
            <span>{t.nav.directory}</span>
          </Link>

          {/* OPCIÓN 3: Mis Publicaciones (Solo para Vendedores y Administradores) */}
          {hasPermission(role, 'publish_listings') && (
            <div className="pt-2">
              <div className="flex items-center justify-between rounded-xl px-3 py-2 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <span>{t.nav.myListings}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setListingsOpen(!listingsOpen)}
                  className="p-1 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  {listingsOpen ? '▼' : '▶'}
                </button>
              </div>

              {listingsOpen && (
                <div className="mt-1 ml-3 space-y-0.5 border-l-2 border-zinc-200 pl-2 dark:border-zinc-800">
                  <Link
                    href="/mis-publicaciones"
                    onClick={close}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors ${
                      pathname === '/mis-publicaciones' || pathname === '/inventario'
                        ? 'bg-emerald-50 text-emerald-700 font-bold dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>📦</span>
                    <span className="font-semibold">{locale === 'en' ? 'Listings & Inventory' : 'Publicaciones & Inventario'}</span>
                  </Link>

                  <div className="pt-1.5 pb-0.5 px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {locale === 'en' ? 'Create Listing' : 'Crear Anuncio'}
                  </div>

                  <Link
                    href="/publicar?type=product"
                    onClick={close}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold"
                  >
                    <span>🛍️</span>
                    <span>{locale === 'en' ? 'Post Product (New)' : 'Publicar Producto (Nuevo)'}</span>
                  </Link>

                  <Link
                    href="/publicar?type=article"
                    onClick={close}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold"
                  >
                    <span>📦</span>
                    <span>{locale === 'en' ? 'Post Article (Used)' : 'Publicar Artículo (Usado)'}</span>
                  </Link>

                  <Link
                    href="/publicar?type=service"
                    onClick={close}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold"
                  >
                    <span>🛠️</span>
                    <span>{locale === 'en' ? 'Post Service' : 'Publicar Servicio'}</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* OPCIÓN 4: Mis Campañas (Solo para Vendedores y Administradores) */}
          {hasPermission(role, 'manage_campaigns') && (
            <div className="pt-2">
              <div className="flex items-center justify-between rounded-xl px-3 py-2 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                <div className="flex items-center gap-2">
                  <span>📢</span>
                  <span>{t.nav.myCampaigns}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCampaignsOpen(!campaignsOpen)}
                  className="p-1 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  {campaignsOpen ? '▼' : '▶'}
                </button>
              </div>

              {campaignsOpen && (
                <div className="mt-1 ml-3 space-y-0.5 border-l-2 border-zinc-200 pl-2 dark:border-zinc-800">
                  <Link
                    href="/mis-campanas"
                    onClick={close}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors ${
                      pathname === '/mis-campanas'
                        ? 'bg-purple-50 text-purple-700 font-bold dark:bg-purple-950/40 dark:text-purple-300'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>📊</span>
                    <span>{locale === 'en' ? 'Campaign History' : 'Historial de Campañas'}</span>
                  </Link>

                  <Link
                    href="/promocionar?tab=recharge"
                    onClick={() => {
                      setCurrentTab('recharge')
                      close()
                    }}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors ${
                      pathname === '/promocionar' && currentTab !== 'campaign'
                        ? 'bg-purple-50 text-purple-700 font-bold dark:bg-purple-950/40 dark:text-purple-300'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>💳</span>
                    <span>{t.nav.recharge}</span>
                  </Link>

                  <Link
                    href="/promocionar?tab=campaign"
                    onClick={() => {
                      setCurrentTab('campaign')
                      close()
                    }}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors ${
                      pathname === '/promocionar' && currentTab === 'campaign'
                        ? 'bg-purple-50 text-purple-700 font-bold dark:bg-purple-950/40 dark:text-purple-300'
                        : 'text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>🚀</span>
                    <span className="font-bold">{t.nav.createCampaign}</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* OPCIÓN 5: Administración y Moderación (Exclusivo para Administrador) */}
          {hasPermission(role, 'moderate_content') && (
            <div className="pt-2">
              <div className="flex items-center justify-between rounded-xl px-3 py-2 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                <div className="flex items-center gap-2">
                  <span>🛡️</span>
                  <span>{t.nav.moderation}</span>
                  {pendingCount > 0 && (
                    <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[9px] font-black text-white">
                      {pendingCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setAdminOpen(!adminOpen)}
                  className="p-1 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  {adminOpen ? '▼' : '▶'}
                </button>
              </div>

              {adminOpen && (
                <div className="mt-1 ml-3 space-y-0.5 border-l-2 border-zinc-200 pl-2 dark:border-zinc-800">
                  <Link
                    href="/admin?section=listings"
                    onClick={() => {
                      setCurrentSection('listings')
                      close()
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('admin-section-change', { detail: 'listings' }))
                      }
                    }}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors ${
                      pathname === '/admin' && (currentSection === '' || currentSection === 'listings')
                        ? 'bg-purple-50 text-purple-700 font-bold dark:bg-purple-950/40 dark:text-purple-300'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>📦</span>
                    <span>{t.nav.adminListings}</span>
                  </Link>

                  <Link
                    href="/admin?section=ads"
                    onClick={() => {
                      setCurrentSection('ads')
                      close()
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('admin-section-change', { detail: 'ads' }))
                      }
                    }}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors ${
                      pathname === '/admin' && currentSection === 'ads'
                        ? 'bg-purple-50 text-purple-700 font-bold dark:bg-purple-950/40 dark:text-purple-300'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>📢</span>
                    <span>{t.nav.adminAds}</span>
                  </Link>

                  <Link
                    href="/admin?section=balances"
                    onClick={() => {
                      setCurrentSection('balances')
                      close()
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('admin-section-change', { detail: 'balances' }))
                      }
                    }}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors ${
                      pathname === '/admin' && currentSection === 'balances'
                        ? 'bg-purple-50 text-purple-700 font-bold dark:bg-purple-950/40 dark:text-purple-300'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>💳</span>
                    <span>{t.nav.adminBalances}</span>
                  </Link>

                  <Link
                    href="/admin?section=users"
                    onClick={() => {
                      setCurrentSection('users')
                      close()
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('admin-section-change', { detail: 'users' }))
                      }
                    }}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors ${
                      pathname === '/admin' && currentSection === 'users'
                        ? 'bg-purple-50 text-purple-700 font-bold dark:bg-purple-950/40 dark:text-purple-300'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>👥</span>
                    <span>{t.nav.adminUsers}</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Opción informativa para Compradores */}
          {role === 'buyer' && (
            <div className="pt-3">
              <Link
                href="/cuenta"
                onClick={close}
                className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 text-blue-900 hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300 transition-colors"
              >
                <span className="text-base">🏪</span>
                <div className="min-w-0 flex-1">
                  <span className="block font-bold text-[11px]">
                    {locale === 'en' ? 'Want to Sell?' : '¿Quieres Vender?'}
                  </span>
                  <span className="block text-[10px] text-blue-700 dark:text-blue-400">
                    {locale === 'en' ? 'Activate seller profile' : 'Registra tu negocio en tu perfil'}
                  </span>
                </div>
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* 3. Footer del Sidebar: Preferencias, Usuario y Sesión */}
      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        {/* Switchers (Idioma y Tema) */}
        <div className="flex items-center justify-between gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        {/* User Card */}
        {user ? (
          <div className="rounded-xl bg-zinc-50 p-2.5 border border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700 text-xs font-bold">
                👤
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {user.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  {role ? role.toUpperCase() : 'USUARIO'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <Link
                href="/cuenta"
                onClick={close}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                  pathname === '/cuenta'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-zinc-200/80 text-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                <span>⚙️</span>
                <span>{t.nav.myAccount}</span>
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg bg-zinc-200/80 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 hover:bg-red-50 hover:text-red-700 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-red-950/50 dark:hover:text-red-300 transition-colors"
                title={t.nav.signOut}
              >
                🚪
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={close}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
          >
            <span>🔐</span>
            <span>{t.nav.signIn}</span>
          </Link>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Botón flotante de alta visibilidad para MOSTRAR / DESPLEGAR el menú cuando está abatido */}
      {isCollapsed && (
        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden md:flex items-center gap-2 rounded-r-xl border-y border-r border-emerald-500 bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-xl shadow-emerald-950/30 hover:bg-emerald-500 hover:pl-3.5 transition-all fixed left-0 top-2 z-40 select-none animate-in slide-in-from-left duration-200"
          title={t.nav.expandSidebar}
          aria-label={t.nav.expandSidebar}
        >
          <span className="text-xs">▶</span>
          <span className="tracking-wide uppercase text-[10px] font-black">{t.nav.expandSidebar}</span>
        </button>
      )}

      {/* Desktop Left Sidebar: se repliega o expande suavemente */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sticky top-0 h-screen z-40 transition-all duration-300 ease-in-out ${
          isCollapsed
            ? 'w-0 border-r-0 opacity-0 pointer-events-none overflow-hidden'
            : 'w-64 lg:w-72 opacity-100'
        }`}
      >
        {!isCollapsed && sidebarContent}
      </aside>

      {/* Mobile Backdrop & Off-canvas Slide-out Left Sidebar */}
      {isOpen && (
        <div
          onClick={close}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
