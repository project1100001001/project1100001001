'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type {
  ListingWithRelations,
  ListingStatus,
  AdOrderWithRelations,
  AdOrderStatus,
  AdAccountWithRelations,
  Seller,
  WalletTransactionWithRelations,
  AdRechargeRequestWithRelations,
} from '@/lib/types'
import { useTranslation } from '@/lib/i18n'
import {
  OFFICIAL_AD_PLANS,
  FREE_INITIAL_AD_DAYS,
  resolveAdOrderPlacement,
  extractSeasonalRunwayMeta,
  getListingFreeTrialStatus,
  buildInitialFreeAdAttrs,
  getAdOrderTimeStatus,
  resolveIndependentRunwayStates,
  INDEPENDENT_RUNWAY_OVERRIDES_KEY,
} from '@/lib/adPolicies'
import {
  type AdPageConfig,
  type DynamicRunwayConfig,
  type DynamicRunwayReason,
  DEFAULT_AD_PAGE_CONFIG,
  AD_PAGE_CONFIG_STORAGE_KEY,
  sanitizeAdPageConfig,
  encodeAdPageConfigToSlot,
  getListingSpecialClassification,
  isSellerAuthorizedForClassification,
} from '@/lib/adPageConfig'
import AdPageAdminConfigWindow from '@/components/AdPageAdminConfigWindow'
import AdminUsersManagementWindow from '@/components/AdminUsersManagementWindow'

interface AdminModerationPanelProps {
  initialListings: ListingWithRelations[]
  initialAdOrders?: AdOrderWithRelations[]
  initialAdAccounts?: AdAccountWithRelations[]
  initialSellers?: Seller[]
  initialTransactions?: WalletTransactionWithRelations[]
  initialRechargeRequests?: AdRechargeRequestWithRelations[]
  initialUsers?: any[]
  initialAdPageConfig?: AdPageConfig
  defaultSection?: 'listings' | 'ads' | 'adpage' | 'balances' | 'users'
}

export default function AdminModerationPanel({
  initialListings,
  initialAdOrders = [],
  initialAdAccounts = [],
  initialSellers = [],
  initialTransactions = [],
  initialRechargeRequests = [],
  initialUsers = [],
  initialAdPageConfig = DEFAULT_AD_PAGE_CONFIG,
  defaultSection = 'listings',
}: AdminModerationPanelProps) {
  const { t, locale } = useTranslation()
  const [section, setSection] = useState<'listings' | 'ads' | 'adpage' | 'balances' | 'users'>(
    defaultSection
  )
  const [users, setUsers] = useState<any[]>(initialUsers)
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'buyer' | 'seller' | 'admin'>('all')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [roleSuccessNotice, setRoleSuccessNotice] = useState<string | null>(null)
  const [roleErrorNotice, setRoleErrorNotice] = useState<string | null>(null)

  const searchParams = useSearchParams()

  useEffect(() => {
    if (defaultSection) {
      setSection(defaultSection)
    }
  }, [defaultSection])

  useEffect(() => {
    if (searchParams) {
      const sec = searchParams.get('section') || searchParams.get('tab')
      if (sec && ['listings', 'ads', 'adpage', 'balances', 'users'].includes(sec)) {
        setSection(sec as any)
        setSearchQuery('')
      }
    }
  }, [searchParams])

  useEffect(() => {
    const handleSectionChange = (e: any) => {
      if (e.detail && ['listings', 'ads', 'adpage', 'balances', 'users'].includes(e.detail)) {
        setSection(e.detail)
        setSearchQuery('')
      }
    }
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const sec = params.get('section') || params.get('tab')
        if (sec && ['listings', 'ads', 'adpage', 'balances', 'users'].includes(sec)) {
          setSection(sec as any)
          setSearchQuery('')
        } else if (!sec) {
          setSection('listings')
          setSearchQuery('')
        }
      }
    }
    window.addEventListener('admin-section-change', handleSectionChange)
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('admin-section-change', handleSectionChange)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  // Listings state
  const [listings, setListings] = useState<ListingWithRelations[]>(initialListings)
  const [activeTab, setActiveTab] = useState<'pending' | 'published' | 'rejected' | 'draft' | 'all'>('pending')
  const [listingClassificationFilter, setListingClassificationFilter] = useState<string>('all')

  // Ads state & Independent Runway Administration
  const [adOrders, setAdOrders] = useState<AdOrderWithRelations[]>(initialAdOrders)
  const [adActiveTab, setAdActiveTab] = useState<
    'pending' | 'live' | 'ended' | 'rejected' | 'all'
  >('all')
  const [adMediumFilter, setAdMediumFilter] = useState<
    'all' | 'vitrina' | 'pasarela' | 'proveedores' | string
  >('all')
  const [rejectingAd, setRejectingAd] = useState<AdOrderWithRelations | null>(null)
  const [adRejectReason, setAdRejectReason] = useState('')
  const [isSyncingPolicies, setIsSyncingPolicies] = useState(false)

  // Estados para Reactivación de Campaña con Configuraciones y Validación de Pago (Perfil Admin)
  const [adminReactivatingAd, setAdminReactivatingAd] = useState<AdOrderWithRelations | null>(null)
  const [adminReactivatePlacement, setAdminReactivatePlacement] = useState<
    'pasarela' | 'gran_vitrina' | 'combo' | 'none'
  >('pasarela')
  const [adminReactivateRunwayId, setAdminReactivateRunwayId] = useState<string>('')
  const [adminReactivateDurationDays, setAdminReactivateDurationDays] = useState<number>(7)
  const [adminReactivateHeadline, setAdminReactivateHeadline] = useState<string>('')
  const [adminReactivateBody, setAdminReactivateBody] = useState<string>('')
  const [adminReactivateImageUrl, setAdminReactivateImageUrl] = useState<string>('')
  const [adminReactivatePaymentValidation, setAdminReactivatePaymentValidation] = useState<
    'approve_pending_recharge' | 'deduct_wallet' | 'direct_validated'
  >('deduct_wallet')
  const [adminReactivateSelectedRechargeId, setAdminReactivateSelectedRechargeId] =
    useState<string>('')
  const [isSubmittingAdminReactivation, setIsSubmittingAdminReactivation] =
    useState<boolean>(false)

  // Configuración viva de pasarelas (incluye customRunways por temporada o expansión de mercado)
  const [liveAdPageConfig, setLiveAdPageConfig] = useState<AdPageConfig>(() =>
    sanitizeAdPageConfig(initialAdPageConfig || DEFAULT_AD_PAGE_CONFIG)
  )
  const [localRunwayOverrides, setLocalRunwayOverrides] = useState<Record<string, any>>({})

  // Formulario rápido para adicionar nueva pasarela / catálogo exclusivo (por temporada o expansión de mercado)
  const [showAddRunwayForm, setShowAddRunwayForm] = useState(false)
  const [newRunwayTitle, setNewRunwayTitle] = useState('')
  const [newRunwaySubtitle, setNewRunwaySubtitle] = useState('')
  const [newRunwayBadge, setNewRunwayBadge] = useState('🎄 Especial de Temporada')
  const [newRunwayIcon, setNewRunwayIcon] = useState('🔥')
  const [newRunwayReason, setNewRunwayReason] = useState<DynamicRunwayReason>('season')
  const [newRunwayFilterType, setNewRunwayFilterType] = useState<
    'all' | 'service' | 'article' | 'product' | 'keyword'
  >('all')
  const [newRunwayKeyword, setNewRunwayKeyword] = useState('')
  const [newRunwayMaxItems, setNewRunwayMaxItems] = useState<number>(12)
  const [newRunwayDurationDays, setNewRunwayDurationDays] = useState<number>(7)
  const [newRunwayCampaignCostCop, setNewRunwayCampaignCostCop] = useState<number>(15000)
  const [newRunwayHasExclusiveCatalog, setNewRunwayHasExclusiveCatalog] = useState<boolean>(true)
  const [newRunwayAllowAllPaidSellers, setNewRunwayAllowAllPaidSellers] = useState<boolean>(true)
  const [newRunwayAccent, setNewRunwayAccent] = useState<
    'purple' | 'amber' | 'emerald' | 'blue' | 'rose'
  >('purple')
  const [managingSellersForRunwayId, setManagingSellersForRunwayId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const savedCfg = localStorage.getItem(AD_PAGE_CONFIG_STORAGE_KEY)
      if (savedCfg) {
        setLiveAdPageConfig(sanitizeAdPageConfig(JSON.parse(savedCfg)))
      }
      const savedOverrides = localStorage.getItem(INDEPENDENT_RUNWAY_OVERRIDES_KEY)
      if (savedOverrides) {
        setLocalRunwayOverrides(JSON.parse(savedOverrides))
      }
    } catch {
      // Ignorar errores de almacenamiento local
    }

    const handleCfgUpdate = (e: any) => {
      if (e?.detail) {
        setLiveAdPageConfig(sanitizeAdPageConfig(e.detail))
      }
    }
    window.addEventListener('ad-page-config-updated', handleCfgUpdate)
    return () => window.removeEventListener('ad-page-config-updated', handleCfgUpdate)
  }, [])

  // Balances & Wallets state
  const [adAccounts, setAdAccounts] = useState<AdAccountWithRelations[]>(initialAdAccounts)
  const [sellers] = useState<Seller[]>(initialSellers)
  const [transactions, setTransactions] = useState<WalletTransactionWithRelations[]>(initialTransactions)
  const [rechargeRequests, setRechargeRequests] = useState<AdRechargeRequestWithRelations[]>(initialRechargeRequests)
  const [balanceSubTab, setBalanceSubTab] = useState<'requests' | 'accounts' | 'transactions'>(
    initialRechargeRequests.some((r) => r.status === 'pending') ? 'requests' : 'accounts'
  )
  const [rejectingRequest, setRejectingRequest] = useState<AdRechargeRequestWithRelations | null>(null)
  const [rejectRequestNotes, setRejectRequestNotes] = useState('')
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)

  // Topup modal state
  const [topupModalOpen, setTopupModalOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [selectedSellerId, setSelectedSellerId] = useState('')
  const [topupAmount, setTopupAmount] = useState<string | number>('')
  const [topupRefType, setTopupRefType] = useState('nequi')
  const [topupRefId, setTopupRefId] = useState('')
  const [topupNotes, setTopupNotes] = useState('')
  const [isToppingUp, setIsToppingUp] = useState(false)

  // Shared state
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Rejection modal state for listings
  const [rejectingListing, setRejectingListing] = useState<ListingWithRelations | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const supabase = createClient()

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  // --- Listings filtering ---
  const pendingListingStatuses: ListingStatus[] = ['submitted', 'pending_review']

  const filteredListings = listings.filter((l) => {
    if (activeTab === 'pending' && !pendingListingStatuses.includes(l.status)) return false
    if (activeTab === 'published' && l.status !== 'published') return false
    if (activeTab === 'rejected' && l.status !== 'rejected') return false
    if (activeTab === 'draft' && l.status !== 'draft') return false

    if (listingClassificationFilter !== 'all') {
      const spec = getListingSpecialClassification(l, liveAdPageConfig.customRunways)
      if (listingClassificationFilter === 'none') {
        if (spec) return false
      } else if (spec?.id !== listingClassificationFilter) {
        return false
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = l.title.toLowerCase().includes(q)
      const matchSeller = l.seller?.business_name.toLowerCase().includes(q)
      const matchCategory = l.category?.name.toLowerCase().includes(q)
      const matchCity = l.city?.toLowerCase().includes(q)
      return matchTitle || matchSeller || matchCategory || matchCity
    }

    return true
  })

  const pendingListingsCount = listings.filter((l) => pendingListingStatuses.includes(l.status)).length
  const publishedListingsCount = listings.filter((l) => l.status === 'published').length
  const rejectedListingsCount = listings.filter((l) => l.status === 'rejected').length
  const draftListingsCount = listings.filter((l) => l.status === 'draft').length

  // --- Ads & Independent Runway Medium helper ---
  const pendingAdStatuses: AdOrderStatus[] = ['submitted', 'in_review']

  const getAdIndependentStates = (ad: AdOrderWithRelations) => {
    const resolved = resolveAdOrderPlacement(ad)
    const timeStatus = getAdOrderTimeStatus(ad)
    return resolveIndependentRunwayStates(
      {
        id: ad.id,
        placement: resolved.placement,
        startsAt: timeStatus.startsAt,
        endsAt: timeStatus.endsAt,
        attrs: ad.listing?.attrs || null,
        isPaid: true,
      },
      localRunwayOverrides
    )
  }

  const isAdEndedOrExpired = (ad: AdOrderWithRelations) => {
    const ts = getAdOrderTimeStatus(ad)
    return (
      ad.status === 'ended' ||
      ad.status === 'cancelled' ||
      ad.status === 'paused' ||
      (ts.isExpired && !pendingAdStatuses.includes(ad.status))
    )
  }

  const filteredAds = adOrders.filter((ad) => {
    if (adActiveTab === 'pending' && !pendingAdStatuses.includes(ad.status)) return false
    if (
      adActiveTab === 'live' &&
      ((ad.status !== 'live' && ad.status !== 'approved') || isAdEndedOrExpired(ad))
    )
      return false
    if (adActiveTab === 'ended' && !isAdEndedOrExpired(ad)) return false
    if (adActiveTab === 'rejected' && ad.status !== 'rejected') return false

    const mediumStates = getAdIndependentStates(ad)
    if (adMediumFilter === 'vitrina' && !mediumStates.vitrina.enabled) return false
    if (adMediumFilter === 'pasarela' && !mediumStates.pasarela.enabled) return false
    if (adMediumFilter === 'proveedores' && !mediumStates.proveedores.enabled) return false
    if (
      adMediumFilter !== 'all' &&
      adMediumFilter !== 'vitrina' &&
      adMediumFilter !== 'pasarela' &&
      adMediumFilter !== 'proveedores'
    ) {
      const targetCustom = liveAdPageConfig.customRunways.find((r) => r.id === adMediumFilter)
      const isAssignedInConfig = targetCustom?.assignedListingIds?.includes(ad.listing_id || '')
      const isEnabledInOverride = mediumStates.customRunways[adMediumFilter]?.enabled
      if (!isAssignedInConfig && !isEnabledInOverride) return false
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchHeadline = ad.headline.toLowerCase().includes(q)
      const matchBody = ad.body?.toLowerCase().includes(q) || false
      const matchPkg = ad.package?.name.toLowerCase().includes(q) || false
      const matchListing = ad.listing?.title.toLowerCase().includes(q) || false
      const matchSeller = ad.listing?.seller?.business_name?.toLowerCase().includes(q) || false
      return matchHeadline || matchBody || matchPkg || matchListing || matchSeller
    }

    return true
  })

  const pendingAdsCount = adOrders.filter((a) => pendingAdStatuses.includes(a.status)).length
  const liveAdsCount = adOrders.filter(
    (a) => (a.status === 'live' || a.status === 'approved') && !isAdEndedOrExpired(a)
  ).length
  const endedAdsCount = adOrders.filter((a) => isAdEndedOrExpired(a)).length
  const rejectedAdsCount = adOrders.filter((a) => a.status === 'rejected').length

  // Contadores independientes por medio para el panel de administración
  const vitrinaAdsCount = adOrders.filter((a) => getAdIndependentStates(a).vitrina.enabled).length
  const pasarelaAdsCount = adOrders.filter((a) => getAdIndependentStates(a).pasarela.enabled).length
  const proveedoresAdsCount = adOrders.filter(
    (a) => getAdIndependentStates(a).proveedores.enabled
  ).length

  // --- Pagination & View Mode for Admin Lists (Min 10 initially) ---
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [visibleLimit, setVisibleLimit] = useState<number>(10)

  useEffect(() => {
    const currentLen = section === 'ads' ? filteredAds.length : filteredListings.length
    setVisibleLimit(itemsPerPage === 0 ? currentLen : Math.max(10, itemsPerPage))
  }, [
    itemsPerPage,
    section,
    activeTab,
    adActiveTab,
    adMediumFilter,
    searchQuery,
    filteredListings.length,
    filteredAds.length,
  ])

  const visibleListings =
    itemsPerPage === 0
      ? filteredListings
      : filteredListings.slice(0, Math.max(10, visibleLimit))

  const visibleAds =
    itemsPerPage === 0
      ? filteredAds
      : filteredAds.slice(0, Math.max(10, visibleLimit))

  const handleChangeItemsPerPage = (newCount: number, totalLen: number) => {
    setItemsPerPage(newCount)
    setVisibleLimit(newCount === 0 ? totalLen : Math.max(10, newCount))
  }

  // --- Handlers: Sync Official Ad Packages ---
  const handleSyncOfficialAdPackages = async () => {
    setIsSyncingPolicies(true)
    try {
      for (const plan of OFFICIAL_AD_PLANS) {
        const { error } = await supabase
          .from('ad_package')
          .upsert(
            {
              id: plan.id,
              slot_id: plan.slot_id,
              name: plan.name,
              duration_days: plan.duration_days,
              price: plan.price,
              active: true,
            },
            { onConflict: 'id' }
          )
        if (error) throw error
      }
      showToast('Políticas y tarifas oficiales sincronizadas en base de datos (Pasarela $10.000, Gran Vitrina $20.000, Combo $25.000).')
    } catch (err: any) {
      showToast(err.message || 'Error al sincronizar paquetes publicitarios', 'error')
    } finally {
      setIsSyncingPolicies(false)
    }
  }

  // --- Handlers: Listings ---
  const handleApproveListing = async (listingId: string) => {
    setProcessingId(listingId)
    try {
      const targetListing = listings.find((item) => item.id === listingId)
      const nowIso = new Date().toISOString()
      const updatedAttrs = buildInitialFreeAdAttrs(targetListing?.attrs)

      const { error } = await supabase
        .from('listing')
        .update({
          status: 'published',
          published_at: targetListing?.published_at || nowIso,
          attrs: updatedAttrs,
          reject_reason: null,
        })
        .eq('id', listingId)

      if (error) throw error

      setListings((prev) =>
        prev.map((item) =>
          item.id === listingId
            ? {
                ...item,
                status: 'published',
                published_at: item.published_at || nowIso,
                attrs: updatedAttrs,
                reject_reason: null,
              }
            : item
        )
      )

      showToast(`Publicación aprobada con ${FREE_INITIAL_AD_DAYS} días iniciales de publicidad gratis activados.`)
    } catch (err: any) {
      showToast(err.message || 'Error al aprobar la publicación', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleConfirmRejectListing = async () => {
    if (!rejectingListing) return
    setProcessingId(rejectingListing.id)

    try {
      const { error } = await supabase
        .from('listing')
        .update({
          status: 'rejected',
          reject_reason: rejectReason.trim() || 'No cumple con las políticas de moderación',
        })
        .eq('id', rejectingListing.id)

      if (error) throw error

      setListings((prev) =>
        prev.map((item) =>
          item.id === rejectingListing.id
            ? {
                ...item,
                status: 'rejected',
                reject_reason: rejectReason.trim() || 'No cumple con las políticas de moderación',
              }
            : item
        )
      )

      showToast('Publicación rechazada y notificada al vendedor.')
      setRejectingListing(null)
      setRejectReason('')
    } catch (err: any) {
      showToast(err.message || 'Error al rechazar la publicación', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  // --- Handlers: Ads ---
  const handleApproveAd = async (adOrderId: string) => {
    setProcessingId(adOrderId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const now = new Date()
      const targetAd = adOrders.find((a) => a.id === adOrderId)
      const seasonalMeta = extractSeasonalRunwayMeta(targetAd)
      const matchedSeasonalRunway = seasonalMeta.specialRunwayId
        ? (liveAdPageConfig.customRunways || []).find((r) => r.id === seasonalMeta.specialRunwayId)
        : null

      const durationDays =
        seasonalMeta.isSeasonalOnly && matchedSeasonalRunway?.defaultDurationDays
          ? Number(matchedSeasonalRunway.defaultDurationDays)
          : targetAd?.package?.duration_days || 7
      const startsAt = now.toISOString()
      const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()

      const { error } = await supabase
        .from('ad_order')
        .update({
          status: 'live',
          reject_reason: null,
          reviewed_by: user?.id || null,
          reviewed_at: now.toISOString(),
          starts_at: startsAt,
          ends_at: endsAt,
        })
        .eq('id', adOrderId)

      if (error) throw error

      // Si la campaña incluye o es exclusivamente una Pasarela de Temporada, activarla con las mismas condiciones que las pasarelas originales
      if (seasonalMeta.specialRunwayId && targetAd) {
        const runwayId = seasonalMeta.specialRunwayId
        const sellerId =
          targetAd.listing?.seller_id || targetAd.ad_account?.advertiser?.seller_id || null
        const listingId = targetAd.listing_id || null

        if (listingId) {
          const baseAttrs = targetAd.listing?.attrs || {}
          const resolved = resolveAdOrderPlacement(targetAd)
          const nextAttrs: Record<string, any> = {
            ...baseAttrs,
            ad_placement: seasonalMeta.isSeasonalOnly ? 'pasarela_temporada' : resolved.placement,
            special_runway_id: runwayId,
            special_runway_title:
              matchedSeasonalRunway?.title ||
              seasonalMeta.specialRunwayTitle ||
              baseAttrs.special_runway_title,
            special_runway_badge: matchedSeasonalRunway
              ? `${matchedSeasonalRunway.icon} ${matchedSeasonalRunway.badge}`
              : baseAttrs.special_runway_badge,
            runway_independent_status: {
              ...(baseAttrs.runway_independent_status || {}),
              customRunways: {
                ...(baseAttrs.runway_independent_status?.customRunways || {}),
                [runwayId]: {
                  enabled: true,
                  endsAt,
                },
              },
            },
          }
          try {
            await supabase.from('listing').update({ attrs: nextAttrs }).eq('id', listingId)
          } catch {
            // Ignorar si falla actualización secundaria
          }
          setListings((prev) =>
            prev.map((l) => (l.id === listingId ? { ...l, attrs: nextAttrs } : l))
          )
        }

        const nextRunways = (liveAdPageConfig.customRunways || []).map((r) => {
          if (r.id !== runwayId) return r
          const assigned = new Set(r.assignedListingIds || [])
          const authorized = new Set(r.authorizedSellerIds || [])
          if (listingId) assigned.add(listingId)
          if (sellerId) authorized.add(sellerId)
          return {
            ...r,
            active: true,
            assignedListingIds: Array.from(assigned),
            authorizedSellerIds: Array.from(authorized),
          }
        })
        await persistLiveAdPageConfig({
          ...liveAdPageConfig,
          customRunways: nextRunways,
        })
      }

      setAdOrders((prev) =>
        prev.map((item) =>
          item.id === adOrderId
            ? {
                ...item,
                status: 'live',
                reject_reason: null,
                reviewed_by: user?.id || null,
                reviewed_at: now.toISOString(),
                starts_at: startsAt,
                ends_at: endsAt,
              }
            : item
        )
      )

      showToast(
        seasonalMeta.specialRunwayId
          ? `Campaña y Pasarela de Temporada "${matchedSeasonalRunway?.title || seasonalMeta.specialRunwayTitle || 'Especial'}" activadas (live) exitosamente.`
          : 'Campaña publicitaria aprobada y activada (live) exitosamente.'
      )
    } catch (err: any) {
      showToast(err.message || 'Error al aprobar la campaña publicitaria', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  // Abrir modal administrativo de reactivación y configuración de campaña (Perfil Admin)
  const handleOpenAdminReactivateModal = (ad: AdOrderWithRelations) => {
    setAdminReactivatingAd(ad)
    setAdminReactivateHeadline(ad.headline || '')
    setAdminReactivateBody(ad.body || '')
    setAdminReactivateImageUrl(ad.image_url || '')

    const seasonalMeta = extractSeasonalRunwayMeta(ad)
    const resolvedPl = resolveAdOrderPlacement(ad)

    if (seasonalMeta.isSeasonalOnly && seasonalMeta.specialRunwayId) {
      setAdminReactivatePlacement('none')
      setAdminReactivateRunwayId(seasonalMeta.specialRunwayId)
    } else {
      if (resolvedPl.placement === 'combo') {
        setAdminReactivatePlacement('combo')
      } else if (resolvedPl.placement === 'gran_vitrina') {
        setAdminReactivatePlacement('gran_vitrina')
      } else {
        setAdminReactivatePlacement('pasarela')
      }
      setAdminReactivateRunwayId(
        seasonalMeta.specialRunwayId || (ad.listing as any)?.attrs?.special_runway_id || ''
      )
    }

    const durationDays = ad.package?.duration_days || 7
    setAdminReactivateDurationDays(durationDays)

    // Buscar si existe una solicitud de recarga pendiente vinculada a esta campaña o del mismo vendedor
    const sellerId =
      ad.listing?.seller_id || ad.ad_account?.advertiser?.seller_id || ''
    const linkedPendingReq =
      rechargeRequests.find(
        (r) => r.status === 'pending' && r.notes?.includes(`[REACTIVAR_CAMPANA:${ad.id}]`)
      ) ||
      rechargeRequests.find(
        (r) =>
          r.status === 'pending' &&
          (r.ad_account_id === ad.ad_account_id || (sellerId && r.seller_id === sellerId))
      )

    if (linkedPendingReq) {
      setAdminReactivateSelectedRechargeId(linkedPendingReq.id)
      setAdminReactivatePaymentValidation('approve_pending_recharge')
    } else {
      setAdminReactivateSelectedRechargeId('')
      const sellerAcc = adAccounts.find(
        (acc) =>
          acc.id === ad.ad_account_id ||
          (sellerId && acc.advertiser?.seller_id === sellerId)
      )
      const sellerBal = Number(sellerAcc?.balance || 0)
      const baseCost =
        seasonalMeta.isSeasonalOnly && seasonalMeta.specialRunwayId
          ? 0
          : resolvedPl.placement === 'combo'
            ? 25000
            : resolvedPl.placement === 'gran_vitrina'
              ? 20000
              : 10000
      setAdminReactivatePaymentValidation(
        sellerBal >= baseCost ? 'deduct_wallet' : 'direct_validated'
      )
    }
  }

  // Confirmar reactivación administrativa de campaña con configuración de pasarelas y validación de pago
  const handleConfirmAdminReactivateAd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminReactivatingAd) return

    const selectedRunway =
      (liveAdPageConfig.customRunways || []).find((r) => r.id === adminReactivateRunwayId) ||
      null

    if (adminReactivatePlacement === 'none' && !selectedRunway) {
      showToast(
        'Debes seleccionar al menos un Plan Original o una Pasarela de Temporada para reactivar la campaña.',
        'error'
      )
      return
    }

    setIsSubmittingAdminReactivation(true)
    setProcessingId(adminReactivatingAd.id)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const baseCost =
        adminReactivatePlacement === 'combo'
          ? 25000
          : adminReactivatePlacement === 'gran_vitrina'
            ? 20000
            : adminReactivatePlacement === 'pasarela'
              ? 10000
              : 0
      const seasonalCost = selectedRunway
        ? Number(selectedRunway.campaignCostCop || 15000)
        : 0
      const totalCost = baseCost + seasonalCost

      const sellerId =
        adminReactivatingAd.listing?.seller_id ||
        adminReactivatingAd.ad_account?.advertiser?.seller_id ||
        ''
      const targetAccount =
        adAccounts.find((a) => a.id === adminReactivatingAd.ad_account_id) ||
        adAccounts.find((a) => sellerId && a.advertiser?.seller_id === sellerId)

      let currentAccBalance = Number(targetAccount?.balance || 0)

      // 1. Procesar Validación de Pago según la modalidad elegida por el Admin
      if (
        adminReactivatePaymentValidation === 'approve_pending_recharge' &&
        adminReactivateSelectedRechargeId
      ) {
        const pendingReq = rechargeRequests.find(
          (r) => r.id === adminReactivateSelectedRechargeId
        )
        if (pendingReq && pendingReq.status === 'pending') {
          await supabase
            .from('ad_recharge_request')
            .update({
              status: 'approved',
              approved_by: user?.id || null,
              approved_at: new Date().toISOString(),
            })
            .eq('id', pendingReq.id)

          currentAccBalance += Number(pendingReq.amount || 0)

          if (targetAccount) {
            await supabase
              .from('ad_account')
              .update({ balance: currentAccBalance })
              .eq('id', targetAccount.id)

            await supabase.from('wallet_transaction').insert({
              ad_account_id: targetAccount.id,
              kind: 'topup',
              amount: pendingReq.amount,
              balance_after: currentAccBalance,
              ref_type: pendingReq.payment_method,
              ref_id: pendingReq.reference_code,
            })
          }

          setRechargeRequests((prev) =>
            prev.map((r) =>
              r.id === pendingReq.id
                ? { ...r, status: 'approved', approved_at: new Date().toISOString() }
                : r
            )
          )
        }
      }

      if (
        (adminReactivatePaymentValidation === 'deduct_wallet' ||
          adminReactivatePaymentValidation === 'approve_pending_recharge') &&
        targetAccount
      ) {
        if (currentAccBalance < totalCost) {
          throw new Error(
            `El saldo en la billetera del vendedor ($${currentAccBalance.toLocaleString('es-CO')} COP) es menor al costo de reactivación ($${totalCost.toLocaleString('es-CO')} COP). Usa "Pago Directo Validado" o aprueba una recarga mayor.`
          )
        }
        const nextBalance = Math.max(0, currentAccBalance - totalCost)
        await supabase
          .from('ad_account')
          .update({ balance: nextBalance })
          .eq('id', targetAccount.id)

        const { data: spendTx } = await supabase
          .from('wallet_transaction')
          .insert({
            ad_account_id: targetAccount.id,
            kind: 'spend',
            amount: totalCost,
            balance_after: nextBalance,
            ref_type: 'admin_campaign_reactivation',
            ref_id: adminReactivatingAd.id,
          })
          .select('id')
          .maybeSingle()

        setAdAccounts((prev) =>
          prev.map((a) => (a.id === targetAccount.id ? { ...a, balance: nextBalance } : a))
        )

        const newSpendTx: WalletTransactionWithRelations = {
          id: Number(spendTx?.id) || Date.now(),
          ad_account_id: targetAccount.id,
          kind: 'spend',
          amount: totalCost,
          balance_after: nextBalance,
          ref_type: 'admin_campaign_reactivation',
          ref_id: adminReactivatingAd.id,
          idempotency_key: null,
          created_at: new Date().toISOString(),
          ad_account: targetAccount,
        }
        setTransactions((prev) => [newSpendTx, ...prev])
      }

      // 2. Resolver plan oficial, fechas de vigencia y etiquetas de temporada
      const matchedOfficialPlan =
        adminReactivatePlacement === 'combo'
          ? OFFICIAL_AD_PLANS.find((p) => p.placement === 'combo')
          : adminReactivatePlacement === 'gran_vitrina'
            ? OFFICIAL_AD_PLANS.find((p) => p.placement === 'gran_vitrina')
            : OFFICIAL_AD_PLANS.find((p) => p.placement === 'pasarela')

      const resolvedPackageId =
        matchedOfficialPlan?.id || adminReactivatingAd.package_id
      const resolvedSlotId =
        matchedOfficialPlan?.slot_id || adminReactivatingAd.slot_id

      const rawCat = (adminReactivatingAd.target_category || '').trim()
      const cleanCat = rawCat
        .replace(/^(\[(?:SOLO_TEMPORADA|PLAN_MAS_TEMPORADA):[^\]]+\])\s*/, '')
        .trim()

      const seasonalPrefix =
        adminReactivatePlacement === 'none' && selectedRunway
          ? `[SOLO_TEMPORADA:${selectedRunway.id}]`
          : adminReactivatePlacement !== 'none' && selectedRunway
            ? `[PLAN_MAS_TEMPORADA:${selectedRunway.id}:${adminReactivatePlacement}]`
            : ''

      const finalTargetCategory = seasonalPrefix
        ? cleanCat
          ? `${seasonalPrefix} ${cleanCat}`
          : `${seasonalPrefix} ${selectedRunway?.title || 'Temporada'}`
        : cleanCat || null

      const durationDays = Math.max(1, Number(adminReactivateDurationDays) || 7)
      const now = new Date()
      const startsAt = now.toISOString()
      const endsAt = new Date(
        now.getTime() + durationDays * 24 * 60 * 60 * 1000
      ).toISOString()

      const updateAdPayload = {
        package_id: resolvedPackageId,
        slot_id: resolvedSlotId,
        headline: adminReactivateHeadline.trim() || adminReactivatingAd.headline,
        body: adminReactivateBody.trim() || null,
        image_url: adminReactivateImageUrl.trim() || null,
        target_category: finalTargetCategory,
        price_paid: totalCost,
        status: 'live' as AdOrderStatus,
        reject_reason: null,
        reviewed_by: user?.id || null,
        reviewed_at: startsAt,
        starts_at: startsAt,
        ends_at: endsAt,
      }

      const { error: adUpdErr } = await supabase
        .from('ad_order')
        .update(updateAdPayload)
        .eq('id', adminReactivatingAd.id)

      if (adUpdErr) throw adUpdErr

      // 3. Sincronizar estados independientes por pasarela y atributos de la publicación
      const listingId = adminReactivatingAd.listing_id || null
      const independentStateForOrder = {
        vitrina: {
          enabled:
            adminReactivatePlacement === 'gran_vitrina' ||
            adminReactivatePlacement === 'combo',
          endsAt,
        },
        pasarela: {
          enabled:
            adminReactivatePlacement === 'pasarela' ||
            adminReactivatePlacement === 'combo',
          endsAt,
        },
        proveedores: {
          enabled: true,
          endsAt,
        },
        customRunways: selectedRunway
          ? {
              [selectedRunway.id]: {
                enabled: true,
                endsAt,
              },
            }
          : {},
      }

      const nextOverridesMap = {
        ...localRunwayOverrides,
        [adminReactivatingAd.id]: independentStateForOrder,
      }
      setLocalRunwayOverrides(nextOverridesMap)
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          INDEPENDENT_RUNWAY_OVERRIDES_KEY,
          JSON.stringify(nextOverridesMap)
        )
      }

      if (listingId) {
        const baseAttrs = adminReactivatingAd.listing?.attrs || {}
        const nextAttrs: Record<string, any> = {
          ...baseAttrs,
          ad_placement:
            adminReactivatePlacement === 'none'
              ? 'pasarela_temporada'
              : adminReactivatePlacement,
          custom_campaign_image_url: updateAdPayload.image_url,
          runway_independent_status: independentStateForOrder,
          campaign_overrides: {
            ...(baseAttrs.campaign_overrides || {}),
            [adminReactivatingAd.id]: {
              headline: updateAdPayload.headline,
              body: updateAdPayload.body,
              image_url: updateAdPayload.image_url,
              target_category: updateAdPayload.target_category,
              pending_reactivation_payment: false,
              reactivated_at: startsAt,
            },
          },
        }

        if (selectedRunway) {
          nextAttrs.special_runway_id = selectedRunway.id
          nextAttrs.special_runway_title = selectedRunway.title
          nextAttrs.special_runway_badge = `${selectedRunway.icon} ${selectedRunway.badge}`
          nextAttrs.special_catalog_cost = selectedRunway.campaignCostCop
        } else {
          delete nextAttrs.special_runway_id
          delete nextAttrs.special_runway_title
          delete nextAttrs.special_runway_badge
          delete nextAttrs.special_catalog_cost
        }

        try {
          await supabase.from('listing').update({ attrs: nextAttrs }).eq('id', listingId)
        } catch {
          // Ignorar error secundario
        }

        setListings((prev) =>
          prev.map((l) => (l.id === listingId ? { ...l, attrs: nextAttrs } : l))
        )
      }

      if (selectedRunway) {
        const nextRunways = (liveAdPageConfig.customRunways || []).map((r) => {
          if (r.id !== selectedRunway.id) return r
          const assigned = new Set(r.assignedListingIds || [])
          const authorized = new Set(r.authorizedSellerIds || [])
          if (listingId) assigned.add(listingId)
          if (sellerId) authorized.add(sellerId)
          return {
            ...r,
            active: true,
            assignedListingIds: Array.from(assigned),
            authorizedSellerIds: Array.from(authorized),
          }
        })
        await persistLiveAdPageConfig({
          ...liveAdPageConfig,
          customRunways: nextRunways,
        })
      }

      setAdOrders((prev) =>
        prev.map((item) =>
          item.id === adminReactivatingAd.id
            ? {
                ...item,
                ...updateAdPayload,
              }
            : item
        )
      )

      setAdminReactivatingAd(null)
      showToast(
        `✅ Campaña "${updateAdPayload.headline}" reactivada en vivo (${durationDays} días) con pago validado ($${totalCost.toLocaleString('es-CO')} COP).`
      )
    } catch (err: any) {
      showToast(err.message || 'Error al reactivar la campaña', 'error')
    } finally {
      setIsSubmittingAdminReactivation(false)
      setProcessingId(null)
    }
  }

  // Ajustar tiempo restante global de una orden publicitaria (+7d, +1d, -1d)
  const handleAdjustAdOrderTime = async (adOrderId: string, deltaDays: number) => {
    setProcessingId(adOrderId)
    try {
      const targetAd = adOrders.find((a) => a.id === adOrderId)
      if (!targetAd) return

      const currentStatus = getAdOrderTimeStatus(targetAd)
      const baseEndMs = currentStatus.isExpired
        ? Date.now()
        : new Date(currentStatus.endsAt).getTime()
      const nextEndMs = Math.max(
        Date.now() + 3600 * 1000,
        baseEndMs + deltaDays * 24 * 60 * 60 * 1000
      )
      const nextEndsAt = new Date(nextEndMs).toISOString()
      const nextStartsAt = targetAd.starts_at || new Date().toISOString()

      const { error } = await supabase
        .from('ad_order')
        .update({
          starts_at: nextStartsAt,
          ends_at: nextEndsAt,
          status: targetAd.status === 'ended' ? 'live' : targetAd.status,
        })
        .eq('id', adOrderId)

      if (error) {
        console.warn('Aviso actualizando ends_at en ad_order:', error.message)
      }

      setAdOrders((prev) =>
        prev.map((item) =>
          item.id === adOrderId
            ? {
                ...item,
                starts_at: nextStartsAt,
                ends_at: nextEndsAt,
                status: item.status === 'ended' ? 'live' : item.status,
              }
            : item
        )
      )

      showToast(
        `Tiempo de vigencia ajustado (${deltaDays > 0 ? `+${deltaDays}` : deltaDays} días). Nueva fecha fin: ${new Date(nextEndsAt).toLocaleDateString('es-CO')}.`
      )
    } catch (err: any) {
      showToast(err.message || 'Error al ajustar tiempo de campaña', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  // Administrar de forma independiente el estado y tiempo restante por cada medio (Vitrina, Pasarela, Pasarela de Proveedores o Pasarela Adicional)
  const handleUpdateIndependentMedium = async (
    ad: AdOrderWithRelations,
    mediumKey: 'vitrina' | 'pasarela' | 'proveedores' | string,
    options: { toggle?: boolean; deltaDays?: number; isCustomRunway?: boolean }
  ) => {
    const currentStates = getAdIndependentStates(ad)
    const existingForAd = localRunwayOverrides[ad.id] || ad.listing?.attrs?.runway_independent_status || {}

    let updatedAdOverride = { ...existingForAd }

    if (options.isCustomRunway) {
      const prevCustom = currentStates.customRunways[mediumKey] || {
        enabled: liveAdPageConfig.customRunways
          .find((r) => r.id === mediumKey)
          ?.assignedListingIds?.includes(ad.listing_id || ''),
        endsAt: getAdOrderTimeStatus(ad).endsAt,
      }
      const nextEnabled = options.toggle ? !prevCustom.enabled : true
      const baseMs = Math.max(Date.now(), new Date(prevCustom.endsAt).getTime())
      const nextEndsAt = options.deltaDays
        ? new Date(
            Math.max(Date.now() + 3600 * 1000, baseMs + options.deltaDays * 24 * 60 * 60 * 1000)
          ).toISOString()
        : prevCustom.endsAt

      updatedAdOverride = {
        ...updatedAdOverride,
        customRunways: {
          ...(updatedAdOverride.customRunways || {}),
          [mediumKey]: {
            enabled: nextEnabled,
            endsAt: nextEndsAt,
          },
        },
      }

      // También sincronizar assignedListingIds en la pasarela personalizada si tiene listing_id
      if (ad.listing_id) {
        const nextRunways = liveAdPageConfig.customRunways.map((r) => {
          if (r.id !== mediumKey) return r
          const currentIds = new Set(r.assignedListingIds || [])
          if (nextEnabled) {
            currentIds.add(ad.listing_id!)
          } else {
            currentIds.delete(ad.listing_id!)
          }
          return {
            ...r,
            assignedListingIds: Array.from(currentIds),
          }
        })
        await persistLiveAdPageConfig({
          ...liveAdPageConfig,
          customRunways: nextRunways,
        })
      }
    } else {
      const targetState =
        mediumKey === 'vitrina'
          ? currentStates.vitrina
          : mediumKey === 'pasarela'
          ? currentStates.pasarela
          : currentStates.proveedores

      const nextEnabled = options.toggle ? !targetState.enabled : targetState.enabled
      const baseMs = Math.max(Date.now(), new Date(targetState.endsAt).getTime())
      const nextEndsAt = options.deltaDays
        ? new Date(
            Math.max(Date.now() + 3600 * 1000, baseMs + options.deltaDays * 24 * 60 * 60 * 1000)
          ).toISOString()
        : targetState.endsAt

      updatedAdOverride = {
        ...updatedAdOverride,
        [mediumKey]: {
          enabled: nextEnabled,
          endsAt: nextEndsAt,
        },
      }
    }

    const nextOverridesMap = {
      ...localRunwayOverrides,
      [ad.id]: updatedAdOverride,
    }
    setLocalRunwayOverrides(nextOverridesMap)

    if (typeof window !== 'undefined') {
      localStorage.setItem(INDEPENDENT_RUNWAY_OVERRIDES_KEY, JSON.stringify(nextOverridesMap))
    }

    // Persistir también en listing.attrs en Supabase si la campaña tiene publicación asociada
    if (ad.listing_id && ad.listing) {
      const nextAttrs = {
        ...(ad.listing.attrs || {}),
        runway_independent_status: updatedAdOverride,
      }
      await supabase.from('listing').update({ attrs: nextAttrs }).eq('id', ad.listing_id)
    }

    const mediumLabels: Record<string, string> = {
      vitrina: '🏆 Gran Vitrina',
      pasarela: '✨ Pasarela de Publicaciones',
      proveedores: '🏪 Pasarela de Proveedores',
    }
    const label =
      mediumLabels[mediumKey] ||
      liveAdPageConfig.customRunways.find((r) => r.id === mediumKey)?.title ||
      'Pasarela'

    showToast(`Dato independiente actualizado en ${label}.`)
  }

  // Persistir configuración de pasarelas (incluyendo nuevas pasarelas por temporada o expansión)
  const persistLiveAdPageConfig = async (nextCfg: AdPageConfig, notifyText?: string) => {
    const clean = sanitizeAdPageConfig({
      ...nextCfg,
      updatedAt: new Date().toISOString(),
    })
    setLiveAdPageConfig(clean)
    if (typeof window !== 'undefined') {
      localStorage.setItem(AD_PAGE_CONFIG_STORAGE_KEY, JSON.stringify(clean))
      window.dispatchEvent(new CustomEvent('ad-page-config-updated', { detail: clean }))
    }
    try {
      const encodedSlot = encodeAdPageConfigToSlot(clean)
      await supabase.from('ad_slot').upsert([encodedSlot], { onConflict: 'id' })
    } catch {
      // Ignorar si tabla ad_slot no requiere actualización
    }
    if (notifyText) {
      showToast(notifyText)
    }
  }

  // Adicionar nueva pasarela y su clasificación / catálogo exclusivo (por temporada o por expansión de mercado)
  const handleAddDynamicRunway = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanTitle = newRunwayTitle.trim()
    if (!cleanTitle) return

    const id = `runway_${Date.now()}_${cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 20)}`

    const newRunway: DynamicRunwayConfig = {
      id,
      title: cleanTitle,
      subtitle:
        newRunwaySubtitle.trim() ||
        (newRunwayReason === 'season'
          ? 'Selección especial de temporada con catálogo exclusivo y servicios destacados'
          : 'Nueva pasarela y catálogo exclusivo habilitados por expansión de mercado'),
      badge:
        newRunwayBadge.trim() ||
        (newRunwayReason === 'season' ? '🎄 Temporada' : '🚀 Expansión de Mercado'),
      icon: newRunwayIcon.trim() || '🔥',
      reason: newRunwayReason,
      filterType: newRunwayFilterType,
      filterKeyword: newRunwayKeyword.trim(),
      maxItems: Math.max(1, Math.min(50, Number(newRunwayMaxItems) || 12)),
      defaultDurationDays: Math.max(1, Math.min(90, Number(newRunwayDurationDays) || 7)),
      scrollSpeed: liveAdPageConfig.runwayScrollSpeed || 0.65,
      active: true,
      accentColor: newRunwayAccent,
      assignedListingIds: [],
      hasExclusiveCatalog: newRunwayHasExclusiveCatalog,
      campaignCostCop: Math.max(0, Number(newRunwayCampaignCostCop) || 15000),
      authorizedSellerIds: [],
      allowAllPaidSellers: newRunwayAllowAllPaidSellers,
      createdAt: new Date().toISOString(),
      endsAt: new Date(
        Date.now() + (Number(newRunwayDurationDays) || 7) * 24 * 60 * 60 * 1000
      ).toISOString(),
    }

    const nextConfig: AdPageConfig = {
      ...liveAdPageConfig,
      customRunways: [...(liveAdPageConfig.customRunways || []), newRunway],
    }

    await persistLiveAdPageConfig(
      nextConfig,
      `¡Nueva clasificación y catálogo exclusivo "${cleanTitle}" ($${newRunway.campaignCostCop.toLocaleString('es-CO')} COP) adicionada exitosamente!`
    )
    setNewRunwayTitle('')
    setNewRunwaySubtitle('')
    setNewRunwayKeyword('')
    setShowAddRunwayForm(false)
    setAdMediumFilter(id)
  }

  const handleToggleDynamicRunway = async (runwayId: string) => {
    const nextRunways = (liveAdPageConfig.customRunways || []).map((r) =>
      r.id === runwayId ? { ...r, active: !r.active } : r
    )
    const target = nextRunways.find((r) => r.id === runwayId)
    await persistLiveAdPageConfig(
      { ...liveAdPageConfig, customRunways: nextRunways },
      `Pasarela / Catálogo "${target?.title}" ${target?.active ? 'activada en portada' : 'pausada'}.`
    )
  }

  const handleUpdateRunwayCostAndCatalog = async (
    runwayId: string,
    updates: Partial<DynamicRunwayConfig>,
    notifyMsg?: string
  ) => {
    const nextRunways = (liveAdPageConfig.customRunways || []).map((r) =>
      r.id === runwayId ? { ...r, ...updates } : r
    )
    await persistLiveAdPageConfig(
      { ...liveAdPageConfig, customRunways: nextRunways },
      notifyMsg || 'Configuración de pasarela y costo de catálogo exclusivo actualizada.'
    )
  }

  // Habilitar o deshabilitar a un vendedor específico en la lista de una pasarela / catálogo exclusivo según su pago
  const handleToggleSellerAuthorizationForRunway = async (runwayId: string, sellerId: string) => {
    const targetRunway = (liveAdPageConfig.customRunways || []).find((r) => r.id === runwayId)
    if (!targetRunway) return

    const currentAuthorized = new Set(targetRunway.authorizedSellerIds || [])
    const isNowAuthorized = !currentAuthorized.has(sellerId)
    if (isNowAuthorized) {
      currentAuthorized.add(sellerId)
    } else {
      currentAuthorized.delete(sellerId)
    }

    const sellerName = sellers.find((s) => s.id === sellerId)?.business_name || 'Vendedor'
    const nextRunways = (liveAdPageConfig.customRunways || []).map((r) =>
      r.id === runwayId ? { ...r, authorizedSellerIds: Array.from(currentAuthorized) } : r
    )

    await persistLiveAdPageConfig(
      { ...liveAdPageConfig, customRunways: nextRunways },
      isNowAuthorized
        ? `✓ Vendedor "${sellerName}" habilitado para clasificar artículos en "${targetRunway.title}".`
        : `Vendedor "${sellerName}" removido de la clasificación "${targetRunway.title}".`
    )
  }

  // Clasificar e identificar especialmente un artículo en una pasarela / catálogo exclusivo desde Admin
  const handleAssignListingSpecialClassification = async (listingId: string, runwayId: string) => {
    const targetListing = listings.find((l) => l.id === listingId)
    if (!targetListing) return

    const targetRunway = (liveAdPageConfig.customRunways || []).find((r) => r.id === runwayId)
    const nextAttrs: Record<string, any> = {
      ...(targetListing.attrs || {}),
    }

    if (!runwayId || runwayId === 'none' || !targetRunway) {
      delete nextAttrs.special_runway_id
      delete nextAttrs.special_runway_title
      delete nextAttrs.special_runway_badge
      delete nextAttrs.special_catalog_cost
    } else {
      nextAttrs.special_runway_id = targetRunway.id
      nextAttrs.special_runway_title = targetRunway.title
      nextAttrs.special_runway_badge = `${targetRunway.icon} ${targetRunway.badge}`
      nextAttrs.special_catalog_cost = targetRunway.campaignCostCop
    }

    try {
      await supabase.from('listing').update({ attrs: nextAttrs }).eq('id', listingId)
    } catch {
      // Continuar con estado en memoria y configuración
    }

    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, attrs: nextAttrs } : l))
    )
    setAdOrders((prev) =>
      prev.map((a) =>
        a.listing_id === listingId && a.listing
          ? { ...a, listing: { ...a.listing, attrs: nextAttrs } }
          : a
      )
    )

    // Sincronizar también en assignedListingIds y habilitar al vendedor en esa clasificación
    const nextRunways = (liveAdPageConfig.customRunways || []).map((r) => {
      const assigned = new Set(r.assignedListingIds || [])
      const authorized = new Set(r.authorizedSellerIds || [])
      if (r.id === runwayId) {
        assigned.add(listingId)
        if (targetListing.seller_id) {
          authorized.add(targetListing.seller_id)
        }
      } else {
        assigned.delete(listingId)
      }
      return {
        ...r,
        assignedListingIds: Array.from(assigned),
        authorizedSellerIds: Array.from(authorized),
      }
    })

    await persistLiveAdPageConfig(
      { ...liveAdPageConfig, customRunways: nextRunways },
      targetRunway
        ? `⭐ Artículo identificado en el Catálogo Exclusivo "${targetRunway.title}" y vendedor habilitado.`
        : 'Artículo devuelto a la clasificación de Catálogo General.'
    )
  }

  const handleDeleteDynamicRunway = async (runwayId: string) => {
    const target = (liveAdPageConfig.customRunways || []).find((r) => r.id === runwayId)
    const nextRunways = (liveAdPageConfig.customRunways || []).filter((r) => r.id !== runwayId)
    if (adMediumFilter === runwayId) {
      setAdMediumFilter('all')
    }
    await persistLiveAdPageConfig(
      { ...liveAdPageConfig, customRunways: nextRunways },
      `Pasarela "${target?.title || runwayId}" eliminada.`
    )
  }

  const handleConfirmRejectAd = async () => {
    if (!rejectingAd) return
    setProcessingId(rejectingAd.id)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('ad_order')
        .update({
          status: 'rejected',
          reject_reason: adRejectReason.trim() || 'No cumple con los lineamientos de publicidad',
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', rejectingAd.id)

      if (error) throw error

      setAdOrders((prev) =>
        prev.map((item) =>
          item.id === rejectingAd.id
            ? {
                ...item,
                status: 'rejected',
                reject_reason: adRejectReason.trim() || 'No cumple con los lineamientos de publicidad',
                reviewed_by: user?.id || null,
                reviewed_at: new Date().toISOString(),
              }
            : item
        )
      )

      showToast('Campaña publicitaria rechazada.')
      setRejectingAd(null)
      setAdRejectReason('')
    } catch (err: any) {
      showToast(err.message || 'Error al rechazar la campaña', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  // --- Balances filtering and calculations ---
  const filteredAccounts = adAccounts.filter((acc) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const matchSeller = acc.advertiser?.seller?.business_name?.toLowerCase().includes(q) || false
    const matchLegal = acc.advertiser?.legal_name?.toLowerCase().includes(q) || false
    const matchPhone = acc.advertiser?.seller?.phone?.toLowerCase().includes(q) || false
    const matchCity = acc.advertiser?.seller?.city?.toLowerCase().includes(q) || false
    const matchId = acc.id.toLowerCase().includes(q)
    return matchSeller || matchLegal || matchPhone || matchCity || matchId
  })

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const matchSeller = tx.ad_account?.advertiser?.seller?.business_name?.toLowerCase().includes(q) || false
    const matchRef = tx.ref_id?.toLowerCase().includes(q) || false
    const matchKind = tx.kind?.toLowerCase().includes(q)
    const matchType = tx.ref_type?.toLowerCase().includes(q) || false
    return matchSeller || matchRef || matchKind || matchType
  })

  const totalBalanceInCirculation = adAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0)

  // Recharge requests filtering
  const filteredRechargeRequests = rechargeRequests.filter((r) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const matchSeller = r.seller?.business_name?.toLowerCase().includes(q) || false
    const matchPkg = r.package?.name?.toLowerCase().includes(q) || false
    const matchRef = r.reference_code?.toLowerCase().includes(q) || false
    const matchMethod = r.payment_method?.toLowerCase().includes(q) || false
    const matchStatus = r.status.toLowerCase().includes(q)
    return matchSeller || matchPkg || matchRef || matchMethod || matchStatus
  })

  const pendingRechargesCount = rechargeRequests.filter((r) => r.status === 'pending').length

  // Handlers: Recharge Requests
  const handleApproveRechargeRequest = async (requestId: string) => {
    setProcessingRequestId(requestId)
    try {
      const req = rechargeRequests.find((r) => r.id === requestId)
      if (!req) return

      // Probar RPC atómico admin_approve_recharge_request
      const { data: rpcRes, error: rpcErr } = await supabase.rpc(
        'admin_approve_recharge_request',
        { p_request_id: requestId, p_admin_notes: null }
      )

      let newBalance = 0
      let txId: number | string = Date.now()

      if (!rpcErr && rpcRes && rpcRes.success) {
        newBalance = Number(rpcRes.balance_after)
        txId = rpcRes.transaction_id
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const { error: reqUpdErr } = await supabase
          .from('ad_recharge_request')
          .update({
            status: 'approved',
            approved_by: user?.id || null,
            approved_at: new Date().toISOString(),
          })
          .eq('id', requestId)
        if (reqUpdErr) throw reqUpdErr

        const { data: curAcc, error: curAccErr } = await supabase
          .from('ad_account')
          .select('balance')
          .eq('id', req.ad_account_id)
          .single()
        if (curAccErr) throw curAccErr

        newBalance = (curAcc.balance || 0) + req.amount

        const { error: accUpdErr } = await supabase
          .from('ad_account')
          .update({ balance: newBalance })
          .eq('id', req.ad_account_id)
        if (accUpdErr) throw accUpdErr

        const idempotencyKey = `recharge_req_${requestId}`
        const { data: insTx } = await supabase
          .from('wallet_transaction')
          .insert({
            ad_account_id: req.ad_account_id,
            kind: 'topup',
            amount: req.amount,
            balance_after: newBalance,
            ref_type: req.payment_method,
            ref_id: req.reference_code,
            idempotency_key: idempotencyKey,
          })
          .select('id')
          .single()
        if (insTx) txId = insTx.id
      }

      setRechargeRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: 'approved',
                approved_at: new Date().toISOString(),
              }
            : r
        )
      )

      setAdAccounts((prev) =>
        prev.map((a) =>
          a.id === req.ad_account_id ? { ...a, balance: newBalance } : a
        )
      )

      const updatedAcc = adAccounts.find((a) => a.id === req.ad_account_id)
      const newTxRecord: WalletTransactionWithRelations = {
        id: Number(txId) || Date.now(),
        ad_account_id: req.ad_account_id,
        kind: 'topup',
        amount: req.amount,
        balance_after: newBalance,
        ref_type: req.payment_method,
        ref_id: req.reference_code,
        idempotency_key: null,
        created_at: new Date().toISOString(),
        ad_account: updatedAcc,
      }
      setTransactions((prev) => [newTxRecord, ...prev])

      // Si el pago aprobado corresponde a una Pasarela de Temporada (sola o combinada), habilitar automáticamente al vendedor en esa pasarela
      const rechargeSeasonalMeta = extractSeasonalRunwayMeta({
        target_category: req.notes || null,
      })
      if (rechargeSeasonalMeta.specialRunwayId && req.seller_id) {
        const nextRunways = (liveAdPageConfig.customRunways || []).map((r) => {
          if (r.id !== rechargeSeasonalMeta.specialRunwayId) return r
          const authorized = new Set(r.authorizedSellerIds || [])
          authorized.add(req.seller_id)
          return {
            ...r,
            active: true,
            authorizedSellerIds: Array.from(authorized),
          }
        })
        await persistLiveAdPageConfig({
          ...liveAdPageConfig,
          customRunways: nextRunways,
        })
      }

      // Si la solicitud de recarga está vinculada a la reactivación de una campaña ([REACTIVAR_CAMPANA:<order_id>]), reactivarla automáticamente
      const reactivateMatch = (req.notes || '').match(/\[REACTIVAR_CAMPANA:([^\]]+)\]/)
      if (reactivateMatch?.[1]) {
        const targetOrderId = reactivateMatch[1].trim()
        const targetAd = adOrders.find((a) => a.id === targetOrderId)
        if (targetAd) {
          const orderCost = Number(targetAd.price_paid || req.amount || 0)
          if (newBalance >= orderCost && orderCost > 0) {
            const balanceAfterSpend = newBalance - orderCost
            await supabase
              .from('ad_account')
              .update({ balance: balanceAfterSpend })
              .eq('id', req.ad_account_id)

            await supabase.from('wallet_transaction').insert({
              ad_account_id: req.ad_account_id,
              kind: 'spend',
              amount: orderCost,
              balance_after: balanceAfterSpend,
              ref_type: 'campaign_reactivation',
              ref_id: targetOrderId,
            })

            setAdAccounts((prev) =>
              prev.map((a) =>
                a.id === req.ad_account_id ? { ...a, balance: balanceAfterSpend } : a
              )
            )
          }

          await handleApproveAd(targetOrderId)
          showToast(
            `✅ Pago validado ($${Number(req.amount).toLocaleString('es-CO')} COP) y campaña "${targetAd.headline}" reactivada automáticamente en vivo (live).`
          )
          return
        }
      }

      showToast(
        rechargeSeasonalMeta.specialRunwayId
          ? `Recarga aprobada ($${Number(req.amount).toLocaleString('es-CO')} COP) y vendedor habilitado en Pasarela de Temporada.`
          : `Recarga aprobada exitosamente. Se acreditaron $${Number(req.amount).toLocaleString('es-CO')} COP.`
      )
    } catch (err: any) {
      showToast(err.message || 'Error al aprobar la recarga', 'error')
    } finally {
      setProcessingRequestId(null)
    }
  }

  const handleConfirmRejectRechargeRequest = async () => {
    if (!rejectingRequest) return
    setProcessingRequestId(rejectingRequest.id)
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc(
        'admin_reject_recharge_request',
        {
          p_request_id: rejectingRequest.id,
          p_admin_notes: rejectRequestNotes.trim() || 'Comprobante no válido o pago no recibido',
        }
      )

      if (rpcErr || !rpcRes?.success) {
        const { data: { user } } = await supabase.auth.getUser()
        const { error: updErr } = await supabase
          .from('ad_recharge_request')
          .update({
            status: 'rejected',
            admin_notes: rejectRequestNotes.trim() || 'Comprobante no válido o pago no recibido',
            approved_by: user?.id || null,
            approved_at: new Date().toISOString(),
          })
          .eq('id', rejectingRequest.id)
        if (updErr) throw updErr
      }

      setRechargeRequests((prev) =>
        prev.map((r) =>
          r.id === rejectingRequest.id
            ? {
                ...r,
                status: 'rejected',
                admin_notes: rejectRequestNotes.trim() || 'Comprobante no válido o pago no recibido',
                approved_at: new Date().toISOString(),
              }
            : r
        )
      )

      showToast('Solicitud de recarga rechazada.')
      setRejectingRequest(null)
      setRejectRequestNotes('')
    } catch (err: any) {
      showToast(err.message || 'Error al rechazar solicitud', 'error')
    } finally {
      setProcessingRequestId(null)
    }
  }

  // Handlers: Balances
  const handleOpenTopupForAccount = (acc: AdAccountWithRelations) => {
    setSelectedAccountId(acc.id)
    setSelectedSellerId(acc.advertiser?.seller_id || '')
    setTopupAmount('')
    setTopupRefId('')
    setTopupNotes('')
    setTopupModalOpen(true)
  }

  const handleOpenNewTopup = () => {
    if (adAccounts.length > 0) {
      setSelectedAccountId(adAccounts[0].id)
      setSelectedSellerId('')
    } else if (sellers.length > 0) {
      setSelectedAccountId('')
      setSelectedSellerId(sellers[0].id)
    } else {
      setSelectedAccountId('')
      setSelectedSellerId('')
    }
    setTopupAmount('')
    setTopupRefId('')
    setTopupNotes('')
    setTopupModalOpen(true)
  }

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(topupAmount)
    if (!amount || amount <= 0) {
      showToast('Ingresa un monto válido mayor a 0', 'error')
      return
    }

    setIsToppingUp(true)
    try {
      let targetAccountId = selectedAccountId

      // Si seleccionó un vendedor que aún no tiene ad_account
      if (!targetAccountId && selectedSellerId) {
        const { data: createdAccId, error: rpcCreateErr } = await supabase.rpc(
          'admin_get_or_create_ad_account',
          { p_seller_id: selectedSellerId }
        )

        if (!rpcCreateErr && createdAccId) {
          targetAccountId = createdAccId
        } else {
          const selSeller = sellers.find((s) => s.id === selectedSellerId)
          let advId = ''
          const { data: exAdv } = await supabase
            .from('advertiser')
            .select('id')
            .eq('seller_id', selectedSellerId)
            .maybeSingle()

          if (exAdv) {
            advId = exAdv.id
          } else {
            const { data: newAdv, error: newAdvErr } = await supabase
              .from('advertiser')
              .insert({
                seller_id: selectedSellerId,
                legal_name: selSeller?.business_name || 'Anunciante',
                status: 'active',
              })
              .select('id')
              .single()
            if (newAdvErr) throw newAdvErr
            advId = newAdv.id
          }

          const { data: exAcc } = await supabase
            .from('ad_account')
            .select('id')
            .eq('advertiser_id', advId)
            .maybeSingle()

          if (exAcc) {
            targetAccountId = exAcc.id
          } else {
            const { data: newAcc, error: newAccErr } = await supabase
              .from('ad_account')
              .insert({
                advertiser_id: advId,
                balance: 0,
              })
              .select('id')
              .single()
            if (newAccErr) throw newAccErr
            targetAccountId = newAcc.id
          }
        }
      }

      if (!targetAccountId) {
        throw new Error('Selecciona una cuenta de anunciante o vendedor para acreditar.')
      }

      let newBalance = 0
      let txId: number | string = Date.now()

      // Intentar RPC atómico admin_topup_balance
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_topup_balance', {
        p_account_id: targetAccountId,
        p_amount: amount,
        p_ref_type: topupRefType,
        p_ref_id: topupRefId.trim() || null,
      })

      if (!rpcErr && rpcRes && rpcRes.success) {
        newBalance = Number(rpcRes.balance_after)
        txId = rpcRes.transaction_id
      } else {
        // Fallback directo con Supabase client
        const { data: curAcc, error: curAccErr } = await supabase
          .from('ad_account')
          .select('balance')
          .eq('id', targetAccountId)
          .single()
        if (curAccErr) throw curAccErr

        newBalance = (curAcc.balance || 0) + amount

        const { error: updErr } = await supabase
          .from('ad_account')
          .update({ balance: newBalance })
          .eq('id', targetAccountId)
        if (updErr) throw updErr

        const idempotencyKey = `topup_${targetAccountId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        const { data: insertedTx, error: txErr } = await supabase
          .from('wallet_transaction')
          .insert({
            ad_account_id: targetAccountId,
            kind: 'topup',
            amount: amount,
            balance_after: newBalance,
            ref_type: topupRefType,
            ref_id: topupRefId.trim() || null,
            idempotency_key: idempotencyKey,
          })
          .select('id')
          .single()

        if (txErr) console.warn('Aviso insertando wallet_transaction:', txErr.message)
        if (insertedTx) txId = insertedTx.id
      }

      // Actualizar estado reactivo local
      const targetSeller = sellers.find((s) => s.id === selectedSellerId)
      const existingAccountIndex = adAccounts.findIndex((a) => a.id === targetAccountId)

      let updatedAcc: AdAccountWithRelations

      if (existingAccountIndex >= 0) {
        const existing = adAccounts[existingAccountIndex]
        updatedAcc = { ...existing, balance: newBalance }
        setAdAccounts((prev) =>
          prev.map((a) => (a.id === targetAccountId ? updatedAcc : a))
        )
      } else {
        updatedAcc = {
          id: targetAccountId,
          advertiser_id: '',
          balance: newBalance,
          created_at: new Date().toISOString(),
          advertiser: {
            id: '',
            seller_id: selectedSellerId,
            legal_name: targetSeller?.business_name || 'Anunciante',
            status: 'active',
            created_at: new Date().toISOString(),
            seller: targetSeller || null,
          },
        }
        setAdAccounts((prev) => [updatedAcc, ...prev])
      }

      const newTx: WalletTransactionWithRelations = {
        id: Number(txId) || Date.now(),
        ad_account_id: targetAccountId,
        kind: 'topup',
        amount: amount,
        balance_after: newBalance,
        ref_type: topupRefType,
        ref_id: topupRefId.trim() || null,
        idempotency_key: null,
        created_at: new Date().toISOString(),
        ad_account: updatedAcc,
      }
      setTransactions((prev) => [newTx, ...prev])

      showToast(`¡Saldo de $${amount.toLocaleString('es-CO')} COP acreditado exitosamente!`)
      setTopupModalOpen(false)
      setTopupAmount('')
      setTopupRefId('')
      setTopupNotes('')
      setSelectedAccountId('')
      setSelectedSellerId('')
    } catch (err: any) {
      showToast(err.message || 'Error al acreditar saldo', 'error')
    } finally {
      setIsToppingUp(false)
    }
  }

  // --- Handlers: Gestión de Usuarios y Roles ---
  const handleUpdateUserRole = async (targetUser: any, newRole: 'buyer' | 'seller' | 'admin') => {
    if (targetUser.role === newRole) return
    setUpdatingUserId(targetUser.id)
    setRoleSuccessNotice(null)
    setRoleErrorNotice(null)

    try {
      // 1. Actualizar rol en public.app_user
      const { error: userErr } = await supabase
        .from('app_user')
        .update({ role: newRole })
        .eq('id', targetUser.id)

      if (userErr) throw userErr

      // 2. Si se promueve a vendedor y no tiene registro de seller, inicializar perfil comercial
      if (newRole === 'seller' && (!targetUser.seller || targetUser.seller.length === 0)) {
        const { data: newSeller, error: sellerErr } = await supabase
          .from('seller')
          .insert({
            owner_user_id: targetUser.id,
            business_name: targetUser.full_name ? `${targetUser.full_name} Negocio` : 'Nuevo Negocio',
            city: targetUser.city || 'Bogotá',
            phone: targetUser.phone || null,
            whatsapp: targetUser.phone || null,
            verified: true,
          })
          .select()
          .single()

        if (!sellerErr && newSeller) {
          const { data: newAdv } = await supabase
            .from('advertiser')
            .insert({
              seller_id: newSeller.id,
              legal_name: newSeller.business_name,
              status: 'active',
            })
            .select()
            .single()

          if (newAdv) {
            await supabase.from('ad_account').insert({
              advertiser_id: newAdv.id,
              balance: 50000,
            })
          }
        }
      }

      // 3. Actualizar estado local reactivo
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      )

      const successText =
        locale === 'en'
          ? `Role for ${targetUser.full_name || targetUser.id.slice(0, 8)} successfully updated to ${newRole.toUpperCase()}.`
          : `Rol de ${targetUser.full_name || targetUser.id.slice(0, 8)} actualizado exitosamente a ${newRole.toUpperCase()}.`

      setRoleSuccessNotice(successText)
      showToast(successText)
    } catch (err: any) {
      const errText = err.message || 'Error al actualizar rol'
      setRoleErrorNotice(errText)
      showToast(errText, 'error')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const sectionHeaderInfo = {
    listings: {
      icon: '📦',
      title: locale === 'en' ? 'Catalog Articles & Services Moderation' : 'Moderación de Artículos y Servicios (Catálogo)',
      subtitle:
        locale === 'en'
          ? 'Review, approve, or classify catalog products and services submitted by sellers.'
          : 'Revisión, aprobación y clasificación en el catálogo de artículos y servicios publicados por los vendedores.',
    },
    ads: {
      icon: '📢',
      title: locale === 'en' ? 'Sponsored Campaigns Moderation' : 'Moderación de Campañas Patrocinadas',
      subtitle:
        locale === 'en'
          ? 'Review and approve sponsored advertising campaigns in the catalog.'
          : 'Revisión y activación de campañas publicitarias patrocinadas.',
    },
    adpage: {
      icon: '⚙️',
      title:
        locale === 'en'
          ? 'Advertising Page, Runways & Exclusive Catalogs Control'
          : 'Administración de la Página de Publicidad, Pasarelas y Nuevos Catálogos',
      subtitle:
        locale === 'en'
          ? 'Create and manage advertising page runways, exclusive catalogs, campaign costs, enabled sellers, and display speeds.'
          : 'Crea y administra pasarelas en la página de publicidad, nuevos catálogos exclusivos, costos de campaña, vendedores habilitados y tiempos de exhibición.',
    },
    balances: {
      icon: '💳',
      title: locale === 'en' ? 'Wallets & Balance Recharges' : 'Gestión de Billeteras y Recargas',
      subtitle:
        locale === 'en'
          ? 'Approve payment receipts, manage advertiser accounts, and balance top-ups.'
          : 'Aprobación de comprobantes de pago, cuentas de anunciantes y recargas de saldo.',
    },
    users: {
      icon: '👥',
      title:
        locale === 'en'
          ? 'Users Administration, Suspensions, Blocks & Roles'
          : 'Administración de Usuarios, Bloqueos, Suspensiones y Roles',
      subtitle:
        locale === 'en'
          ? 'Control user accounts, suspend or block access, verify businesses, manage permissions and assign roles.'
          : 'Administra cuentas de usuario, suspende o bloquea accesos, verifica comercios, restringe permisos y asigna roles.',
    },
  }[section]

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-900/20'
              : 'bg-red-600 text-white shadow-red-900/20'
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>{sectionHeaderInfo.icon}</span>
            <span>{sectionHeaderInfo.title}</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {sectionHeaderInfo.subtitle}
          </p>
        </div>

        {/* Quick Search */}
        {section !== 'adpage' && section !== 'users' && (
          <div className="relative w-full sm:w-72">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.admin.searchPlaceholder}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}
      </div>

      {/* ---------------- SECTION: AD PAGE CONTROL WINDOW ---------------- */}
      {section === 'adpage' && (
        <AdPageAdminConfigWindow
          initialConfig={initialAdPageConfig}
          listings={listings}
          adOrders={adOrders}
          sellers={sellers}
          adAccounts={adAccounts}
          locale={locale}
          onNotify={showToast}
        />
      )}

      {/* ---------------- SECTION 1: LISTINGS ---------------- */}
      {section === 'listings' && (
        <div className="space-y-6">
          {/* Tabs for Listings */}
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
            {[
              {
                id: 'pending',
                label: 'Pendientes por Revisar',
                count: pendingListingsCount,
                color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
              },
              {
                id: 'published',
                label: 'Publicados',
                count: publishedListingsCount,
                color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
              },
              {
                id: 'rejected',
                label: 'Rechazados',
                count: rejectedListingsCount,
                color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
              },
              {
                id: 'draft',
                label: 'Borradores',
                count: draftListingsCount,
                color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
              },
              {
                id: 'all',
                label: 'Todos',
                count: listings.length,
                color: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200',
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
                      : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-900' : tab.color
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Barra de Control de Cantidad de Ítems y Modo de Visualización (Lista vs Cuadrícula) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              {filteredListings.length === 0
                ? '0 publicaciones en esta vista'
                : `Mostrando ${visibleListings.length} de ${filteredListings.length} publicaciones`}
            </span>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filtro por Catálogo Exclusivo / Clasificación de Pasarela */}
              <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 px-2.5 py-1 shadow-2xs">
                <label
                  htmlFor="admin-listings-classification-filter"
                  className="text-[11px] font-bold text-amber-800 dark:text-amber-300 whitespace-nowrap"
                >
                  ⭐ Catálogo Exclusivo:
                </label>
                <select
                  id="admin-listings-classification-filter"
                  value={listingClassificationFilter}
                  onChange={(e) => setListingClassificationFilter(e.target.value)}
                  className="rounded-lg bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800 px-2 py-1 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:border-amber-500 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option value="all">Todas las clasificaciones</option>
                  <option value="none">Solo Catálogo Estándar</option>
                  {(liveAdPageConfig.customRunways || []).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.icon} {r.title} (${r.campaignCostCop.toLocaleString('es-CO')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Cantidad de Ítems a Cargar (Mínimo 10 inicialmente) */}
              <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 px-2.5 py-1 shadow-2xs">
                <label
                  htmlFor="admin-listings-items-per-page"
                  className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 whitespace-nowrap"
                >
                  Cargar:
                </label>
                <select
                  id="admin-listings-items-per-page"
                  value={itemsPerPage}
                  onChange={(e) =>
                    handleChangeItemsPerPage(Number(e.target.value), filteredListings.length)
                  }
                  className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:border-emerald-500 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option value={10}>10 ítems</option>
                  <option value={15}>15 ítems</option>
                  <option value={20}>20 ítems</option>
                  <option value={30}>30 ítems</option>
                  <option value={50}>50 ítems</option>
                  <option value={0}>Todos ({filteredListings.length})</option>
                </select>
              </div>

              {/* Selector de Modo de Visualización (Lista vs Cuadrícula) */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-emerald-700 shadow-xs dark:bg-zinc-900 dark:text-emerald-400 ring-1 ring-zinc-200 dark:ring-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>☰</span>
                  <span>Lista</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-emerald-700 shadow-xs dark:bg-zinc-900 dark:text-emerald-400 ring-1 ring-zinc-200 dark:ring-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>⊞</span>
                  <span className="hidden sm:inline">Cuadrícula</span>
                </button>
              </div>
            </div>
          </div>

          {/* Listings List */}
          {filteredListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-4xl">{activeTab === 'pending' ? '🎉' : '🔍'}</span>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50">
                {activeTab === 'pending'
                  ? 'No hay publicaciones pendientes de revisión'
                  : 'No se encontraron publicaciones en esta sección'}
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                {activeTab === 'pending'
                  ? 'Todas las publicaciones enviadas han sido moderadas.'
                  : 'Prueba cambiando de pestaña o limpiando la barra de búsqueda.'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4' : 'space-y-3 sm:space-y-4'}>
              {visibleListings.map((listing) => {
                const primaryMedia = listing.listing_media?.sort((a, b) => a.position - b.position)[0]
                const isPending = pendingListingStatuses.includes(listing.status)
                const isProcessing = processingId === listing.id
                const freeTrial = getListingFreeTrialStatus(listing)
                const specialClassification = getListingSpecialClassification(
                  listing,
                  liveAdPageConfig.customRunways
                )

                return (
                  <div
                    key={listing.id}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5 shadow-sm transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 space-y-3"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-5">
                      <div className={`flex ${viewMode === 'grid' ? 'flex-col sm:flex-row' : 'flex-row'} items-start gap-3 sm:gap-4 min-w-0`}>
                        <div className={`relative ${viewMode === 'grid' ? 'w-full aspect-[4/3] sm:h-20 sm:w-24' : 'h-16 w-16 sm:h-20 sm:w-24'} shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700`}>
                          {primaryMedia ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={primaryMedia.url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">
                              {listing.type === 'service' ? '🛠️' : listing.type === 'article' ? '📦' : '🛍️'}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700 uppercase tracking-wider dark:bg-zinc-800 dark:text-zinc-300">
                              {listing.type}
                            </span>
                            {listing.category && (
                              <span className="rounded-md border border-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                                {listing.category.name}
                              </span>
                            )}
                            {specialClassification && (
                              <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 dark:bg-amber-950/70 dark:border-amber-700 dark:text-amber-200 flex items-center gap-1">
                                <span>{specialClassification.icon}</span>
                                <span>Catálogo Exclusivo: {specialClassification.title}</span>
                              </span>
                            )}
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                listing.status === 'published'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : isPending
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : listing.status === 'rejected'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                              }`}
                            >
                              {listing.status === 'published'
                                ? 'Publicado'
                                : isPending
                                ? 'En revisión'
                                : listing.status === 'rejected'
                                ? 'Rechazado'
                                : 'Borrador'}
                            </span>
                            {freeTrial.isFreeTrialActive ? (
                              <span className="rounded-md bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
                                🎁 Publicidad Gratis ({freeTrial.daysRemaining}d restantes de {FREE_INITIAL_AD_DAYS}d)
                              </span>
                            ) : (
                              <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/50 dark:border-purple-800 dark:text-purple-300">
                                ⏱️ 7 días gratis finalizados (Elegible Plan $10k / $20k / Combo $25k)
                              </span>
                            )}
                            {listing.city && (
                              <span className="text-[11px] text-zinc-500">📍 {listing.city}</span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 truncate">
                            {listing.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                            <span>
                              Vendedor:{' '}
                              <strong className="text-zinc-700 dark:text-zinc-300">
                                {listing.seller?.business_name || 'Negocio'}
                              </strong>
                            </span>
                            <span>
                              Precio:{' '}
                              <strong className="text-zinc-900 dark:text-zinc-100">
                                {listing.price !== null
                                  ? `$ ${listing.price.toLocaleString('es-CO')} ${listing.price_unit ? `/${listing.price_unit}` : ''}`
                                  : 'Cotización'}
                              </strong>
                            </span>
                            <span>
                              Fecha: {new Date(listing.created_at).toLocaleDateString('es-CO')}
                            </span>
                          </div>

                          {listing.status === 'rejected' && listing.reject_reason && (
                            <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                              <strong>Motivo de rechazo:</strong> {listing.reject_reason}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800 shrink-0">
                        <Link
                          href={`/catalogo/${listing.id}`}
                          className="rounded-xl border border-zinc-300 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                        >
                          Ver detalle ↗
                        </Link>

                        {listing.status !== 'published' && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleApproveListing(listing.id)}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                          >
                            <span>✓</span>
                            <span>{isProcessing ? 'Procesando...' : 'Aprobar (+7d Gratis)'}</span>
                          </button>
                        )}

                        {listing.status !== 'rejected' && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => {
                              setRejectingListing(listing)
                              setRejectReason('')
                            }}
                            className="flex items-center gap-1.5 rounded-xl border border-red-300 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                          >
                            <span>✕</span>
                            <span>Rechazar</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Barra de Identificación Especial en Catálogo Exclusivo y Pasarela Administrada */}
                    <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-extrabold text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                          <span>🏷️</span>
                          <span>Clasificación de Pasarela y Catálogo Exclusivo:</span>
                        </span>
                        <select
                          value={specialClassification?.id || 'none'}
                          onChange={(e) =>
                            handleAssignListingSpecialClassification(listing.id, e.target.value)
                          }
                          className="rounded-lg border border-amber-300 bg-amber-50/70 px-2.5 py-1 text-xs font-bold text-zinc-900 focus:border-amber-500 focus:outline-none dark:border-amber-800 dark:bg-zinc-800 dark:text-zinc-100 cursor-pointer"
                        >
                          <option value="none">📦 Catálogo General Estándar (Sin clasificación especial)</option>
                          {(liveAdPageConfig.customRunways || []).map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.icon} {r.title} — Costo Campaña: ${r.campaignCostCop.toLocaleString('es-CO')} COP
                            </option>
                          ))}
                        </select>
                      </div>

                      {specialClassification && (
                        <Link
                          href={`/catalogo?type=${listing.type}&exclusive_catalog=${specialClassification.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300"
                        >
                          <span>Ver en Catálogo Exclusivo</span>
                          <span>↗</span>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {filteredListings.length > visibleListings.length && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Mostrando {visibleListings.length} de {filteredListings.length} publicaciones
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleLimit((prev) =>
                      Math.min(
                        filteredListings.length,
                        prev + (itemsPerPage > 0 ? itemsPerPage : 10)
                      )
                    )
                  }
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  ➕ Cargar {Math.min(itemsPerPage > 0 ? itemsPerPage : 10, filteredListings.length - visibleListings.length)} más
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeItemsPerPage(0, filteredListings.length)}
                  className="rounded-xl border border-zinc-300 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Ver todos ({filteredListings.length})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- SECTION 2: AD ORDERS & ADVERTISING POLICIES CONFIG ---------------- */}
      {section === 'ads' && (
        <div className="space-y-6">
          {/* Panel Administrativo de Configuración de Políticas y Tarifas de Publicidad */}
          <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/60 p-5 shadow-xs dark:border-purple-900/60 dark:from-purple-950/30 dark:via-zinc-900 dark:to-zinc-900">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-purple-200/70 dark:border-purple-900/50">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-purple-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    Política Oficial Activa
                  </span>
                  <span className="rounded-lg bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-800 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300">
                    🏪 Todo Pago Incluye Publicación en Pasarela de Proveedores
                  </span>
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                    Administración de Campañas, Medios Independientes y Tarifas
                  </h3>
                </div>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Todo producto o servicio creado recibe <strong>{FREE_INITIAL_AD_DAYS} días iniciales de publicidad gratis ($0 COP)</strong>. Los planes pagos ($10.000, $20.000 y $25.000) <strong>incluyen siempre la publicación destacada del proveedor en la Pasarela de Proveedores</strong> y son administrables de forma independiente por medio:
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddRunwayForm((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  <span>➕</span>
                  <span>
                    {showAddRunwayForm
                      ? 'Cerrar Creador de Pasarela'
                      : 'Adicionar Pasarela (Temporada / Expansión)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSection('adpage')
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(
                        new CustomEvent('admin-section-change', { detail: 'adpage' })
                      )
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-purple-300 bg-white px-3.5 py-2 text-xs font-bold text-purple-800 shadow-2xs hover:bg-purple-50 dark:border-purple-800 dark:bg-zinc-800 dark:text-purple-200 transition-colors cursor-pointer"
                >
                  <span>⚙️</span>
                  <span>Controlar Capacidad y Pasarelas</span>
                </button>
                <button
                  type="button"
                  disabled={isSyncingPolicies}
                  onClick={handleSyncOfficialAdPackages}
                  className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-500 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <span>🔄</span>
                  <span>
                    {isSyncingPolicies
                      ? 'Sincronizando Tarifas...'
                      : 'Sincronizar Tarifas en BD'}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Regla 1: 7 Días Gratis */}
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 dark:border-emerald-800/70 dark:bg-emerald-950/30">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    1. Beneficio Inicial
                  </span>
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {FREE_INITIAL_AD_DAYS} Días
                  </span>
                </div>
                <div className="mt-1.5 text-base font-black text-emerald-700 dark:text-emerald-400">
                  GRATIS ($0 COP)
                </div>
                <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                  Se activa automáticamente al publicar cualquier producto o servicio nuevo, incluyendo presencia inicial del comercio.
                </p>
              </div>

              {/* Regla 2: Individual Pasarela */}
              <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    2. Plan Individual
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    7 Días
                  </span>
                </div>
                <div className="mt-1 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  ✨ Pasarela + 🏪 Pasarela Proveedores
                </div>
                <div className="text-base font-black text-zinc-900 dark:text-zinc-50">
                  $10.000 COP
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Exhibición en Pasarela de rubro + <strong className="text-indigo-600 dark:text-indigo-400">incluye publicación del proveedor en la Pasarela de Proveedores</strong>.
                </p>
              </div>

              {/* Regla 3: Individual Gran Vitrina */}
              <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    3. Plan Individual
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    7 Días
                  </span>
                </div>
                <div className="mt-1 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  🏆 Gran Vitrina + 🏪 Pasarela Proveedores
                </div>
                <div className="text-base font-black text-zinc-900 dark:text-zinc-50">
                  $20.000 COP
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Exposición en la Gran Vitrina superior + <strong className="text-indigo-600 dark:text-indigo-400">incluye publicación del proveedor en la Pasarela de Proveedores</strong>.
                </p>
              </div>

              {/* Regla 4: Combo las dos + Proveedor */}
              <div className="rounded-xl border-2 border-purple-500 bg-purple-50/60 p-3.5 dark:border-purple-500/80 dark:bg-purple-950/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                    4. Plan en Combo
                  </span>
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-zinc-950">
                    Ahorra $5.000
                  </span>
                </div>
                <div className="mt-1 text-xs font-bold text-purple-950 dark:text-purple-100">
                  🔥 Vitrina + Pasarela + 🏪 Proveedores
                </div>
                <div className="text-base font-black text-purple-700 dark:text-purple-300">
                  $25.000 COP
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-600 dark:text-zinc-300">
                  Presencia simultánea en Gran Vitrina + Pasarela de rubro + <strong className="text-purple-800 dark:text-purple-200">publicación destacada en Pasarela de Proveedores</strong>.
                </p>
              </div>
            </div>

            {/* Formulario Desplegable para Adicionar Nueva Pasarela (Por Temporada o Expansión de Mercado) */}
            {showAddRunwayForm && (
              <form
                onSubmit={handleAddDynamicRunway}
                className="mt-5 rounded-2xl border-2 border-emerald-300 bg-white p-5 shadow-md dark:border-emerald-800 dark:bg-zinc-900 space-y-4 animate-in fade-in duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      ➕ Expansión y Temporadas
                    </span>
                    <h4 className="mt-1 text-sm font-black text-zinc-900 dark:text-zinc-50">
                      Adicionar Nueva Pasarela Administrable (Por Temporada o Expansión de Mercado)
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Crea una nueva pasarela independiente que se integrará tanto en la portada como en los controles individuales de cada campaña.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nombre de la Nueva Pasarela *
                    </label>
                    <input
                      type="text"
                      required
                      value={newRunwayTitle}
                      onChange={(e) => setNewRunwayTitle(e.target.value)}
                      placeholder="Ej. Especial de Temporada Navideña / Expansión: Agro e Industria"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Motivo de Apertura *
                    </label>
                    <select
                      value={newRunwayReason}
                      onChange={(e) => {
                        const val = e.target.value as DynamicRunwayReason
                        setNewRunwayReason(val)
                        if (val === 'season') {
                          setNewRunwayBadge('🎄 Especial de Temporada')
                          setNewRunwayIcon('🎄')
                        } else if (val === 'market_expansion') {
                          setNewRunwayBadge('🚀 Expansión de Mercado')
                          setNewRunwayIcon('🚀')
                        } else {
                          setNewRunwayBadge('⭐ Pasarela Especial')
                          setNewRunwayIcon('⭐')
                        }
                      }}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="season">📅 Por Temporada Comercial</option>
                      <option value="market_expansion">🚀 Por Expansión de Mercado / Nuevo Rubro</option>
                      <option value="special">⭐ Campaña / Evento Especial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Etiqueta / Insignia (Badge)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newRunwayIcon}
                        onChange={(e) => setNewRunwayIcon(e.target.value)}
                        className="w-11 rounded-xl border border-zinc-300 bg-white px-2 py-2 text-center text-xs dark:border-zinc-700 dark:bg-zinc-800"
                        title="Ícono"
                      />
                      <input
                        type="text"
                        value={newRunwayBadge}
                        onChange={(e) => setNewRunwayBadge(e.target.value)}
                        placeholder="Ej. 🔥 Temporada"
                        className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Descripción / Subtítulo de la Pasarela
                    </label>
                    <input
                      type="text"
                      value={newRunwaySubtitle}
                      onChange={(e) => setNewRunwaySubtitle(e.target.value)}
                      placeholder="Ej. Oportunidades seleccionadas para la temporada o nuevo sector en crecimiento"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Criterio de Contenido
                    </label>
                    <select
                      value={newRunwayFilterType}
                      onChange={(e) => setNewRunwayFilterType(e.target.value as any)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="all">Publicaciones Asignadas + Destacadas</option>
                      <option value="service">Solo Servicios Profesionales</option>
                      <option value="article">Solo Artículos Usados</option>
                      <option value="product">Solo Productos Nuevos</option>
                      <option value="keyword">Filtrar por Palabra Clave / Rubro</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Cupo Máx.
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={newRunwayMaxItems}
                        onChange={(e) => setNewRunwayMaxItems(Number(e.target.value) || 12)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-2 text-xs font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Vigencia (Días)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={newRunwayDurationDays}
                        onChange={(e) => setNewRunwayDurationDays(Number(e.target.value) || 7)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-2 text-xs font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloque de Costo Adicional del Nuevo Catálogo Exclusivo y Habilitación de Vendedores */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/20 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs items-center">
                  <div>
                    <label className="block font-extrabold text-amber-900 dark:text-amber-300 mb-1">
                      💰 Costo de Campaña / Nuevo Catálogo Exclusivo (COP) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={newRunwayCampaignCostCop}
                      onChange={(e) => setNewRunwayCampaignCostCop(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-black text-zinc-900 dark:border-amber-800 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <span className="mt-1 block text-[10px] text-amber-800 dark:text-amber-400">
                      Costo adicional que acarrea la creación y uso de este catálogo exclusivo.
                    </span>
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRunwayHasExclusiveCatalog}
                      onChange={(e) => setNewRunwayHasExclusiveCatalog(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600"
                    />
                    <span>
                      <strong className="block text-zinc-900 dark:text-zinc-100">
                        ⭐ Habilitar en Lista de Clasificación y Catálogo Exclusivo
                      </strong>
                      <span className="text-[11px] text-zinc-500">
                        Aparecerá en la lista al crear/editar artículos y tendrá vista de catálogo propio.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRunwayAllowAllPaidSellers}
                      onChange={(e) => setNewRunwayAllowAllPaidSellers(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600"
                    />
                    <span>
                      <strong className="block text-zinc-900 dark:text-zinc-100">
                        ✓ Habilitar automáticamente según pago realizado
                      </strong>
                      <span className="text-[11px] text-zinc-500">
                        Habilita automáticamente al vendedor cuyo pago/saldo cubra el costo (${newRunwayCampaignCostCop.toLocaleString('es-CO')} COP).
                      </span>
                    </span>
                  </label>
                </div>

                {newRunwayFilterType === 'keyword' && (
                  <div className="text-xs">
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Palabra Clave o Categoría del Rubro en Expansión / Temporada *
                    </label>
                    <input
                      type="text"
                      value={newRunwayKeyword}
                      onChange={(e) => setNewRunwayKeyword(e.target.value)}
                      placeholder="Ej. tecnología, navidad, gastronomía, mascotas, maquinaria..."
                      className="w-full sm:w-96 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowAddRunwayForm(false)}
                    className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-500 transition-colors cursor-pointer"
                  >
                    ✓ Crear Clasificación, Catálogo Exclusivo y Pasarela
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ======================================================================== */}
          {/* SELECTOR Y VISTA INDEPENDIENTE POR CADA MEDIO (VITRINA, PASARELA,        */}
          {/* PASARELA DE PROVEEDORES Y PASARELAS ADICIONALES DE TEMPORADA/EXPANSIÓN)  */}
          {/* ======================================================================== */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                  <span>📡</span>
                  <span>Visualización y Administración Independiente por Medio / Pasarela</span>
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Selecciona un medio para filtrar sus publicaciones activas, ver su cupo independiente y administrar el tiempo restante en cada pasarela por separado.
                </p>
              </div>
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400">
                Medio seleccionado:{' '}
                <strong>
                  {adMediumFilter === 'all'
                    ? '🌐 Todos los Medios'
                    : adMediumFilter === 'vitrina'
                    ? '🏆 Gran Vitrina Principal'
                    : adMediumFilter === 'pasarela'
                    ? '✨ Pasarela de Publicaciones'
                    : adMediumFilter === 'proveedores'
                    ? '🏪 Pasarela de Proveedores'
                    : liveAdPageConfig.customRunways.find((r) => r.id === adMediumFilter)?.title ||
                      'Pasarela Adicional'}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Medio 0: Todos */}
              <button
                type="button"
                onClick={() => setAdMediumFilter('all')}
                className={`text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                  adMediumFilter === 'all'
                    ? 'border-2 border-zinc-900 bg-zinc-900/5 dark:border-white dark:bg-white/10 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                    🌐 Todos los Medios
                  </span>
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-black text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                    {adOrders.length} órdenes
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Vista consolidada de todas las campañas con sus tiempos por medio.
                </p>
              </button>

              {/* Medio 1: Gran Vitrina */}
              <button
                type="button"
                onClick={() => setAdMediumFilter('vitrina')}
                className={`text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                  adMediumFilter === 'vitrina'
                    ? 'border-2 border-purple-600 bg-purple-50/70 dark:border-purple-500 dark:bg-purple-950/30 shadow-xs'
                    : 'border-zinc-200 hover:border-purple-300 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-purple-900 dark:text-purple-200">
                    🏆 1. Gran Vitrina
                  </span>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-black text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {vitrinaAdsCount} / {liveAdPageConfig.maxHeroItems} cupos
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Dato independiente de publicaciones en el recuadro estático superior.
                </p>
              </button>

              {/* Medio 2: Pasarela de Publicaciones */}
              <button
                type="button"
                onClick={() => setAdMediumFilter('pasarela')}
                className={`text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                  adMediumFilter === 'pasarela'
                    ? 'border-2 border-blue-600 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/30 shadow-xs'
                    : 'border-zinc-200 hover:border-blue-300 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-900 dark:text-blue-200">
                    ✨ 2. Pasarela Rubros
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {pasarelaAdsCount} activas
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Dato independiente en carruseles de Servicios ({liveAdPageConfig.maxServicesItems}), Usados ({liveAdPageConfig.maxArticlesItems}) y Nuevos ({liveAdPageConfig.maxProductsItems}).
                </p>
              </button>

              {/* Medio 3: Pasarela de Proveedores */}
              <button
                type="button"
                onClick={() => setAdMediumFilter('proveedores')}
                className={`text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                  adMediumFilter === 'proveedores'
                    ? 'border-2 border-indigo-600 bg-indigo-50/70 dark:border-indigo-500 dark:bg-indigo-950/30 shadow-xs'
                    : 'border-zinc-200 hover:border-indigo-300 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200">
                    🏪 3. Pasarela Proveedores
                  </span>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    {proveedoresAdsCount} / {liveAdPageConfig.maxMerchantsItems} cupos
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Dato independiente de comercios/proveedores (incluido con el pago del plan).
                </p>
              </button>
            </div>

            {/* Pasarelas Adicionales y Lista de Clasificaciones para Catálogos Exclusivos (Temporada o Expansión de Mercado) */}
            {liveAdPageConfig.customRunways && liveAdPageConfig.customRunways.length > 0 && (
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      🔥 Lista Administrada de Clasificaciones de Pasarela y Catálogos Exclusivos
                    </span>
                    <p className="text-[10px] text-zinc-500">
                      Cada clasificación crea un Catálogo Exclusivo con su costo de campaña y habilitación de vendedores según el pago realizado.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddRunwayForm(true)}
                    className="text-[11px] font-bold text-emerald-600 hover:underline dark:text-emerald-400 cursor-pointer"
                  >
                    + Adicionar otra pasarela / catálogo exclusivo
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {liveAdPageConfig.customRunways.map((customR) => {
                    const isSelected = adMediumFilter === customR.id
                    const assignedCount = adOrders.filter((a) => {
                      const st = getAdIndependentStates(a)
                      return (
                        customR.assignedListingIds?.includes(a.listing_id || '') ||
                        st.customRunways[customR.id]?.enabled
                      )
                    }).length
                    const classifiedListingsCount = listings.filter(
                      (l) =>
                        getListingSpecialClassification(l, liveAdPageConfig.customRunways)?.id ===
                        customR.id
                    ).length
                    const authorizedSellersCount = (customR.authorizedSellerIds || []).length
                    const isManagingSellers = managingSellersForRunwayId === customR.id

                    return (
                      <div
                        key={customR.id}
                        className={`rounded-xl border p-3.5 transition-all flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? 'border-2 border-emerald-600 bg-emerald-50/60 dark:border-emerald-500 dark:bg-emerald-950/30'
                            : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setAdMediumFilter(customR.id)}
                              className="text-left text-xs font-extrabold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer flex items-center gap-1.5"
                            >
                              <span>{customR.icon}</span>
                              <span className="line-clamp-1">{customR.title}</span>
                            </button>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                                  customR.reason === 'season'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                }`}
                              >
                                {customR.reason === 'season' ? 'Temporada' : 'Expansión'}
                              </span>
                              <Link
                                href={`/catalogo?type=product&exclusive_catalog=${customR.id}`}
                                className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300"
                              >
                                ⭐ Catálogo Exclusivo ({classifiedListingsCount}) ↗
                              </Link>
                            </div>
                          </div>
                          <p className="mt-0.5 text-[10px] text-zinc-500 line-clamp-1">
                            {customR.subtitle}
                          </p>
                        </div>

                        {/* Costo Adicional Establecido en Administración y Habilitación de Vendedores */}
                        <div className="rounded-lg border border-amber-200/80 bg-white/90 p-2.5 dark:border-amber-900/50 dark:bg-zinc-900/80 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-amber-900 dark:text-amber-300">
                              💰 Costo Campaña Catálogo:
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-zinc-500">$</span>
                              <input
                                type="number"
                                min={0}
                                step={1000}
                                value={customR.campaignCostCop ?? 15000}
                                onChange={(e) =>
                                  handleUpdateRunwayCostAndCatalog(
                                    customR.id,
                                    { campaignCostCop: Math.max(0, Number(e.target.value) || 0) }
                                  )
                                }
                                className="w-20 rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-black text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                              />
                              <span className="font-bold text-zinc-500">COP</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setManagingSellersForRunwayId(
                                  isManagingSellers ? null : customR.id
                                )
                              }
                              className="rounded-lg bg-purple-100 px-2 py-1 text-[10px] font-extrabold text-purple-900 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-200 cursor-pointer"
                            >
                              👥 Vendedores Habilitados ({authorizedSellersCount}) {isManagingSellers ? '▲' : '▼'}
                            </button>
                          </div>
                        </div>

                        {/* Panel Desplegable para Administrar y Habilitar Vendedores según Pago Realizado */}
                        {isManagingSellers && (
                          <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-2.5 dark:border-purple-900/60 dark:bg-purple-950/20 space-y-2 text-[10px]">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-extrabold text-purple-900 dark:text-purple-200">
                                Habilitar vendedores para usar la clasificación &quot;{customR.title}&quot; según su pago:
                              </span>
                              <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-emerald-800 dark:text-emerald-300">
                                <input
                                  type="checkbox"
                                  checked={Boolean(customR.allowAllPaidSellers)}
                                  onChange={(e) =>
                                    handleUpdateRunwayCostAndCatalog(
                                      customR.id,
                                      { allowAllPaidSellers: e.target.checked },
                                      e.target.checked
                                        ? 'Auto-habilitación por saldo/pago activada.'
                                        : 'Solo vendedores habilitados manualmente podrán usar esta lista.'
                                    )
                                  }
                                  className="h-3.5 w-3.5 rounded text-emerald-600"
                                />
                                <span>Auto-habilitar si saldo/pago &ge; ${(customR.campaignCostCop || 15000).toLocaleString('es-CO')}</span>
                              </label>
                            </div>

                            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                              {sellers.map((s) => {
                                const isAuth = (customR.authorizedSellerIds || []).includes(s.id)
                                const sellerAcc = adAccounts.find(
                                  (acc) => acc.advertiser?.seller_id === s.id
                                )
                                const sellerBalance = Number(sellerAcc?.balance || 0)
                                const hasPaidOrder = adOrders.some(
                                  (o) =>
                                    o.listing?.seller_id === s.id &&
                                    (o.status === 'live' || o.status === 'approved') &&
                                    Number(o.price_paid || 0) > 0
                                )

                                return (
                                  <div
                                    key={s.id}
                                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800"
                                  >
                                    <div className="min-w-0">
                                      <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate block">
                                        🏪 {s.business_name} ({s.city || 'Colombia'})
                                      </span>
                                      <span className="text-[9px] text-zinc-500">
                                        Saldo aprobado: <strong>${sellerBalance.toLocaleString('es-CO')} COP</strong>{' '}
                                        {hasPaidOrder ? '• ✓ Con campaña pagada' : ''}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleSellerAuthorizationForRunway(customR.id, s.id)
                                      }
                                      className={`shrink-0 rounded-lg px-2.5 py-1 font-extrabold cursor-pointer ${
                                        isAuth
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-zinc-200 text-zinc-800 hover:bg-emerald-100 dark:bg-zinc-800 dark:text-zinc-200'
                                      }`}
                                    >
                                      {isAuth ? '✓ Habilitado en Lista' : '+ Habilitar por Pago'}
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between gap-2 text-[10px]">
                          <span className="font-bold text-zinc-600 dark:text-zinc-300">
                            📊 {assignedCount} / {customR.maxItems} cupos • ⏱️ {customR.defaultDurationDays}d
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleDynamicRunway(customR.id)}
                              className={`rounded-lg px-2 py-0.5 font-extrabold cursor-pointer ${
                                customR.active
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              {customR.active ? 'Activa en Portada' : 'Oculta'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDynamicRunway(customR.id)}
                              title="Eliminar pasarela"
                              className="rounded-lg px-1.5 py-0.5 text-zinc-400 hover:bg-red-100 hover:text-red-600 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Tabs for Ads Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              {[
                {
                  id: 'all',
                  label: 'Todas las Campañas',
                  count: adOrders.length,
                  color: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200',
                },
                {
                  id: 'pending',
                  label: 'Pendientes de Aprobación (submitted)',
                  count: pendingAdsCount,
                  color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
                },
                {
                  id: 'live',
                  label: 'Activas / En Vivo (live)',
                  count: liveAdsCount,
                  color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
                },
                {
                  id: 'ended',
                  label: 'Finalizadas / Historial para Reactivar',
                  count: endedAdsCount,
                  color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
                },
                {
                  id: 'rejected',
                  label: 'Rechazadas',
                  count: rejectedAdsCount,
                  color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
                },
              ].map((tab) => {
                const isActive = adActiveTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAdActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : tab.color
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Mostrando {visibleAds.length} de {filteredAds.length}
              </span>

              {/* Selector de Cantidad de Ítems a Cargar (Mínimo 10 inicialmente) */}
              <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 px-2.5 py-1 shadow-2xs">
                <label
                  htmlFor="admin-ads-items-per-page"
                  className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 whitespace-nowrap"
                >
                  Cargar:
                </label>
                <select
                  id="admin-ads-items-per-page"
                  value={itemsPerPage}
                  onChange={(e) =>
                    handleChangeItemsPerPage(Number(e.target.value), filteredAds.length)
                  }
                  className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:border-purple-500 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option value={10}>10 ítems</option>
                  <option value={15}>15 ítems</option>
                  <option value={20}>20 ítems</option>
                  <option value={30}>30 ítems</option>
                  <option value={50}>50 ítems</option>
                  <option value={0}>Todos ({filteredAds.length})</option>
                </select>
              </div>

              {/* Selector de Modo de Visualización (Lista vs Cuadrícula) */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-purple-700 shadow-xs dark:bg-zinc-900 dark:text-purple-400 ring-1 ring-zinc-200 dark:ring-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>☰</span>
                  <span>Lista</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-purple-700 shadow-xs dark:bg-zinc-900 dark:text-purple-400 ring-1 ring-zinc-200 dark:ring-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>⊞</span>
                  <span className="hidden sm:inline">Cuadrícula</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ads List with Remaining Time & Independent Per-Runway Controls */}
          {filteredAds.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-4xl">{adActiveTab === 'pending' ? '🚀' : '🔍'}</span>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50">
                {adActiveTab === 'pending'
                  ? 'No hay campañas publicitarias pendientes de revisión'
                  : 'No se encontraron campañas en el medio o filtro seleccionado'}
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                {adMediumFilter !== 'all'
                  ? 'Puedes cambiar a "Todos los Medios" para activar o asignar publicaciones a esta pasarela.'
                  : 'Prueba cambiando de pestaña o limpiando la búsqueda.'}
              </p>
              {adMediumFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setAdMediumFilter('all')}
                  className="mt-4 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 cursor-pointer"
                >
                  Ver todas las campañas para asignar a este medio
                </button>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
              {visibleAds.map((ad) => {
                const isPending = pendingAdStatuses.includes(ad.status)
                const isProcessing = processingId === ad.id
                const resolvedPlacement = resolveAdOrderPlacement(ad)
                const placementType = resolvedPlacement.placement
                const timeStatus = getAdOrderTimeStatus(ad)
                const mediumStates = getAdIndependentStates(ad)
                const sellerName = ad.listing?.seller?.business_name || 'Proveedor Verificado'
                const specialClassification = getListingSpecialClassification(
                  ad.listing,
                  liveAdPageConfig.customRunways
                )
                const pendingReactivationRecharge = rechargeRequests.find(
                  (r) =>
                    r.status === 'pending' &&
                    typeof r.notes === 'string' &&
                    r.notes.includes(`[REACTIVAR_CAMPANA:${ad.id}]`)
                )

                return (
                  <div
                    key={ad.id}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex flex-col sm:flex-row items-start gap-3.5 min-w-0 flex-1">
                        <div className="relative h-20 w-28 sm:h-24 sm:w-36 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                          {ad.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ad.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">
                              📢
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300 uppercase tracking-wider">
                              {ad.package?.name || resolvedPlacement.planLabelEs}
                            </span>
                            <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300">
                              {placementType === 'combo'
                                ? '🔥 Plan Combo: Gran Vitrina + Pasarela + Pasarela Proveedores'
                                : placementType === 'gran_vitrina'
                                ? '🏆 Plan Gran Vitrina + Pasarela Proveedores ($20.000)'
                                : '✨ Plan Pasarela + Pasarela Proveedores ($10.000)'}
                            </span>
                            {specialClassification && (
                              <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 dark:bg-amber-950/70 dark:border-amber-700 dark:text-amber-200 flex items-center gap-1">
                                <span>{specialClassification.icon}</span>
                                <span>Catálogo Exclusivo: {specialClassification.title} (${specialClassification.campaignCostCop.toLocaleString('es-CO')})</span>
                              </span>
                            )}
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                ad.status === 'live' || ad.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : isPending
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : ad.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                              }`}
                            >
                              {ad.status === 'live'
                                ? '● En vivo (live)'
                                : isPending
                                ? '⏳ En revisión'
                                : ad.status === 'rejected'
                                ? '✕ Rechazado'
                                : ad.status}
                            </span>
                            {pendingReactivationRecharge && (
                              <span className="rounded-md bg-amber-50 border border-amber-300 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-200">
                                🧾 Comprobante de reactivación pendiente (${Number(pendingReactivationRecharge.amount).toLocaleString('es-CO')} COP)
                              </span>
                            )}
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                              ${Number(ad.price_paid).toLocaleString('es-CO')} COP (Incluye Proveedor en Pasarela)
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 truncate">
                            {ad.headline}
                          </h3>

                          {ad.body && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1">
                              {ad.body}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                            {ad.listing && (
                              <span>
                                📦 Publicación:{' '}
                                <Link
                                  href={`/catalogo/${ad.listing.id}`}
                                  className="underline font-bold text-purple-600 dark:text-purple-400"
                                >
                                  {ad.listing.title}
                                </Link>
                              </span>
                            )}
                            {ad.listing && (
                              <span className="inline-flex items-center gap-1">
                                <span>🏷️ Clasificación:</span>
                                <select
                                  value={specialClassification?.id || 'none'}
                                  onChange={(e) =>
                                    handleAssignListingSpecialClassification(
                                      ad.listing!.id,
                                      e.target.value
                                    )
                                  }
                                  className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-900 dark:border-amber-800 dark:bg-zinc-800 dark:text-amber-300 cursor-pointer"
                                >
                                  <option value="none">Catálogo General</option>
                                  {(liveAdPageConfig.customRunways || []).map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.icon} {r.title} (${r.campaignCostCop.toLocaleString('es-CO')})
                                    </option>
                                  ))}
                                </select>
                              </span>
                            )}
                            <span>
                              🏪 Proveedor:{' '}
                              <strong className="text-zinc-800 dark:text-zinc-200">
                                {sellerName}
                              </strong>
                            </span>
                            {(ad.target_city || ad.target_category) && (
                              <span>
                                📍 Segmentación:{' '}
                                {[ad.target_city, ad.target_category].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>

                          {ad.status === 'rejected' && ad.reject_reason && (
                            <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                              <strong>Motivo de rechazo:</strong> {ad.reject_reason}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bloque Derecho: Reloj de Tiempo Restante Global + Acciones Aprobar/Rechazar/Reactivar */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-zinc-100 dark:border-zinc-800">
                        {/* Reloj de Tiempo Restante de la Publicación */}
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50/90 px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/60 min-w-[230px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
                              ⏱️ Tiempo Restante Publicación
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                isPending
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : timeStatus.isExpired
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {isPending
                                ? `${timeStatus.daysRemaining}d listos al aprobar`
                                : timeStatus.isExpired
                                ? 'Finalizado (0d 0h)'
                                : `⏳ ${timeStatus.daysRemaining}d ${timeStatus.hoursRemaining}h restantes`}
                            </span>
                          </div>

                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                            <div
                              className={`h-full rounded-full transition-all ${
                                timeStatus.isExpired
                                  ? 'bg-red-500'
                                  : isPending
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{
                                width: `${
                                  isPending
                                    ? 100
                                    : Math.max(8, 100 - timeStatus.progressPercent)
                                }%`,
                              }}
                            />
                          </div>

                          <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-zinc-500">
                            <span>
                              Vence: <strong>{new Date(timeStatus.endsAt).toLocaleDateString('es-CO')}</strong>
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleAdjustAdOrderTime(ad.id, -1)}
                                className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
                                title="Restar 1 día"
                              >
                                -1d
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleAdjustAdOrderTime(ad.id, 1)}
                                className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
                                title="Sumar 1 día"
                              >
                                +1d
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleAdjustAdOrderTime(ad.id, 7)}
                                className="rounded bg-purple-600 px-1.5 py-0.5 font-bold text-white hover:bg-purple-500 cursor-pointer"
                                title="Extender +7 días"
                              >
                                +7d
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleOpenAdminReactivateModal(ad)}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            <span>🔄</span>
                            <span>
                              {timeStatus.isExpired || ad.status === 'ended' || ad.status === 'rejected'
                                ? 'Reactivar y Validar Pago'
                                : 'Reconfigurar / Renovar'}
                            </span>
                          </button>

                          {ad.status !== 'live' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApproveAd(ad.id)}
                              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              <span>🚀</span>
                              <span>{isProcessing ? 'Procesando...' : 'Aprobar y Activar (Live)'}</span>
                            </button>
                          )}

                          {ad.status !== 'rejected' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => {
                                setRejectingAd(ad)
                                setAdRejectReason('')
                              }}
                              className="flex items-center gap-1.5 rounded-xl border border-red-300 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            >
                              <span>✕</span>
                              <span>Rechazar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ==================================================================== */}
                    {/* PANEL DE DATO INDEPENDIENTE Y ADMINISTRABLE POR CADA PASARELA        */}
                    {/* (1. Gran Vitrina | 2. Pasarela Rubro | 3. Pasarela de Proveedores)   */}
                    {/* ==================================================================== */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                          🎛️ Estado y Tiempo Restante Independiente por cada Pasarela (Administrable Individualmente)
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Ajusta días o activa/pausa cada medio de manera independiente
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {/* 1. Dato Independiente: Gran Vitrina */}
                        <div
                          className={`rounded-xl border p-3 text-xs transition-all ${
                            mediumStates.vitrina.enabled
                              ? 'border-purple-200 bg-purple-50/50 dark:border-purple-900/60 dark:bg-purple-950/20'
                              : 'border-zinc-200 bg-zinc-50/60 opacity-75 dark:border-zinc-800 dark:bg-zinc-800/30'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <span>🏆</span>
                              <span>1. Gran Vitrina</span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateIndependentMedium(ad, 'vitrina', { toggle: true })
                              }
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold cursor-pointer ${
                                mediumStates.vitrina.enabled
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              {mediumStates.vitrina.enabled ? '✓ Activa' : 'Pausada'}
                            </button>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Tiempo restante:{' '}
                              <strong className="text-purple-700 dark:text-purple-300">
                                {mediumStates.vitrina.enabled
                                  ? `${mediumStates.vitrina.daysRemaining}d ${mediumStates.vitrina.hoursRemaining}h`
                                  : '0d (Inactiva)'}
                              </strong>
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateIndependentMedium(ad, 'vitrina', { deltaDays: -1 })
                                }
                                className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-bold hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
                              >
                                -1d
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateIndependentMedium(ad, 'vitrina', { deltaDays: 1 })
                                }
                                className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-bold hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
                              >
                                +1d
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateIndependentMedium(ad, 'vitrina', { deltaDays: 7 })
                                }
                                className="rounded bg-purple-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-purple-500 cursor-pointer"
                              >
                                +7d
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 2. Dato Independiente: Pasarela de Publicaciones */}
                        <div
                          className={`rounded-xl border p-3 text-xs transition-all ${
                            mediumStates.pasarela.enabled
                              ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/20'
                              : 'border-zinc-200 bg-zinc-50/60 opacity-75 dark:border-zinc-800 dark:bg-zinc-800/30'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <span>✨</span>
                              <span>2. Pasarela Publicación</span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateIndependentMedium(ad, 'pasarela', { toggle: true })
                              }
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold cursor-pointer ${
                                mediumStates.pasarela.enabled
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              {mediumStates.pasarela.enabled ? '✓ Activa' : 'Pausada'}
                            </button>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Tiempo restante:{' '}
                              <strong className="text-blue-700 dark:text-blue-300">
                                {mediumStates.pasarela.enabled
                                  ? `${mediumStates.pasarela.daysRemaining}d ${mediumStates.pasarela.hoursRemaining}h`
                                  : '0d (Inactiva)'}
                              </strong>
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateIndependentMedium(ad, 'pasarela', { deltaDays: -1 })
                                }
                                className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-bold hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
                              >
                                -1d
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateIndependentMedium(ad, 'pasarela', { deltaDays: 1 })
                                }
                                className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-bold hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
                              >
                                +1d
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateIndependentMedium(ad, 'pasarela', { deltaDays: 7 })
                                }
                                className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-blue-500 cursor-pointer"
                              >
                                +7d
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 3. Dato Independiente: Pasarela de Proveedores (Incluida en el Pago) */}
                        <div
                          className={`rounded-xl border p-3 text-xs transition-all ${
                            mediumStates.proveedores.enabled
                              ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/20'
                              : 'border-zinc-200 bg-zinc-50/60 opacity-75 dark:border-zinc-800 dark:bg-zinc-800/30'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <span>🏪</span>
                              <span>3. Pasarela Proveedores</span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateIndependentMedium(ad, 'proveedores', { toggle: true })
                              }
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold cursor-pointer ${
                                mediumStates.proveedores.enabled
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              {mediumStates.proveedores.enabled
                                ? '✓ Proveedor Activo'
                                : 'Proveedor Pausado'}
                            </button>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Tiempo restante:{' '}
                              <strong className="text-indigo-700 dark:text-indigo-300">
                                {mediumStates.proveedores.enabled
                                  ? `${mediumStates.proveedores.daysRemaining}d ${mediumStates.proveedores.hoursRemaining}h`
                                  : '0d (Inactivo)'}
                              </strong>
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateIndependentMedium(ad, 'proveedores', { deltaDays: -1 })
                                }
                                className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-bold hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
                              >
                                -1d
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateIndependentMedium(ad, 'proveedores', { deltaDays: 1 })
                                }
                                className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-bold hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
                              >
                                +1d
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateIndependentMedium(ad, 'proveedores', { deltaDays: 7 })
                                }
                                className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-indigo-500 cursor-pointer"
                              >
                                +7d
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4. Asignación Independiente a Pasarelas Adicionales (Temporada o Expansión de Mercado) */}
                      {liveAdPageConfig.customRunways && liveAdPageConfig.customRunways.length > 0 && (
                        <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="font-bold text-zinc-500">
                            🔥 Pasarelas de Temporada / Expansión:
                          </span>
                          {liveAdPageConfig.customRunways.map((customR) => {
                            const customState = mediumStates.customRunways[customR.id]
                            const isAssigned =
                              customState?.enabled ??
                              Boolean(customR.assignedListingIds?.includes(ad.listing_id || ''))
                            const daysLeft = customState?.daysRemaining ?? timeStatus.daysRemaining

                            return (
                              <div
                                key={customR.id}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${
                                  isAssigned
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateIndependentMedium(ad, customR.id, {
                                      toggle: true,
                                      isCustomRunway: true,
                                    })
                                  }
                                  className="font-bold cursor-pointer flex items-center gap-1"
                                >
                                  <span>{customR.icon}</span>
                                  <span>{customR.title}:</span>
                                  <span className="underline">
                                    {isAssigned ? `Activa (${daysLeft}d)` : 'Incluir'}
                                  </span>
                                </button>
                                {isAssigned && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateIndependentMedium(ad, customR.id, {
                                        deltaDays: 7,
                                        isCustomRunway: true,
                                      })
                                    }
                                    className="rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-black text-white hover:bg-emerald-500 cursor-pointer"
                                    title="Sumar 7 días en esta pasarela"
                                  >
                                    +7d
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {filteredAds.length > visibleAds.length && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Mostrando {visibleAds.length} de {filteredAds.length} campañas
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleLimit((prev) =>
                      Math.min(
                        filteredAds.length,
                        prev + (itemsPerPage > 0 ? itemsPerPage : 10)
                      )
                    )
                  }
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  ➕ Cargar {Math.min(itemsPerPage > 0 ? itemsPerPage : 10, filteredAds.length - visibleAds.length)} más
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeItemsPerPage(0, filteredAds.length)}
                  className="rounded-xl border border-zinc-300 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Ver todos ({filteredAds.length})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- SECTION 3: BALANCES & WALLET ---------------- */}
      {section === 'balances' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className={`rounded-2xl border p-5 shadow-xs transition-colors flex items-center justify-between ${
              pendingRechargesCount > 0
                ? 'border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/30'
                : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
            }`}>
              <div>
                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Solicitudes Pendientes</p>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">{pendingRechargesCount}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Por verificar y aprobar</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 text-xl dark:bg-amber-900/60 dark:text-amber-300">
                ⏳
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Cuentas Registradas</p>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">{adAccounts.length}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Anunciantes con billetera</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-xl dark:bg-blue-950/60 dark:text-blue-400">
                👤
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Saldo Total Disponible</p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  ${totalBalanceInCirculation.toLocaleString('es-CO')} <span className="text-xs font-semibold text-zinc-500">COP</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Saldo en circulación</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 text-xl dark:bg-emerald-950/60 dark:text-emerald-400">
                💰
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-xs dark:border-blue-900/60 dark:from-blue-950/40 dark:to-zinc-900 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Acreditar Saldo</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">Abono manual directo</p>
                </div>
                <span className="text-2xl">⚡</span>
              </div>
              <button
                type="button"
                onClick={handleOpenNewTopup}
                className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <span>+</span>
                <span>Recarga Manual</span>
              </button>
            </div>
          </div>

          {/* Subtabs for Balances */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBalanceSubTab('requests')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  balanceSubTab === 'requests'
                    ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>Solicitudes de Recarga</span>
                {pendingRechargesCount > 0 ? (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold bg-amber-400 text-zinc-900">
                    {pendingRechargesCount} por aprobar
                  </span>
                ) : (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                    {rechargeRequests.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setBalanceSubTab('accounts')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  balanceSubTab === 'accounts'
                    ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>Cuentas de Anunciantes</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    balanceSubTab === 'accounts'
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {filteredAccounts.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBalanceSubTab('transactions')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  balanceSubTab === 'transactions'
                    ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>Historial de Movimientos</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    balanceSubTab === 'transactions'
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {filteredTransactions.length}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenNewTopup}
              className="rounded-xl border border-blue-600 bg-white px-3.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:bg-zinc-900 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
            >
              + Nueva Recarga Manual
            </button>
          </div>

          {/* Subtab 0: Recharge Requests */}
          {balanceSubTab === 'requests' && (
            <div>
              {filteredRechargeRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-4xl">📨</span>
                  <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50">
                    No hay solicitudes de recarga
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
                    Cuando los anunciantes soliciten recargar saldo para un paquete y envíen su comprobante de pago, las solicitudes aparecerán aquí para tu revisión y aprobación.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRechargeRequests.map((req) => {
                    const isPending = req.status === 'pending'
                    const isProcessing = processingRequestId === req.id
                    const sellerName = req.seller?.business_name || 'Negocio'
                    const dateStr = new Date(req.created_at).toLocaleString('es-CO', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })

                    return (
                      <div
                        key={req.id}
                        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-2xl dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                              💳
                            </div>

                            <div className="space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300 uppercase tracking-wider">
                                  {req.package?.name || 'Recarga de Saldo'}
                                </span>
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    isPending
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                      : req.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}
                                >
                                  {isPending ? 'Pendiente por Aprobar' : req.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                                </span>
                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                  +${Number(req.amount).toLocaleString('es-CO')} COP
                                </span>
                              </div>

                              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                                {sellerName}
                              </h3>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                                <span>Medio: <strong className="uppercase text-zinc-700 dark:text-zinc-300">{req.payment_method}</strong></span>
                                {req.reference_code && (
                                  <span>Comprobante: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{req.reference_code}</strong></span>
                                )}
                                <span>Fecha: {dateStr}</span>
                                {req.seller?.phone && <span>Teléfono: {req.seller.phone}</span>}
                              </div>

                              {req.notes && (
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-lg">
                                  Nota del vendedor: &quot;{req.notes}&quot;
                                </p>
                              )}

                              {req.proof_image_url && (
                                <div className="pt-1">
                                  <a
                                    href={req.proof_image_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                  >
                                    <span>📎</span>
                                    <span>Ver Comprobante Adjunto</span>
                                  </a>
                                </div>
                              )}

                              {req.status === 'rejected' && req.admin_notes && (
                                <div className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg">
                                  Motivo de rechazo: {req.admin_notes}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Botones de acción */}
                          {isPending && (
                            <div className="flex flex-wrap items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800 shrink-0">
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleApproveRechargeRequest(req.id)}
                                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                              >
                                <span>✅</span>
                                <span>{isProcessing ? 'Aprobando...' : 'Aprobar y Acreditar Saldo'}</span>
                              </button>

                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => {
                                  setRejectingRequest(req)
                                  setRejectRequestNotes('')
                                }}
                                className="flex items-center gap-1.5 rounded-xl border border-red-300 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                              >
                                <span>✕</span>
                                <span>Rechazar</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Subtab 1: Accounts List */}
          {balanceSubTab === 'accounts' && (
            <div>
              {filteredAccounts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-4xl">💳</span>
                  <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50">
                    No se encontraron cuentas publicitarias
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
                    Los vendedores obtienen una cuenta automáticamente al configurar un anuncio, o puedes crear y acreditar una cuenta para cualquier vendedor registrado ahora mismo.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenNewTopup}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500"
                  >
                    <span>+</span>
                    <span>Acreditar Saldo a un Vendedor</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 border-b border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="py-3 px-4">Anunciante / Negocio</th>
                          <th className="py-3 px-4">Contacto / Ubicación</th>
                          <th className="py-3 px-4 text-right">Saldo Actual</th>
                          <th className="py-3 px-4 text-center">Estado</th>
                          <th className="py-3 px-4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {filteredAccounts.map((acc) => {
                          const sellerName =
                            acc.advertiser?.seller?.business_name ||
                            acc.advertiser?.legal_name ||
                            'Sin negocio'
                          const city = acc.advertiser?.seller?.city || 'No especificada'
                          const phone =
                            acc.advertiser?.seller?.phone ||
                            acc.advertiser?.seller?.whatsapp ||
                            'Sin teléfono'
                          const balance = Number(acc.balance) || 0

                          return (
                            <tr
                              key={acc.id}
                              className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                            >
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-zinc-900 dark:text-zinc-50">
                                  {sellerName}
                                </div>
                                <div className="text-[11px] text-zinc-500">
                                  ID Cuenta:{' '}
                                  <span className="font-mono text-[10px]">
                                    {acc.id.slice(0, 13)}...
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                                <div>📍 {city}</div>
                                <div className="text-[11px] text-zinc-500">📞 {phone}</div>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <span
                                  className={`inline-block rounded-xl px-3 py-1 font-extrabold text-sm ${
                                    balance > 0
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                                  }`}
                                >
                                  ${balance.toLocaleString('es-CO')} COP
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span
                                  className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    balance > 0
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  }`}
                                >
                                  {balance > 0 ? 'Con Saldo' : 'Sin Saldo'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleOpenTopupForAccount(acc)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-500 transition-colors"
                                >
                                  <span>💳</span>
                                  <span>Acreditar Saldo</span>
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subtab 2: Transactions History */}
          {balanceSubTab === 'transactions' && (
            <div>
              {filteredTransactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-4xl">📜</span>
                  <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50">
                    No hay movimientos registrados
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Aquí aparecerán las recargas de saldo aprobadas y los débitos por campañas activadas.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 border-b border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="py-3 px-4">Fecha</th>
                          <th className="py-3 px-4">Anunciante</th>
                          <th className="py-3 px-4 text-center">Tipo</th>
                          <th className="py-3 px-4 text-right">Monto</th>
                          <th className="py-3 px-4 text-right">Saldo Final</th>
                          <th className="py-3 px-4">Medio / Referencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {filteredTransactions.map((tx) => {
                          const sellerName =
                            tx.ad_account?.advertiser?.seller?.business_name ||
                            tx.ad_account?.advertiser?.legal_name ||
                            'Anunciante'
                          const isTopup = tx.kind === 'topup'
                          const isSpend = tx.kind === 'spend'
                          const dateStr = new Date(tx.created_at).toLocaleString('es-CO', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })

                          return (
                            <tr
                              key={tx.id}
                              className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                            >
                              <td className="py-3 px-4 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                                {dateStr}
                              </td>
                              <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-50">
                                {sellerName}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    isTopup
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : isSpend
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  }`}
                                >
                                  {isTopup ? 'Recarga' : isSpend ? 'Cobro Anuncio' : tx.kind}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                                <span
                                  className={
                                    isTopup
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-purple-600 dark:text-purple-400'
                                  }
                                >
                                  {isTopup ? '+' : '-'} $
                                  {Number(tx.amount).toLocaleString('es-CO')}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                                ${Number(tx.balance_after).toLocaleString('es-CO')}
                              </td>
                              <td className="py-3 px-4 text-zinc-500 text-[11px]">
                                <span className="font-semibold uppercase text-zinc-700 dark:text-zinc-300">
                                  {tx.ref_type || 'N/A'}
                                </span>
                                {tx.ref_id && (
                                  <span className="block text-[10px] font-mono text-zinc-400">
                                    Ref: {tx.ref_id}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------- SECTION 4: ADMINISTRACIÓN INTEGRAL DE USUARIOS ---------------- */}
      {section === 'users' && (
        <div className="space-y-4">
          {roleSuccessNotice && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>✅</span>
                <span>{roleSuccessNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setRoleSuccessNotice(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {roleErrorNotice && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{roleErrorNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setRoleErrorNotice(null)}
                className="text-red-700 hover:text-red-900 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          <AdminUsersManagementWindow
            users={users}
            setUsers={setUsers}
            listings={listings}
            setListings={setListings}
            locale={locale}
            t={t}
            updatingUserId={updatingUserId}
            onUpdateUserRole={handleUpdateUserRole}
            onNotify={showToast}
          />
        </div>
      )}

      {/* Modal para motivo de rechazo de Listing */}
      {rejectingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Rechazar Publicación
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Indica la razón del rechazo para que el vendedor ({rejectingListing.seller?.business_name}) pueda corregir su publicación.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Motivo del rechazo
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej. La imagen no corresponde con la descripción o incumple las políticas..."
                className="w-full rounded-xl border border-zinc-300 p-3 text-xs text-zinc-900 focus:border-red-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectingListing(null)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectListing}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-sm"
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para motivo de rechazo de Ad Order */}
      {rejectingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Rechazar Campaña Publicitaria
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Indica la razón del rechazo de la publicidad &quot;{rejectingAd.headline}&quot;.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Motivo del rechazo publicitario
              </label>
              <textarea
                rows={3}
                value={adRejectReason}
                onChange={(e) => setAdRejectReason(e.target.value)}
                placeholder="Ej. Dimensiones inadecuadas, texto publicitario engañoso o reclamos médicos..."
                className="w-full rounded-xl border border-zinc-300 p-3 text-xs text-zinc-900 focus:border-red-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectingAd(null)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectAd}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-sm"
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Autorizar y Acreditar Saldo */}
      {topupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <span>💳</span>
                  <span>Autorizar y Acreditar Saldo</span>
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Acredita saldo publicitario a un vendedor tras verificar su pago (Nequi, Daviplata, Bancolombia).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTopupModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTopupSubmit} className="space-y-4">
              {/* Selección de Cuenta o Vendedor */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Anunciante / Negocio *
                </label>
                <select
                  value={
                    selectedAccountId
                      ? `acc:${selectedAccountId}`
                      : selectedSellerId
                      ? `seller:${selectedSellerId}`
                      : ''
                  }
                  onChange={(e) => {
                    const val = e.target.value
                    if (val.startsWith('acc:')) {
                      setSelectedAccountId(val.replace('acc:', ''))
                      setSelectedSellerId('')
                    } else if (val.startsWith('seller:')) {
                      setSelectedAccountId('')
                      setSelectedSellerId(val.replace('seller:', ''))
                    }
                  }}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  required
                >
                  <optgroup label="Cuentas Existentes">
                    {adAccounts.map((acc) => {
                      const name =
                        acc.advertiser?.seller?.business_name ||
                        acc.advertiser?.legal_name ||
                        'Anunciante'
                      return (
                        <option key={acc.id} value={`acc:${acc.id}`}>
                          {name} — (Saldo: ${Number(acc.balance).toLocaleString('es-CO')} COP)
                        </option>
                      )
                    })}
                  </optgroup>

                  {/* Vendedores que aún no tienen cuenta de anunciante */}
                  {sellers.filter((s) => !adAccounts.some((a) => a.advertiser?.seller_id === s.id)).length > 0 && (
                    <optgroup label="Otros Vendedores (Crear nueva cuenta)">
                      {sellers
                        .filter((s) => !adAccounts.some((a) => a.advertiser?.seller_id === s.id))
                        .map((s) => (
                          <option key={s.id} value={`seller:${s.id}`}>
                            [Crear cuenta] {s.business_name} ({s.city || 'Colombia'})
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Monto a Acreditar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Monto a Acreditar (COP) *
                  </label>
                  {topupAmount && Number(topupAmount) > 0 && (
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      +${Number(topupAmount).toLocaleString('es-CO')} COP
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 font-bold text-zinc-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full rounded-xl border border-zinc-300 bg-white pl-8 pr-3.5 py-2.5 text-sm font-bold text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                {/* Chips rápidos de valor según Políticas Oficiales */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    { val: 10000, label: '+$10.000 (Pasarela)' },
                    { val: 20000, label: '+$20.000 (Gran Vitrina)' },
                    { val: 25000, label: '+$25.000 (Combo las dos)' },
                    { val: 50000, label: '+$50.000 (2 Combos)' },
                    { val: 100000, label: '+$100.000' },
                  ].map((chip) => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => setTopupAmount(chip.val)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-colors ${
                        Number(topupAmount) === chip.val
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medio de Pago y Referencia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Medio de Pago *
                  </label>
                  <select
                    value={topupRefType}
                    onChange={(e) => setTopupRefType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="nequi">Nequi</option>
                    <option value="daviplata">Daviplata</option>
                    <option value="bancolombia">Bancolombia</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo / En Punto</option>
                    <option value="bono">Bono Promocional / Cortesía</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    N° Comprobante / Ref.
                  </label>
                  <input
                    type="text"
                    value={topupRefId}
                    onChange={(e) => setTopupRefId(e.target.value)}
                    placeholder="Ej. M189283 o 312..."
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Notas internas */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Notas u Observaciones (Opcional)
                </label>
                <input
                  type="text"
                  value={topupNotes}
                  onChange={(e) => setTopupNotes(e.target.value)}
                  placeholder="Ej. Recarga confirmada por WhatsApp con asesor"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Botones de acción */}
              <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isToppingUp}
                  onClick={() => setTopupModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isToppingUp}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition-colors"
                >
                  <span>⚡</span>
                  <span>{isToppingUp ? 'Acreditando...' : 'Confirmar y Acreditar Saldo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para motivo de rechazo de Solicitud de Recarga */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Rechazar Solicitud de Recarga
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Indica la razón del rechazo para {rejectingRequest.seller?.business_name || 'el vendedor'} (monto: ${Number(rejectingRequest.amount).toLocaleString('es-CO')} COP).
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Motivo del rechazo
              </label>
              <textarea
                rows={3}
                value={rejectRequestNotes}
                onChange={(e) => setRejectRequestNotes(e.target.value)}
                placeholder="Ej. Comprobante no coincide con el extracto bancario o monto no recibido..."
                className="w-full rounded-xl border border-zinc-300 p-3 text-xs text-zinc-900 focus:border-red-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectRechargeRequest}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-sm"
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Administrativo: Reactivación de Campaña con Configuraciones y Validación de Pago */}
      {adminReactivatingAd && (() => {
        const sellerId = adminReactivatingAd.listing?.seller?.id || adminReactivatingAd.account?.seller_id
        const sellerAccount = adAccounts.find(
          (a) => a.id === adminReactivatingAd.ad_account_id || (sellerId && a.seller_id === sellerId)
        )
        const sellerBalance = Number(sellerAccount?.balance || 0)
        const pendingSellerRecharges = rechargeRequests.filter(
          (r) =>
            r.status === 'pending' &&
            ((sellerId && r.seller_id === sellerId) ||
              (sellerAccount && r.ad_account_id === sellerAccount.id) ||
              r.notes?.includes(`[REACTIVAR_CAMPANA:${adminReactivatingAd.id}]`))
        )
        const baseCost =
          adminReactivatePlacement === 'combo'
            ? 25000
            : adminReactivatePlacement === 'gran_vitrina'
            ? 20000
            : adminReactivatePlacement === 'pasarela'
            ? 10000
            : 0
        const selectedRunway = (liveAdPageConfig.customRunways || []).find(
          (r) => r.id === adminReactivateRunwayId
        )
        const seasonalCost = selectedRunway ? Number(selectedRunway.campaignCostCop || 0) : 0
        const totalAdminCost = baseCost + seasonalCost

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 my-8 max-h-[92vh] overflow-y-auto space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-[11px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    🔄 Panel Administrativo: Reactivación y Validación de Pago
                  </span>
                  <h3 className="mt-1.5 text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                    Reactivar Campaña: {adminReactivatingAd.headline}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Proveedor:{' '}
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {adminReactivatingAd.listing?.seller?.business_name || 'Proveedor Verificado'}
                    </strong>{' '}
                    · Saldo en Billetera:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      ${sellerBalance.toLocaleString('es-CO')} COP
                    </strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminReactivatingAd(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* 1. Configuración de Planes Originales y Pasarela de Temporada */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  1. Configuración de Plan Original y Pasarela de Temporada
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {[
                    {
                      id: 'pasarela',
                      title: '✨ Plan Pasarela',
                      price: '$10.000 COP',
                      desc: 'Carrusel Rubro + Proveedores',
                    },
                    {
                      id: 'gran_vitrina',
                      title: '🏆 Gran Vitrina',
                      price: '$20.000 COP',
                      desc: 'Banner Principal + Proveedores',
                    },
                    {
                      id: 'combo',
                      title: '🔥 Plan Combo Total',
                      price: '$25.000 COP',
                      desc: 'Gran Vitrina + Pasarela + Proveedores',
                    },
                    {
                      id: 'none',
                      title: '🎯 Solo Temporada',
                      price: '$0 Base',
                      desc: 'Únicamente Pasarela de Temporada',
                    },
                  ].map((plan) => {
                    const active = adminReactivatePlacement === plan.id
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setAdminReactivatePlacement(plan.id as any)}
                        className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                          active
                            ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20 dark:border-purple-500 dark:bg-purple-950/40'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900'
                        }`}
                      >
                        <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                          {plan.title}
                        </div>
                        <div className="mt-0.5 text-xs font-black text-purple-600 dark:text-purple-400">
                          {plan.price}
                        </div>
                        <div className="mt-1 text-[10px] text-zinc-500">{plan.desc}</div>
                      </button>
                    )
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      🎁 Pasarela de Temporada / Catálogo Exclusivo
                    </label>
                    <select
                      value={adminReactivateRunwayId}
                      onChange={(e) => setAdminReactivateRunwayId(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="none">Ninguna (Solo Plan Original seleccionado)</option>
                      {(liveAdPageConfig.customRunways || []).map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.icon} {r.title} (+${Number(r.campaignCostCop || 0).toLocaleString('es-CO')} COP · {r.durationDays} días)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      ⏱️ Días de Vigencia a Otorgar
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={adminReactivateDurationDays}
                      onChange={(e) =>
                        setAdminReactivateDurationDays(Math.max(1, Number(e.target.value) || 30))
                      }
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Contenido Visual del Anuncio */}
              <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  2. Revisión / Ajuste de Campos de la Campaña
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Titular del anuncio
                    </label>
                    <input
                      type="text"
                      value={adminReactivateHeadline}
                      onChange={(e) => setAdminReactivateHeadline(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      URL de Imagen del Anuncio
                    </label>
                    <input
                      type="text"
                      value={adminReactivateImageUrl}
                      onChange={(e) => setAdminReactivateImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Descripción / Mensaje Promocional
                  </label>
                  <textarea
                    rows={2}
                    value={adminReactivateBody}
                    onChange={(e) => setAdminReactivateBody(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* 3. Modalidad de Validación de Pago (Perfil Administrador) */}
              <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    3. Validación de Pago para Reactivación
                  </h4>
                  <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                    Total a Validar: ${totalAdminCost.toLocaleString('es-CO')} COP
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAdminReactivatePaymentValidation('approve_pending_recharge')}
                    className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      adminReactivatePaymentValidation === 'approve_pending_recharge'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/40'
                        : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                    }`}
                  >
                    <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                      🧾 Aprobar Comprobante Pendiente ({pendingSellerRecharges.length})
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Aprueba la solicitud de recarga del vendedor, acredita/descuenta el valor y activa la campaña inmediatamente.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminReactivatePaymentValidation('deduct_wallet')}
                    className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      adminReactivatePaymentValidation === 'deduct_wallet'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/40'
                        : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                    }`}
                  >
                    <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                      💳 Descontar de Billetera (${sellerBalance.toLocaleString('es-CO')})
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Descuenta ${totalAdminCost.toLocaleString('es-CO')} COP del saldo disponible en la billetera del proveedor y registra el movimiento.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminReactivatePaymentValidation('direct_validated')}
                    className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      adminReactivatePaymentValidation === 'direct_validated'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/40'
                        : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                    }`}
                  >
                    <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                      ✅ Pago Externo Verificado / Cortesía
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Valida el pago directamente por administración sin afectar el saldo actual de la billetera.
                    </p>
                  </button>
                </div>

                {adminReactivatePaymentValidation === 'approve_pending_recharge' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                    {pendingSellerRecharges.length === 0 ? (
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                        ⚠️ Este proveedor no tiene comprobantes de recarga pendientes en este momento. Selecciona &quot;Descontar de Billetera&quot; o &quot;Pago Externo Verificado&quot;.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-amber-900 dark:text-amber-200">
                          Selecciona el comprobante pendiente a aprobar y vincular:
                        </label>
                        <select
                          value={adminReactivateSelectedRechargeId}
                          onChange={(e) => setAdminReactivateSelectedRechargeId(e.target.value)}
                          className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 dark:border-amber-700 dark:bg-zinc-900 dark:text-zinc-100"
                        >
                          {pendingSellerRecharges.map((r) => (
                            <option key={r.id} value={r.id}>
                              ${Number(r.amount).toLocaleString('es-CO')} COP · Método: {r.payment_method.toUpperCase()} · Ref: {r.reference_number || 'S/N'} ({new Date(r.created_at).toLocaleDateString('es-CO')})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAdminReactivatingAd(null)}
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubmittingAdminReactivation}
                  onClick={handleConfirmAdminReactivateAd}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  <span>🚀</span>
                  <span>
                    {isSubmittingAdminReactivation
                      ? 'Validando y Reactivando...'
                      : `Validar Pago y Reactivar Campaña (${adminReactivateDurationDays} días)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
