'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useTranslation } from '@/lib/i18n'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'
import { useSidebar } from './SidebarContext'
import { hasPermission } from '@/lib/permissions'
import TestProfilesModal from './TestProfilesModal'
import { triggerGlobalNavigationLoader } from './AvantGardeLoader'

interface SidebarNavContentProps {
  pathname: string
  currentType: string
  currentTab: string
  currentSection: string
  close: () => void
  t: any
  locale: string
  role: string | null
  isLoggedIn: boolean
  pendingCount: number
  isMobile?: boolean
}

function SidebarNavContent({
  pathname,
  currentType,
  currentTab,
  currentSection,
  close,
  t,
  locale,
  role,
  isLoggedIn,
  pendingCount,
  isMobile = false,
}: SidebarNavContentProps) {
  // Accordion open/close state for suboptions
  const [catalogOpen, setCatalogOpen] = useState(true)
  const [requestsOpen, setRequestsOpen] = useState(true)
  const [listingsOpen, setListingsOpen] = useState(true)
  const [campaignsOpen, setCampaignsOpen] = useState(true)
  const [adminOpen, setAdminOpen] = useState(true)

  const [customSection, setCustomSection] = useState<string>('')
  useEffect(() => {
    const handleSec = (e: any) => {
      if (e.detail) setCustomSection(e.detail)
    }
    window.addEventListener('admin-section-change', handleSec)
    return () => window.removeEventListener('admin-section-change', handleSec)
  }, [])

  const effectiveSection = currentSection || customSection

  // Determine active states
  const isHomeActive = pathname === '/'
  const isDashboardActive = pathname === '/bienvenida'

  // Catalog
  const isCatalogServiceActive = pathname === '/catalogo' && currentType === 'service'
  const isCatalogArticleActive = pathname === '/catalogo' && currentType === 'article'
  const isCatalogProductActive = pathname === '/catalogo' && currentType === 'product'

  // Directory
  const isDirectoryActive = pathname === '/directorio'

  // Buyer Classified Requests (/solicitudes)
  const isRequestsBoardActive = pathname === '/solicitudes'
  const isRequestsBuyerWindowActive = pathname === '/solicitudes/comprador'
  const isRequestsSellerWindowActive = pathname === '/solicitudes/vendedor'

  // Listings / Inventory / Services
  const isInventoryActive = (pathname === '/mis-publicaciones' || pathname === '/inventario') && !currentType
  const isServicesActive = pathname === '/mis-servicios'
  const isPublishProductActive = pathname === '/publicar' && currentType !== 'service'
  const isPublishServiceActive = pathname === '/publicar' && currentType === 'service'

  // Campaigns
  const isCampaignHistoryActive = pathname === '/mis-campanas'
  const isRechargeActive = pathname === '/promocionar' && currentTab === 'recharge'
  const isCreateCampaignActive = pathname === '/promocionar' && (currentTab === 'campaign' || (!currentTab && pathname === '/promocionar'))

  // Admin
  const isAdminListingsActive = pathname === '/admin' && (effectiveSection === '' || effectiveSection === 'listings')
  const isAdminAdsActive = pathname === '/admin' && effectiveSection === 'ads'
  const isAdminAdPageActive = pathname === '/admin' && effectiveSection === 'adpage'
  const isAdminBalancesActive = pathname === '/admin' && effectiveSection === 'balances'
  const isAdminUsersActive = pathname === '/admin' && effectiveSection === 'users'

  const itemLayoutClass = isMobile
    ? 'justify-center text-center gap-2'
    : 'justify-between'

  const sectionHeaderClass = isMobile
    ? 'flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-zinc-500 uppercase tracking-wider text-[10px] font-bold text-center cursor-pointer'
    : 'flex items-center justify-between rounded-xl px-3 py-1.5 text-zinc-500 uppercase tracking-wider text-[10px] font-bold'

  const subGroupClass = isMobile
    ? 'mt-0.5 space-y-0.5'
    : 'mt-0.5 ml-3 space-y-0.5 border-l-2 border-zinc-200 pl-2.5 dark:border-zinc-800'

  const subGroupTealClass = isMobile
    ? 'mt-0.5 space-y-0.5'
    : 'mt-0.5 ml-3 space-y-0.5 border-l-2 border-teal-200 pl-2.5 dark:border-teal-900/60'

  const subHeadingClass = isMobile
    ? 'pt-1 pb-0.5 px-2 text-center text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500'
    : 'pt-1 pb-0.5 px-2 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500'

  return (
    <nav className={`space-y-1 text-xs font-medium ${isMobile ? 'text-center' : ''}`}>
      {/* OPCIÓN 1: Inicio */}
      <Link
        href="/"
        onClick={close}
        className={`flex items-center ${itemLayoutClass} rounded-xl px-3 py-2 transition-all ${
          isHomeActive
            ? 'bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-500/30 shadow-2xs'
            : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
        }`}
      >
        <span>{t.nav.home}</span>
        {isHomeActive && (
          <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
        )}
      </Link>

      {/* OPCIÓN: Directorio de Vendedores */}
      <Link
        href="/directorio"
        onClick={close}
        className={`flex items-center ${itemLayoutClass} rounded-xl px-3 py-2 transition-all ${
          isDirectoryActive
            ? 'bg-purple-50 text-purple-800 font-bold dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/30 shadow-2xs'
            : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
        }`}
      >
        <span>{t.nav.directory}</span>
        {isDirectoryActive && (
          <span className="h-2 w-2 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
        )}
      </Link>

      {/* OPCIÓN 1.B: Dashboard / Pantalla de Bienvenida */}
      {isLoggedIn && (
        <Link
          href={role ? `/bienvenida?role=${role}` : '/bienvenida'}
          onClick={close}
          className={`flex items-center ${itemLayoutClass} rounded-xl px-3 py-2 transition-all ${
            isDashboardActive
              ? 'bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-500/30 shadow-2xs'
              : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
          }`}
        >
          <span>Dashboard</span>
          {isDashboardActive && (
            <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
          )}
        </Link>
      )}

      {/* OPCIÓN 2: Catálogo (Desplegable) */}
      <div className="pt-1">
        <div
          onClick={isMobile ? () => setCatalogOpen(!catalogOpen) : undefined}
          className={sectionHeaderClass}
        >
          <span>{t.nav.catalog}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setCatalogOpen(!catalogOpen)
            }}
            className="p-0.5 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
            aria-label={catalogOpen ? 'Colapsar catálogo' : 'Expandir catálogo'}
          >
            {catalogOpen ? '▼' : '▶'}
          </button>
        </div>

        {catalogOpen && (
          <div className={subGroupClass}>
            <Link
              href="/catalogo?type=service"
              onClick={close}
              className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 transition-all text-xs font-medium ${
                isCatalogServiceActive
                  ? 'bg-purple-50 text-purple-800 font-bold dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/30 shadow-2xs'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{locale === 'en' ? 'Services' : 'Servicios'}</span>
              {isCatalogServiceActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
              )}
            </Link>

            <Link
              href="/catalogo?type=article"
              onClick={close}
              className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 transition-all text-xs font-medium ${
                isCatalogArticleActive
                  ? 'bg-amber-50 text-amber-800 font-bold dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-500/30 shadow-2xs'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{locale === 'en' ? 'Used Articles' : 'Artículos Usados'}</span>
              {isCatalogArticleActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400 shrink-0" />
              )}
            </Link>

            <Link
              href="/catalogo?type=product"
              onClick={close}
              className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 transition-all text-xs font-medium ${
                isCatalogProductActive
                  ? 'bg-blue-50 text-blue-800 font-bold dark:bg-blue-950/60 dark:text-blue-300 ring-1 ring-blue-500/30 shadow-2xs'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{locale === 'en' ? 'New Products' : 'Productos Nuevos'}</span>
              {isCatalogProductActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
              )}
            </Link>
          </div>
        )}
      </div>

      {/* OPCIÓN: Directorio de Contratos */}
      <div className="pt-1">
        <div
          onClick={isMobile ? () => setRequestsOpen(!requestsOpen) : undefined}
          className={sectionHeaderClass}
        >
          <span>
            {locale === 'en' ? 'Contracts Directory' : 'Directorio de Contratos'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setRequestsOpen(!requestsOpen)
            }}
            className="p-0.5 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
            aria-label={requestsOpen ? 'Colapsar directorio de contratos' : 'Expandir directorio de contratos'}
          >
            {requestsOpen ? '▼' : '▶'}
          </button>
        </div>

        {requestsOpen && (
          <div className={subGroupTealClass}>
            <Link
              href="/solicitudes"
              onClick={close}
              className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                isRequestsBoardActive
                  ? 'bg-teal-50 text-teal-800 font-bold dark:bg-teal-950/60 dark:text-teal-300 ring-1 ring-teal-500/30 shadow-2xs'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <span>
                {locale === 'en' ? 'Requests Board' : 'Tablero de Solicitudes'}
              </span>
              {isRequestsBoardActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600 dark:bg-teal-400 shrink-0" />
              )}
            </Link>

            {isLoggedIn && (role === 'buyer' || role === 'admin') && (
              <Link
                href="/solicitudes/comprador"
                onClick={close}
                className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                  isRequestsBuyerWindowActive
                    ? 'bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-500/30 shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                <span>
                  {locale === 'en' ? 'Buyer Window' : 'Ventana del Comprador'}
                </span>
                {isRequestsBuyerWindowActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
                )}
              </Link>
            )}

            {isLoggedIn && (role === 'seller' || role === 'admin') && (
              <Link
                href="/solicitudes/vendedor"
                onClick={close}
                className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                  isRequestsSellerWindowActive
                    ? 'bg-purple-50 text-purple-800 font-bold dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/30 shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                <span>
                  {locale === 'en' ? 'Seller Window' : 'Ventana del Vendedor'}
                </span>
                {isRequestsSellerWindowActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
                )}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* OPCIÓN 3: Mis Publicaciones */}
      {hasPermission(role, 'publish_listings') && (
        <div className="pt-1">
          <div
            onClick={isMobile ? () => setListingsOpen(!listingsOpen) : undefined}
            className={sectionHeaderClass}
          >
            <span>{t.nav.myListings}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setListingsOpen(!listingsOpen)
              }}
              className="p-0.5 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
              aria-label={listingsOpen ? 'Colapsar publicaciones' : 'Expandir publicaciones'}
            >
              {listingsOpen ? '▼' : '▶'}
            </button>
          </div>

          {listingsOpen && (
            <div className={subGroupClass}>
              <div className={subHeadingClass}>
                {locale === 'en' ? 'Create Listings' : 'Crear Publicaciones'}
              </div>

              <Link
                href="/publicar?type=service"
                onClick={close}
                className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                  isPublishServiceActive
                    ? 'bg-purple-50 text-purple-800 font-bold dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/30 shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-medium'
                }`}
              >
                <span>{locale === 'en' ? 'Post Service' : 'Publicar Servicio'}</span>
                {isPublishServiceActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
                )}
              </Link>

              <Link
                href="/publicar?type=product"
                onClick={close}
                className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                  isPublishProductActive
                    ? 'bg-blue-50 text-blue-800 font-bold dark:bg-blue-950/60 dark:text-blue-300 ring-1 ring-blue-500/30 shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-medium'
                }`}
              >
                <span>{locale === 'en' ? 'Post Product' : 'Publicar Producto'}</span>
                {isPublishProductActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                )}
              </Link>

              <div className={`${subHeadingClass} border-t border-zinc-100 dark:border-zinc-800/80 mt-1`}>
                {locale === 'en' ? 'Inventory & Services Control' : 'Control de Inventario y Servicios'}
              </div>

              <Link
                href="/mis-servicios"
                onClick={close}
                className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 transition-all text-xs ${
                  isServicesActive
                    ? 'bg-purple-50 text-purple-800 font-bold dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/30 shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-medium'
                }`}
              >
                <span>{locale === 'en' ? 'Services' : 'Servicios'}</span>
                {isServicesActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
                )}
              </Link>

              <Link
                href="/mis-publicaciones"
                onClick={close}
                className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 transition-all text-xs ${
                  isInventoryActive
                    ? 'bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-500/30 shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-medium'
                }`}
              >
                <span>{locale === 'en' ? 'Inventory' : 'Inventario'}</span>
                {isInventoryActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
                )}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* OPCIÓN 4: Mis Campañas */}
      {hasPermission(role, 'manage_campaigns') && (
        <div className="pt-1">
          <div
            onClick={isMobile ? () => setCampaignsOpen(!campaignsOpen) : undefined}
            className={sectionHeaderClass}
          >
            <span>{t.nav.myCampaigns}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setCampaignsOpen(!campaignsOpen)
              }}
              className="p-0.5 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
              aria-label={campaignsOpen ? 'Colapsar campañas' : 'Expandir campañas'}
            >
              {campaignsOpen ? '▼' : '▶'}
            </button>
          </div>

          {campaignsOpen && (
            <div className={subGroupClass}>
              <Link
                href="/mis-campanas"
                onClick={close}
                className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 transition-all text-xs ${
                  isCampaignHistoryActive
                    ? 'bg-purple-50 text-purple-800 font-bold dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/30 shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-medium'
                }`}
              >
                <span>{locale === 'en' ? 'Campaign History' : 'Historial de Campañas'}</span>
                {isCampaignHistoryActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
                )}
              </Link>

              <Link
                href="/promocionar?tab=recharge"
                onClick={close}
                className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 transition-all text-xs ${
                  isRechargeActive
                    ? 'bg-purple-50 text-purple-800 font-bold dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/30 shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-medium'
                }`}
              >
                <span>{t.nav.recharge}</span>
                {isRechargeActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
                )}
              </Link>

              <Link
                href="/promocionar?tab=campaign"
                onClick={close}
                className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 transition-all text-xs ${
                  isCreateCampaignActive
                    ? 'bg-purple-50 text-purple-800 font-bold dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/30 shadow-2xs'
                    : 'text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-zinc-800 font-bold'
                }`}
              >
                <span>{t.nav.createCampaign}</span>
                {isCreateCampaignActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
                )}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* OPCIÓN 5: Administración y Moderación */}
      {hasPermission(role, 'moderate_content') && (
        <div className="pt-1">
          <div
            onClick={isMobile ? () => setAdminOpen(!adminOpen) : undefined}
            className={sectionHeaderClass}
          >
            <div className="flex items-center gap-1.5">
              <span>{t.nav.moderation}</span>
              {pendingCount > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[9px] font-black text-white">
                  {pendingCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setAdminOpen(!adminOpen)
              }}
              className="p-0.5 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
              aria-label={adminOpen ? 'Colapsar moderación' : 'Expandir moderación'}
            >
              {adminOpen ? '▼' : '▶'}
            </button>
          </div>

          {adminOpen && (
            <div className={subGroupClass}>
              <Link
                href="/admin?section=listings"
                onClick={() => {
                  close()
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('admin-section-change', { detail: 'listings' }))
                  }
                }}
                className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 transition-all text-xs ${
                  isAdminListingsActive
                    ? 'bg-purple-50 text-purple-800 font-bold dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/30 shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-medium'
                }`}
              >
                <span>{t.nav.adminListings}</span>
                {isAdminListingsActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
                )}
              </Link>

              <Link
                href="/admin?section=ads"
                onClick={() => {
                  close()
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('admin-section-change', { detail: 'ads' }))
                  }
                }}
                className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 transition-all text-xs ${
                  isAdminAdsActive
                    ? 'bg-purple-50 text-purple-800 font-bold dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/30 shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-medium'
                }`}
              >
                <span>{t.nav.adminAds}</span>
                {isAdminAdsActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
                )}
              </Link>

              <Link
                href="/admin?section=adpage"
                onClick={() => {
                  close()
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('admin-section-change', { detail: 'adpage' }))
                  }
                }}
                className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 transition-all text-xs ${
                  isAdminAdPageActive
                    ? 'bg-purple-50 text-purple-800 font-bold dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/30 shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-medium'
                }`}
              >
                <span>
                  {locale === 'en' ? 'Ad Page Control' : 'Control Página Publicidad'}
                </span>
                {isAdminAdPageActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
                )}
              </Link>

              <Link
                href="/admin?section=balances"
                onClick={() => {
                  close()
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('admin-section-change', { detail: 'balances' }))
                  }
                }}
                className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 transition-all text-xs ${
                  isAdminBalancesActive
                    ? 'bg-purple-50 text-purple-800 font-bold dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/30 shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-medium'
                }`}
              >
                <span>{t.nav.adminBalances}</span>
                {isAdminBalancesActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
                )}
              </Link>

              <Link
                href="/admin?section=users"
                onClick={() => {
                  close()
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('admin-section-change', { detail: 'users' }))
                  }
                }}
                className={`flex items-center ${itemLayoutClass} rounded-lg px-2.5 py-1.5 transition-all text-xs ${
                  isAdminUsersActive
                    ? 'bg-purple-50 text-purple-800 font-bold dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/30 shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-medium'
                }`}
              >
                <span>{t.nav.adminUsers}</span>
                {isAdminUsersActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
                )}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Opción informativa para Compradores */}
      {role === 'buyer' && (
        <div className="pt-2">
          <Link
            href="/cuenta"
            onClick={close}
            className={`block rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 text-blue-900 hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300 transition-colors ${isMobile ? 'text-center' : ''}`}
          >
            <span className="block font-bold text-[11px]">
              {locale === 'en' ? 'Want to Sell?' : '¿Quieres Vender?'}
            </span>
            <span className="block text-[10px] text-blue-700 dark:text-blue-400">
              {locale === 'en' ? 'Activate seller profile' : 'Registra tu negocio en tu perfil'}
            </span>
          </Link>
        </div>
      )}
    </nav>
  )
}

function SidebarNav({
  close,
  t,
  locale,
  role,
  isLoggedIn,
  pendingCount,
  isMobile = false,
}: {
  close: () => void
  t: any
  locale: string
  role: string | null
  isLoggedIn: boolean
  pendingCount: number
  isMobile?: boolean
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams ? searchParams.toString() : ''

  useEffect(() => {
    close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchKey])

  const currentType = searchParams ? searchParams.get('type') || '' : ''
  const currentTab = searchParams ? searchParams.get('tab') || '' : ''
  const currentSection = searchParams ? searchParams.get('section') || searchParams.get('tab') || '' : ''

  return (
    <SidebarNavContent
      pathname={pathname}
      currentType={currentType}
      currentTab={currentTab}
      currentSection={currentSection}
      close={close}
      t={t}
      locale={locale}
      role={role}
      isLoggedIn={isLoggedIn}
      pendingCount={pendingCount}
      isMobile={isMobile}
    />
  )
}

function SidebarNavFallback({
  close,
  t,
  locale,
  role,
  isLoggedIn,
  pendingCount,
  isMobile = false,
}: {
  close: () => void
  t: any
  locale: string
  role: string | null
  isLoggedIn: boolean
  pendingCount: number
  isMobile?: boolean
}) {
  const pathname = usePathname()

  return (
    <SidebarNavContent
      pathname={pathname}
      currentType=""
      currentTab=""
      currentSection=""
      close={close}
      t={t}
      locale={locale}
      role={role}
      isLoggedIn={isLoggedIn}
      pendingCount={pendingCount}
      isMobile={isMobile}
    />
  )
}

export default function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, locale } = useTranslation()
  const { isOpen, close, isCollapsed, toggleCollapsed } = useSidebar()

  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [quickLoggingIn, setQuickLoggingIn] = useState(false)
  const [showProfilesModal, setShowProfilesModal] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function loadUser(sessionUser?: User | null) {
      let activeUser = sessionUser
      if (activeUser === undefined) {
        const {
          data: { user: fetchedUser },
        } = await supabase.auth.getUser()
        activeUser = fetchedUser
      }
      setUser(activeUser ?? null)

      if (activeUser) {
        const { data: profile } = await supabase
          .from('app_user')
          .select('role')
          .eq('id', activeUser.id)
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
        loadUser(session.user)
      } else {
        setRole(null)
        setPendingCount(0)
      }
    })

    const handleOpenProfiles = () => {
      close()
      setShowProfilesModal(true)
    }
    window.addEventListener('open-test-profiles-modal', handleOpenProfiles)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('open-test-profiles-modal', handleOpenProfiles)
    }
  }, [supabase, close])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Contenido exclusivo para la barra lateral de ESCRITORIO
  const desktopSidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto p-4 select-none">
      {/* 1. Header / Brand & Collapse Control */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <Link
            href="/"
            onClick={close}
            className="flex flex-col group"
          >
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              Indie Clasificados
            </span>
            <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">
              {locale === 'en' ? 'Economy in Circulation' : 'Economía en Circulación'}
            </span>
          </Link>

          {/* Desktop Collapse Button */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden md:flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-bold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            title={t.nav.collapseSidebar}
            aria-label={t.nav.collapseSidebar}
          >
            <span>◀</span>
            <span className="text-[10px]">{t.nav.collapseSidebar}</span>
          </button>
        </div>

        {/* 2. Hierarchical Navigation (Options & Suboptions) con Suspense */}
        <Suspense
          fallback={
            <SidebarNavFallback
              close={close}
              t={t}
              locale={locale}
              role={role}
              isLoggedIn={Boolean(user)}
              pendingCount={pendingCount}
            />
          }
        >
          <SidebarNav
            close={close}
            t={t}
            locale={locale}
            role={role}
            isLoggedIn={Boolean(user)}
            pendingCount={pendingCount}
          />
        </Suspense>
      </div>

      {/* 3. Footer del Sidebar Web: Preferencias, Usuario y Sesión */}
      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        {/* Switchers (Idioma y Tema) */}
        <div className="flex items-center justify-between gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        {/* User Card */}
        {user ? (
          <div className="rounded-xl bg-zinc-50 p-2.5 border border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {user.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  {role ? role.toUpperCase() : 'USUARIO'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfilesModal(true)}
                className="rounded-lg bg-zinc-200/80 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-purple-50 hover:text-purple-700 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-purple-950/50 dark:hover:text-purple-300 transition-colors cursor-pointer shrink-0"
                title="Cambiar perfil de prueba (40 perfiles)"
              >
                {locale === 'en' ? 'Profiles' : 'Perfiles'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <Link
                href="/cuenta"
                onClick={close}
                className={`flex items-center justify-center rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                  pathname === '/cuenta'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-zinc-200/80 text-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                <span>{t.nav.myAccount}</span>
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center justify-center rounded-lg bg-zinc-200/80 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 hover:bg-red-50 hover:text-red-700 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-red-950/50 dark:hover:text-red-300 transition-colors cursor-pointer"
                title={t.nav.signOut}
              >
                <span>{locale === 'en' ? t.nav.signOut : 'Cerrar Sesión'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Link
              href="/login"
              onClick={close}
              className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
            >
              <span>{t.nav.signIn}</span>
            </Link>
            <button
              type="button"
              disabled={quickLoggingIn}
              onClick={async () => {
                setQuickLoggingIn(true)
                const adminWelcomeUrl = '/bienvenida?role=admin&name=Administrador%20Maestro'
                triggerGlobalNavigationLoader(
                  adminWelcomeUrl,
                  'Iniciando Sesión como Administrador',
                  'Abriendo tu ventana liviana de bienvenida y guía rápida según tu perfil...'
                )
                try {
                  await supabase.auth.signInWithPassword({
                    email: 'admin@marketplace.com',
                    password: 'Password123!',
                  })
                  close()
                  router.push(adminWelcomeUrl)
                } finally {
                  setQuickLoggingIn(false)
                }
              }}
              className="flex w-full items-center justify-center rounded-xl border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 transition-colors cursor-pointer disabled:opacity-50"
              title="Acceso directo rápido como Administrador Maestro"
            >
              <span>{quickLoggingIn ? 'Iniciando sesión...' : 'Acceso Rápido Admin'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowProfilesModal(true)}
              className="flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title="Escoger entre los 40 perfiles de prueba"
            >
              <span>Perfiles de Prueba (40)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // Contenido exclusivo para el menú desplegable MÓVIL (emergente desde abajo, compacto y con sesión fija al pie)
  const mobileSidebarContent = (
    <div className="flex flex-col w-full max-h-[calc(100dvh-3.5rem)] overflow-hidden select-none">
      {/* 1. Cabecera compacta móvil */}
      <div className="shrink-0 mx-auto w-full max-w-md px-4 pt-3 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <Link
          href="/"
          onClick={close}
          className="flex flex-col group"
        >
          <span className="text-sm font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
            Indie Clasificados
          </span>
          <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">
            {locale === 'en' ? 'Economy in Circulation' : 'Economía en Circulación'}
          </span>
        </Link>

        <button
          type="button"
          onClick={close}
          className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
          aria-label="Cerrar menú"
        >
          <span>{t.common.close}</span>
        </button>
      </div>

      {/* 2. Enlaces de navegación centrados y orientados hacia el borde inferior para el pulgar */}
      <div className="flex-1 min-h-0 overflow-y-auto mx-auto w-full max-w-md px-4 py-2 flex flex-col">
        <div className="mt-auto">
          <Suspense
            fallback={
              <SidebarNavFallback
                close={close}
                t={t}
                locale={locale}
                role={role}
                isLoggedIn={Boolean(user)}
                pendingCount={pendingCount}
                isMobile={true}
              />
            }
          >
            <SidebarNav
              close={close}
              t={t}
              locale={locale}
              role={role}
              isLoggedIn={Boolean(user)}
              pendingCount={pendingCount}
              isMobile={true}
            />
          </Suspense>
        </div>
      </div>

      {/* 3. Pie de Sesión Móvil: siempre visible, pegado a la barra inferior sin espacio muerto */}
      <div className="shrink-0 mx-auto w-full max-w-md px-4 pt-2 pb-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {user ? (
          <div className="rounded-xl bg-zinc-50 p-2.5 border border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <span className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {user.email?.split('@')[0]}
                </span>
                <span className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-[9px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-semibold">
                  {role ? role.toUpperCase() : 'USUARIO'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowProfilesModal(true)}
                className="flex items-center rounded-lg bg-zinc-200/80 px-2.5 py-1 text-[11px] font-bold text-zinc-700 hover:bg-purple-50 hover:text-purple-700 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-purple-950/50 dark:hover:text-purple-300 transition-colors cursor-pointer shrink-0"
                title="Cambiar perfil de prueba (40 perfiles)"
              >
                <span>{locale === 'en' ? 'Profiles' : 'Perfiles'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/cuenta"
                onClick={close}
                className={`flex items-center justify-center rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  pathname === '/cuenta'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-zinc-200/80 text-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                <span>{t.nav.myAccount}</span>
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center justify-center rounded-lg bg-zinc-200/80 px-3 py-1.5 text-[11px] font-bold text-zinc-700 hover:bg-red-50 hover:text-red-700 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-red-950/50 dark:hover:text-red-300 transition-colors cursor-pointer"
                title={t.nav.signOut}
              >
                <span>{locale === 'en' ? t.nav.signOut : 'Cerrar Sesión'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Link
              href="/login"
              onClick={close}
              className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
            >
              <span>{t.nav.signIn}</span>
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={quickLoggingIn}
                onClick={async () => {
                  setQuickLoggingIn(true)
                  const adminWelcomeUrl = '/bienvenida?role=admin&name=Administrador%20Maestro'
                  triggerGlobalNavigationLoader(
                    adminWelcomeUrl,
                    'Iniciando Sesión como Administrador',
                    'Abriendo tu ventana liviana de bienvenida y guía rápida según tu perfil...'
                  )
                  try {
                    await supabase.auth.signInWithPassword({
                      email: 'admin@marketplace.com',
                      password: 'Password123!',
                    })
                    close()
                    router.push(adminWelcomeUrl)
                  } finally {
                    setQuickLoggingIn(false)
                  }
                }}
                className="flex items-center justify-center rounded-xl border border-purple-300 bg-purple-50 px-2.5 py-1.5 text-[11px] font-bold text-purple-800 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 transition-colors cursor-pointer disabled:opacity-50"
                title="Acceso directo rápido como Administrador Maestro"
              >
                <span>{quickLoggingIn ? 'Iniciando...' : 'Acceso Admin'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowProfilesModal(true)}
                className="flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                title="Escoger entre los 40 perfiles de prueba"
              >
                <span>Perfiles (40)</span>
              </button>
            </div>
          </div>
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
          className="hidden md:flex items-center gap-2 rounded-r-xl border-y border-r border-emerald-500 bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-xl shadow-emerald-950/30 hover:bg-emerald-500 hover:pl-3.5 transition-all fixed left-0 top-2 z-40 select-none animate-in slide-in-from-left duration-200 cursor-pointer"
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
        {!isCollapsed && desktopSidebarContent}
      </aside>

      {/* Mobile Backdrop & Full-screen Centered Menu emerging from the bottom menu button */}
      {isOpen && (
        <div
          onClick={close}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200 cursor-pointer"
        />
      )}

      <aside
        className={`fixed inset-x-0 bottom-14 z-[45] flex flex-col w-full max-h-[calc(100dvh-3.5rem)] rounded-t-2xl border-t border-zinc-200 dark:border-zinc-800 bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md shadow-2xl origin-bottom transition-all duration-300 ease-out md:hidden ${
          isOpen
            ? 'translate-y-0 scale-100 opacity-100 pointer-events-auto'
            : 'translate-y-full scale-95 opacity-0 pointer-events-none'
        }`}
      >
        {mobileSidebarContent}
      </aside>

      <TestProfilesModal isOpen={showProfilesModal} onClose={() => setShowProfilesModal(false)} />
    </>
  )
}
