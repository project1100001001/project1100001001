'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSidebar } from '@/components/SidebarContext'
import { ALL_TEST_PROFILES, ADMIN_PROFILE } from '@/lib/testProfiles'
import { getListingFreeTrialStatus } from '@/lib/adPolicies'
import AvantGardeLoader from '@/components/AvantGardeLoader'

type RoleType = 'buyer' | 'seller' | 'admin'

interface LightweightListing {
  id: string
  title: string
  type: 'service' | 'article' | 'product'
  price: number | null
  status: string
  stock: number | null
  city: string | null
  views_count: number
  contact_count: number
  created_at: string
  published_at: string | null
}

interface LightweightCampaign {
  id: string
  headline: string
  status: string
  price_paid: number
  starts_at: string | null
  ends_at: string | null
  clicks_count: number
  impressions_count: number
  contacts_count: number
  created_at: string
}

interface LightweightSale {
  id: string
  listing_id: string
  buyer_name: string | null
  quantity: number
  total_amount: number
  type: string
  status: string
  created_at: string
}

interface DashboardData {
  // Seller metrics
  sellerBusinessName?: string
  sellerVerified?: boolean
  sellerCity?: string
  publishedCount: number
  pendingOrPausedCount: number
  servicesCount: number
  articlesCount: number
  productsCount: number
  activeCampaignsCount: number
  freeTrialActiveCount: number
  walletBalance: number
  pendingRechargesCount: number
  salesCount: number
  salesTotalAmount: number
  recentListings: LightweightListing[]
  recentCampaigns: LightweightCampaign[]
  recentSales: LightweightSale[]

  // Buyer metrics
  buyerPurchasesCount: number
  buyerTotalSpent: number
  buyerReviewsCount: number
  cityOffersCount: number
  verifiedSellersCount: number

  // Admin metrics
  adminTotalListings: number
  adminPendingListings: number
  adminLiveCampaigns: number
  adminPendingCampaigns: number
  adminPendingRecharges: number
  adminTotalUsers: number
  adminTotalSellers: number
}

const INITIAL_DATA: DashboardData = {
  publishedCount: 0,
  pendingOrPausedCount: 0,
  servicesCount: 0,
  articlesCount: 0,
  productsCount: 0,
  activeCampaignsCount: 0,
  freeTrialActiveCount: 0,
  walletBalance: 0,
  pendingRechargesCount: 0,
  salesCount: 0,
  salesTotalAmount: 0,
  recentListings: [],
  recentCampaigns: [],
  recentSales: [],
  buyerPurchasesCount: 0,
  buyerTotalSpent: 0,
  buyerReviewsCount: 0,
  cityOffersCount: 0,
  verifiedSellersCount: 0,
  adminTotalListings: 0,
  adminPendingListings: 0,
  adminLiveCampaigns: 0,
  adminPendingCampaigns: 0,
  adminPendingRecharges: 0,
  adminTotalUsers: 0,
  adminTotalSellers: 0,
}

function formatCOP(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Cotización'
  return `$ ${Number(value).toLocaleString('es-CO')} COP`
}

function getTypeLabel(type: string) {
  if (type === 'service') return { icon: '🛠️', label: 'Servicio', badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' }
  if (type === 'article') return { icon: '📦', label: 'Usado', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' }
  return { icon: '✨', label: 'Nuevo', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'published':
    case 'live':
    case 'approved':
    case 'completed':
      return { text: 'Activo / Publicado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' }
    case 'submitted':
    case 'pending_review':
    case 'in_review':
    case 'pending':
      return { text: 'En Revisión', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' }
    case 'paused':
      return { text: 'Pausado', cls: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' }
    default:
      return { text: status, cls: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' }
  }
}

function WelcomeDashboardContent() {
  const searchParams = useSearchParams()
  const { open: openMobileSidebar, isCollapsed, toggleCollapsed } = useSidebar()

  const paramRole = searchParams.get('role') as RoleType | null
  const paramName = searchParams.get('name')

  const [role, setRole] = useState<RoleType>(
    paramRole === 'admin' || paramRole === 'seller' || paramRole === 'buyer'
      ? paramRole
      : 'buyer'
  )
  const [displayName, setDisplayName] = useState<string>(paramName || 'Usuario')
  const [userCity, setUserCity] = useState<string>('Bogotá')
  const [email, setEmail] = useState<string>('')
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true)
  const [metrics, setMetrics] = useState<DashboardData>(INITIAL_DATA)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function loadLightweightDashboard() {
      setLoadingMetrics(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!active || !user) {
          if (active) setLoadingMetrics(false)
          return
        }

        const userEmail = user.email || ''
        setEmail(userEmail)

        // Identificar perfil conocido de forma instantánea
        const allKnown = [ADMIN_PROFILE, ...ALL_TEST_PROFILES]
        const matchedTest = allKnown.find(
          (p) => p.email.toLowerCase() === userEmail.toLowerCase()
        )

        let effectiveRole: RoleType = role
        let effectiveCity = matchedTest?.city || 'Bogotá'

        if (matchedTest) {
          effectiveRole = matchedTest.role
          if (!paramRole) setRole(matchedTest.role)
          if (!paramName) setDisplayName(matchedTest.businessName || matchedTest.name)
          setUserCity(effectiveCity)
        } else {
          const { data: appUser } = await supabase
            .from('app_user')
            .select('role, full_name, city')
            .eq('id', user.id)
            .maybeSingle()

          if (appUser) {
            if (
              appUser.role === 'admin' ||
              appUser.role === 'seller' ||
              appUser.role === 'buyer'
            ) {
              effectiveRole = appUser.role
              if (!paramRole) setRole(appUser.role)
            }
            if (appUser.city) {
              effectiveCity = appUser.city
              setUserCity(appUser.city)
            }
            if (!paramName) {
              setDisplayName(
                appUser.full_name ||
                  user.user_metadata?.full_name ||
                  userEmail.split('@')[0] ||
                  'Usuario'
              )
            }
          }
        }

        // =====================================================================
        // 1. CONSULTAS ULTRALIGERAS PARA VENDEDOR (Sin imágenes ni joins pesados)
        // =====================================================================
        if (effectiveRole === 'seller') {
          const { data: sellers } = await supabase
            .from('seller')
            .select('id, business_name, verified, city')
            .eq('owner_user_id', user.id)

          const sellerIds = (sellers || []).map((s) => s.id)
          const primarySeller = sellers?.[0]

          if (sellerIds.length === 0) {
            if (active) setLoadingMetrics(false)
            return
          }

          // Ejecutar consultas ligeras en paralelo (solo columnas escalares de texto/número)
          const [listingsRes, advertisersRes, salesRes, rechargesRes] = await Promise.all([
            supabase
              .from('listing')
              .select(
                'id, title, type, price, status, stock, city, views_count, contact_count, created_at, published_at'
              )
              .in('seller_id', sellerIds)
              .order('created_at', { ascending: false })
              .limit(25),
            supabase.from('advertiser').select('id').in('seller_id', sellerIds),
            supabase
              .from('sale')
              .select('id, listing_id, buyer_name, quantity, total_amount, type, status, created_at')
              .in('seller_id', sellerIds)
              .order('created_at', { ascending: false })
              .limit(10),
            supabase
              .from('ad_recharge_request')
              .select('id, status')
              .in('seller_id', sellerIds)
              .eq('status', 'pending'),
          ])

          const myListings = (listingsRes.data || []) as LightweightListing[]
          const published = myListings.filter((l) => l.status === 'published')
          const pendingOrPaused = myListings.filter((l) => l.status !== 'published')
          const services = myListings.filter((l) => l.type === 'service')
          const articles = myListings.filter((l) => l.type === 'article')
          const products = myListings.filter((l) => l.type === 'product')

          const freeTrialActive = published.filter(
            (l) => getListingFreeTrialStatus(l.published_at || l.created_at).isInFreeTrial
          )

          // Consultar billetera y órdenes de campaña si tiene advertiser
          let walletBalance = 0
          let myCampaigns: LightweightCampaign[] = []
          const advIds = (advertisersRes.data || []).map((a) => a.id)

          if (advIds.length > 0) {
            const { data: accounts } = await supabase
              .from('ad_account')
              .select('id, balance')
              .in('advertiser_id', advIds)

            const accIds = (accounts || []).map((acc) => acc.id)
            walletBalance = (accounts || []).reduce(
              (sum, acc) => sum + Number(acc.balance || 0),
              0
            )

            if (accIds.length > 0) {
              const { data: orders } = await supabase
                .from('ad_order')
                .select(
                  'id, headline, status, price_paid, starts_at, ends_at, clicks_count, impressions_count, contacts_count, created_at'
                )
                .in('ad_account_id', accIds)
                .order('created_at', { ascending: false })
                .limit(10)

              myCampaigns = (orders || []) as LightweightCampaign[]
            }
          }

          const mySales = (salesRes.data || []) as LightweightSale[]
          const totalSalesAmount = mySales
            .filter((s) => s.status !== 'cancelled')
            .reduce((sum, s) => sum + Number(s.total_amount || 0), 0)

          const activePaidCampaigns = myCampaigns.filter((c) =>
            ['live', 'approved', 'scheduled'].includes(c.status)
          )

          if (active) {
            setMetrics({
              ...INITIAL_DATA,
              sellerBusinessName: primarySeller?.business_name || displayName,
              sellerVerified: Boolean(primarySeller?.verified),
              sellerCity: primarySeller?.city || effectiveCity,
              publishedCount: published.length,
              pendingOrPausedCount: pendingOrPaused.length,
              servicesCount: services.length,
              articlesCount: articles.length,
              productsCount: products.length,
              activeCampaignsCount: activePaidCampaigns.length,
              freeTrialActiveCount: freeTrialActive.length,
              walletBalance,
              pendingRechargesCount: (rechargesRes.data || []).length,
              salesCount: mySales.length,
              salesTotalAmount: totalSalesAmount,
              recentListings: myListings.slice(0, 6),
              recentCampaigns: myCampaigns.slice(0, 5),
              recentSales: mySales.slice(0, 5),
            })
          }
        }

        // =====================================================================
        // 2. CONSULTAS ULTRALIGERAS PARA COMPRADOR
        // =====================================================================
        else if (effectiveRole === 'buyer') {
          const [
            purchasesByIdRes,
            purchasesByEmailRes,
            reviewsRes,
            catalogSummaryRes,
            verifiedSellersRes,
          ] = await Promise.all([
            supabase
              .from('sale')
              .select('id, listing_id, buyer_name, quantity, total_amount, type, status, created_at')
              .eq('buyer_id', user.id)
              .order('created_at', { ascending: false })
              .limit(8),
            userEmail
              ? supabase
                  .from('sale')
                  .select(
                    'id, listing_id, buyer_name, quantity, total_amount, type, status, created_at'
                  )
                  .eq('buyer_email', userEmail)
                  .order('created_at', { ascending: false })
                  .limit(8)
              : Promise.resolve({ data: [] }),
            supabase
              .from('review')
              .select('id', { count: 'exact', head: true })
              .eq('buyer_user_id', user.id),
            supabase
              .from('listing')
              .select(
                'id, title, type, price, status, stock, city, views_count, contact_count, created_at, published_at'
              )
              .eq('status', 'published')
              .order('created_at', { ascending: false })
              .limit(40),
            supabase
              .from('seller')
              .select('id', { count: 'exact', head: true })
              .eq('verified', true),
          ])

          // Unificar compras por ID o por email sin duplicados
          const mapSales = new Map<string, LightweightSale>()
          ;[...(purchasesByIdRes.data || []), ...(purchasesByEmailRes.data || [])].forEach(
            (s: any) => {
              mapSales.set(s.id, s as LightweightSale)
            }
          )
          const buyerSales = Array.from(mapSales.values())
          const totalSpent = buyerSales.reduce(
            (sum, s) => sum + Number(s.total_amount || 0),
            0
          )

          const activeCatalog = (catalogSummaryRes.data || []) as LightweightListing[]
          const services = activeCatalog.filter((l) => l.type === 'service')
          const articles = activeCatalog.filter((l) => l.type === 'article')
          const products = activeCatalog.filter((l) => l.type === 'product')
          const inBuyerCity = activeCatalog.filter(
            (l) =>
              !l.city ||
              l.city.toLowerCase().includes(effectiveCity.toLowerCase())
          )

          if (active) {
            setMetrics({
              ...INITIAL_DATA,
              buyerPurchasesCount: buyerSales.length,
              buyerTotalSpent: totalSpent,
              buyerReviewsCount: reviewsRes.count || 0,
              publishedCount: activeCatalog.length,
              servicesCount: services.length,
              articlesCount: articles.length,
              productsCount: products.length,
              cityOffersCount: inBuyerCity.length,
              verifiedSellersCount: verifiedSellersRes.count || 0,
              recentSales: buyerSales.slice(0, 5),
              recentListings: (inBuyerCity.length > 0 ? inBuyerCity : activeCatalog).slice(0, 6),
            })
          }
        }

        // =====================================================================
        // 3. CONSULTAS ULTRALIGERAS PARA ADMINISTRADOR
        // =====================================================================
        else if (effectiveRole === 'admin') {
          const [
            publishedListingsCount,
            pendingListingsCount,
            recentListingsRes,
            recentCampaignsRes,
            pendingRechargesCount,
            usersCountRes,
            sellersCountRes,
          ] = await Promise.all([
            supabase
              .from('listing')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'published'),
            supabase
              .from('listing')
              .select('*', { count: 'exact', head: true })
              .in('status', ['submitted', 'pending_review']),
            supabase
              .from('listing')
              .select(
                'id, title, type, price, status, stock, city, views_count, contact_count, created_at, published_at'
              )
              .order('created_at', { ascending: false })
              .limit(6),
            supabase
              .from('ad_order')
              .select(
                'id, headline, status, price_paid, starts_at, ends_at, clicks_count, impressions_count, contacts_count, created_at'
              )
              .order('created_at', { ascending: false })
              .limit(6),
            supabase
              .from('ad_recharge_request')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'pending'),
            supabase.from('app_user').select('*', { count: 'exact', head: true }),
            supabase.from('seller').select('*', { count: 'exact', head: true }),
          ])

          const campaignsList = (recentCampaignsRes.data || []) as LightweightCampaign[]
          const liveCamps = campaignsList.filter((c) =>
            ['live', 'approved', 'scheduled'].includes(c.status)
          ).length
          const pendingCamps = campaignsList.filter((c) =>
            ['submitted', 'in_review'].includes(c.status)
          ).length

          if (active) {
            setMetrics({
              ...INITIAL_DATA,
              adminTotalListings: publishedListingsCount.count || 0,
              adminPendingListings: pendingListingsCount.count || 0,
              adminLiveCampaigns: liveCamps,
              adminPendingCampaigns: pendingCamps,
              adminPendingRecharges: pendingRechargesCount.count || 0,
              adminTotalUsers: usersCountRes.count || 0,
              adminTotalSellers: sellersCountRes.count || 0,
              recentListings: (recentListingsRes.data || []) as LightweightListing[],
              recentCampaigns: campaignsList,
            })
          }
        }
      } catch {
        // Fallback silencioso para mantener la página siempre rápida y funcional
      } finally {
        if (active) setLoadingMetrics(false)
      }
    }

    loadLightweightDashboard()
    return () => {
      active = false
    }
  }, [paramRole, paramName])

  const roleHeaderConfig = {
    seller: {
      badge: '🏪 Panel Ejecutivo de Vendedor',
      badgeClass:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      subtitle:
        'Resumen en tiempo real de tus publicaciones activas, campañas anunciadas, ventas y saldo publicitario.',
    },
    buyer: {
      badge: '🛒 Panel Ejecutivo de Comprador',
      badgeClass:
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
      subtitle:
        'Resumen de tus compras registradas, reseñas y disponibilidad actual de servicios, artículos y productos en tu ciudad.',
    },
    admin: {
      badge: '🛡️ Panel Ejecutivo de Administración',
      badgeClass:
        'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
      subtitle:
        'Estado operativo de Indie Clasificados: anuncios publicados, cola de moderación, campañas activas y usuarios.',
    },
  }[role]

  return (
    <main className="flex-1 bg-white dark:bg-zinc-950 px-4 py-6 sm:px-8 sm:py-10 select-none">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* 1. CABECERA DE BIENVENIDA ULTRALIGERA */}
        <section className="rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-7 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white border border-zinc-200 dark:border-zinc-700 text-2xl shadow-2xs">
                🛠️
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Indie Clasificados
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${roleHeaderConfig.badgeClass}`}
                  >
                    {roleHeaderConfig.badge}
                  </span>
                  {role === 'seller' && metrics.sellerVerified && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-300">
                      ✓ Comercio Verificado
                    </span>
                  )}
                </div>
                <h1 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  ¡Bienvenido, {metrics.sellerBusinessName || displayName}!
                </h1>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {roleHeaderConfig.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span>{loadingMetrics ? 'Sincronizando...' : 'Datos al día'}</span>
              </span>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 2. DASHBOARD PRECISO SEGÚN EL PERFIL (VENDEDOR / COMPRADOR / ADMIN)   */}
        {/* ===================================================================== */}

        {role === 'seller' && (
          <>
            {/* 4 KPIs de Vendedor */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  <span>Publicadas</span>
                  <span className="text-base">📦</span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50">
                  {metrics.publishedCount}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  <span>🛠️ {metrics.servicesCount}</span>
                  <span>•</span>
                  <span>📦 {metrics.articlesCount}</span>
                  <span>•</span>
                  <span>✨ {metrics.productsCount}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  <span>Anunciadas en Pauta</span>
                  <span className="text-base">📢</span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                  {metrics.activeCampaignsCount + metrics.freeTrialActiveCount}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  {metrics.activeCampaignsCount} pagas • {metrics.freeTrialActiveCount} en 7d gratis
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  <span>Ventas / Servicios</span>
                  <span className="text-base">🤝</span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {metrics.salesCount}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 truncate">
                  Total: {formatCOP(metrics.salesTotalAmount)}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  <span>Saldo Publicitario</span>
                  <span className="text-base">💳</span>
                </div>
                <div className="mt-2 text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 truncate">
                  {formatCOP(metrics.walletBalance)}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  {metrics.pendingRechargesCount > 0
                    ? `${metrics.pendingRechargesCount} recarga(s) en revisión`
                    : 'Billetera activa para campañas'}
                </div>
              </div>
            </section>

            {/* Tablas Ligeras del Vendedor (Sin imágenes para máxima velocidad) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Listado de Mis Publicaciones */}
              <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <div>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                      📦 Mis Publicaciones y Estado de Pauta
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Gestiona desde Menú Izquierdo → Mis Publicaciones
                    </p>
                  </div>
                  <span className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                    {metrics.publishedCount + metrics.pendingOrPausedCount} total
                  </span>
                </div>

                {metrics.recentListings.length === 0 ? (
                  <p className="py-6 text-center text-xs text-zinc-400">
                    {loadingMetrics
                      ? 'Cargando tus publicaciones...'
                      : 'Aún no tienes publicaciones registradas en este perfil.'}
                  </p>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {metrics.recentListings.map((item) => {
                      const tInfo = getTypeLabel(item.type)
                      const sBadge = getStatusBadge(item.status)
                      const trial = getListingFreeTrialStatus(
                        item.published_at || item.created_at
                      )
                      return (
                        <div
                          key={item.id}
                          className="py-2.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tInfo.badge}`}
                              >
                                {tInfo.icon} {tInfo.label}
                              </span>
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {item.title}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCOP(item.price)}
                              </span>
                              {item.stock !== null && item.type !== 'service' && (
                                <span>• Stock: {item.stock}</span>
                              )}
                              {trial.isInFreeTrial && (
                                <span className="text-purple-600 dark:text-purple-400 font-semibold">
                                  • ✨ Pauta inicial ({trial.daysRemaining}d restantes)
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${sBadge.cls}`}
                          >
                            {sBadge.text}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Listado de Campañas Anunciadas y Ventas */}
              <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                    <div>
                      <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                        📢 Campañas Publicitarias y Ventas
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Gestiona desde Menú Izquierdo → Mis Campañas
                      </p>
                    </div>
                  </div>

                  {metrics.recentCampaigns.length === 0 ? (
                    <div className="py-4 text-xs text-zinc-500 dark:text-zinc-400">
                      {metrics.freeTrialActiveCount > 0 ? (
                        <div className="rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/50 p-3">
                          <span className="font-bold text-purple-800 dark:text-purple-300">
                            ✨ Tienes {metrics.freeTrialActiveCount} publicación(es) en periodo promocional gratuito de 7 días
                          </span>
                          <p className="mt-0.5 text-[11px] text-purple-700/80 dark:text-purple-300/80">
                            Tus anuncios ya se están exhibiendo en las pasarelas de Indie Clasificados.
                          </p>
                        </div>
                      ) : (
                        <p className="text-center py-2 text-zinc-400">
                          Sin órdenes de campaña adicionales registradas.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 mt-2">
                      {metrics.recentCampaigns.map((camp) => {
                        const sBadge = getStatusBadge(camp.status)
                        return (
                          <div
                            key={camp.id}
                            className="py-2.5 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {camp.headline}
                              </div>
                              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
                                <span>Inversión: {formatCOP(camp.price_paid)}</span>
                                <span>•</span>
                                <span>👁️ {camp.impressions_count || 0}</span>
                                <span>•</span>
                                <span>💬 {camp.contacts_count || 0}</span>
                              </div>
                            </div>
                            <span
                              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${sBadge.cls}`}
                            >
                              {sBadge.text}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Últimas Ventas del Vendedor */}
                {metrics.recentSales.length > 0 && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300 mb-2">
                      🤝 Últimas Ventas / Servicios Registrados
                    </div>
                    <div className="space-y-1.5">
                      {metrics.recentSales.slice(0, 3).map((sale) => (
                        <div
                          key={sale.id}
                          className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-xs"
                        >
                          <div className="truncate">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              {sale.buyer_name || 'Cliente directo'}
                            </span>
                            <span className="ml-2 text-[11px] text-zinc-500">
                              (Cant: {sale.quantity})
                            </span>
                          </div>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                            {formatCOP(sale.total_amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {role === 'buyer' && (
          <>
            {/* 4 KPIs de Comprador */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  <span>Mis Compras</span>
                  <span className="text-base">🛍️</span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                  {metrics.buyerPurchasesCount}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 truncate">
                  Total: {formatCOP(metrics.buyerTotalSpent)}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  <span>Ofertas en {userCity}</span>
                  <span className="text-base">📍</span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {metrics.cityOffersCount}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Disponibles hoy cerca de ti
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  <span>Catálogo Activo</span>
                  <span className="text-base">🔍</span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50">
                  {metrics.publishedCount}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  <span>🛠️ {metrics.servicesCount}</span>
                  <span>•</span>
                  <span>📦 {metrics.articlesCount}</span>
                  <span>•</span>
                  <span>✨ {metrics.productsCount}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  <span>Comercios Verificados</span>
                  <span className="text-base">🏪</span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                  {metrics.verifiedSellersCount}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Mis reseñas: ★ {metrics.buyerReviewsCount}
                </div>
              </div>
            </section>

            {/* Paneles Ligeros del Comprador */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Mis Compras / Actividad Reciente */}
              <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <div>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                      🛍️ Mis Compras y Servicios Adquiridos
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Operaciones asociadas a tu perfil de comprador
                    </p>
                  </div>
                  <span className="rounded-lg bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                    {metrics.buyerPurchasesCount} registro(s)
                  </span>
                </div>

                {metrics.recentSales.length === 0 ? (
                  <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200">
                      Aún no tienes compras cerradas registradas
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Usa el <strong>Menú Lateral Izquierdo → Catálogo</strong> para explorar 🛠️ Servicios, 📦 Artículos Usados o ✨ Productos Nuevos y contactar directo por WhatsApp.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {metrics.recentSales.map((sale) => {
                      const tInfo = getTypeLabel(sale.type)
                      const sBadge = getStatusBadge(sale.status)
                      return (
                        <div
                          key={sale.id}
                          className="py-2.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tInfo.badge}`}
                              >
                                {tInfo.icon} {tInfo.label}
                              </span>
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                Cantidad: {sale.quantity}
                              </span>
                            </div>
                            <div className="mt-1 font-extrabold text-emerald-600 dark:text-emerald-400">
                              {formatCOP(sale.total_amount)}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${sBadge.cls}`}
                          >
                            {sBadge.text}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Ofertas Destacadas en su Ciudad */}
              <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <div>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                      📍 Publicaciones Disponibles en {userCity}
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Vista rápida ultraligera sin carga pesada de imágenes
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {metrics.recentListings.map((item) => {
                    const tInfo = getTypeLabel(item.type)
                    return (
                      <div
                        key={item.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tInfo.badge}`}
                            >
                              {tInfo.icon} {tInfo.label}
                            </span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {item.title}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-zinc-500">
                            📍 {item.city || userCity}
                          </div>
                        </div>
                        <span className="shrink-0 font-black text-emerald-600 dark:text-emerald-400">
                          {formatCOP(item.price)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          </>
        )}

        {role === 'admin' && (
          <>
            {/* 4 KPIs de Administrador */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  <span>Anuncios Publicados</span>
                  <span className="text-base">📋</span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50">
                  {metrics.adminTotalListings}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  ⏳ {metrics.adminPendingListings} pendiente(s) de revisión
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  <span>Campañas en Pauta</span>
                  <span className="text-base">📢</span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                  {metrics.adminLiveCampaigns}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  {metrics.adminPendingCampaigns} solicitud(es) por aprobar
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  <span>Recargas de Saldo</span>
                  <span className="text-base">💳</span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {metrics.adminPendingRecharges}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Solicitudes pendientes en billetera
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  <span>Comunidad Activa</span>
                  <span className="text-base">👥</span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  {metrics.adminTotalUsers}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  🏪 {metrics.adminTotalSellers} comercios vendedores
                </div>
              </div>
            </section>

            {/* Paneles Ligeros de Administración */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                    📋 Últimas Publicaciones en Plataforma
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Modera desde Menú Izquierdo → Moderación y Administración → Anuncios
                  </p>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {metrics.recentListings.map((item) => {
                    const tInfo = getTypeLabel(item.type)
                    const sBadge = getStatusBadge(item.status)
                    return (
                      <div
                        key={item.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tInfo.badge}`}
                            >
                              {tInfo.icon} {tInfo.label}
                            </span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {item.title}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-zinc-500">
                            {formatCOP(item.price)} • 📍 {item.city || 'Colombia'}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${sBadge.cls}`}
                        >
                          {sBadge.text}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                    📢 Últimas Órdenes de Campaña Publicitaria
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Gestiona desde Menú Izquierdo → Moderación y Administración → Campañas
                  </p>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {metrics.recentCampaigns.map((camp) => {
                    const sBadge = getStatusBadge(camp.status)
                    return (
                      <div
                        key={camp.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {camp.headline}
                          </div>
                          <div className="mt-0.5 text-[11px] text-zinc-500">
                            {formatCOP(camp.price_paid)} • 👁️ {camp.impressions_count || 0} vistas • 💬 {camp.contacts_count || 0} contactos
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${sBadge.cls}`}
                        >
                          {sBadge.text}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          </>
        )}

        {/* 3. BARRA INFERIOR DE ORIENTACIÓN AL MENÚ LATERAL IZQUIERDO */}
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 text-base shadow-2xs">
              👈
            </span>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
                Accede a todas tus herramientas desde el Menú Lateral Izquierdo
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300/90">
                Esta vista ejecutiva opera sin carga de imágenes ni pasarelas para ofrecerte respuesta instantánea al iniciar sesión.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isCollapsed && (
              <button
                type="button"
                onClick={toggleCollapsed}
                className="hidden md:inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                <span>▶</span>
                <span>Mostrar Menú Lateral</span>
              </button>
            )}
            <button
              type="button"
              onClick={openMobileSidebar}
              className="flex md:hidden w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
            >
              <span>☰</span>
              <span>Abrir Menú Lateral</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

export default function BienvenidaPage() {
  return (
    <Suspense
      fallback={
        <AvantGardeLoader
          title="Tu Resumen Ejecutivo y Actividad"
          subtitle="Cargando indicadores ligeros de tu cuenta y guía rápida según tu rol..."
        />
      }
    >
      <WelcomeDashboardContent />
    </Suspense>
  )
}
