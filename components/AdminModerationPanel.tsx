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
  getListingFreeTrialStatus,
  buildInitialFreeAdAttrs,
} from '@/lib/adPolicies'
import { type AdPageConfig, DEFAULT_AD_PAGE_CONFIG } from '@/lib/adPageConfig'
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

  // Ads state
  const [adOrders, setAdOrders] = useState<AdOrderWithRelations[]>(initialAdOrders)
  const [adActiveTab, setAdActiveTab] = useState<'pending' | 'live' | 'rejected' | 'all'>('pending')
  const [rejectingAd, setRejectingAd] = useState<AdOrderWithRelations | null>(null)
  const [adRejectReason, setAdRejectReason] = useState('')
  const [isSyncingPolicies, setIsSyncingPolicies] = useState(false)

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

  // --- Ads filtering ---
  const pendingAdStatuses: AdOrderStatus[] = ['submitted', 'in_review']

  const filteredAds = adOrders.filter((ad) => {
    if (adActiveTab === 'pending' && !pendingAdStatuses.includes(ad.status)) return false
    if (adActiveTab === 'live' && ad.status !== 'live' && ad.status !== 'approved') return false
    if (adActiveTab === 'rejected' && ad.status !== 'rejected') return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchHeadline = ad.headline.toLowerCase().includes(q)
      const matchBody = ad.body?.toLowerCase().includes(q) || false
      const matchPkg = ad.package?.name.toLowerCase().includes(q) || false
      const matchListing = ad.listing?.title.toLowerCase().includes(q) || false
      return matchHeadline || matchBody || matchPkg || matchListing
    }

    return true
  })

  const pendingAdsCount = adOrders.filter((a) => pendingAdStatuses.includes(a.status)).length
  const liveAdsCount = adOrders.filter((a) => a.status === 'live' || a.status === 'approved').length
  const rejectedAdsCount = adOrders.filter((a) => a.status === 'rejected').length

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
      const durationDays = targetAd?.package?.duration_days || 7
      const startsAt = targetAd?.starts_at || now.toISOString()
      const endsAt = targetAd?.ends_at || new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()

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

      showToast('Campaña publicitaria aprobada y activada (live) exitosamente.')
    } catch (err: any) {
      showToast(err.message || 'Error al aprobar la campaña publicitaria', 'error')
    } finally {
      setProcessingId(null)
    }
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

      showToast(`Recarga aprobada exitosamente. Se acreditaron $${Number(req.amount).toLocaleString('es-CO')} COP.`)
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
      title: locale === 'en' ? 'Listings Moderation Queue' : 'Moderación de Anuncios y Publicaciones',
      subtitle:
        locale === 'en'
          ? 'Review, approve, or reject products and services submitted by sellers.'
          : 'Revisión y aprobación o rechazo de artículos y servicios enviados por vendedores.',
    },
    ads: {
      icon: '📢',
      title: locale === 'en' ? 'Sponsored Campaigns Moderation' : 'Moderación de Campañas Patrocinadas',
      subtitle:
        locale === 'en'
          ? 'Review and approve sponsored advertising campaigns in the catalog.'
          : 'Revisión y activación de campañas publicitarias patrocinadas en el catálogo.',
    },
    adpage: {
      icon: '⚙️',
      title:
        locale === 'en'
          ? 'Advertising Page & Showcase Control'
          : 'Administración de la Página de Publicidad y Vitrinas',
      subtitle:
        locale === 'en'
          ? 'Control publication limits per runway, visualization speed, active sections, and extensible settings.'
          : 'Controla la cantidad de publicaciones por pasarela, velocidad de visualización, secciones activas y futuras configuraciones.',
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

                return (
                  <div
                    key={listing.id}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5 shadow-sm transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
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
                            {freeTrial.isInFreePeriod ? (
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
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-purple-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    Política Oficial Activa
                  </span>
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                    Configuración de Políticas y Tarifas de Publicidad
                  </h3>
                </div>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Todo producto o servicio creado recibe <strong>{FREE_INITIAL_AD_DAYS} días iniciales de publicidad gratis ($0 COP)</strong>. Finalizado el periodo inicial, aplican los planes individuales o en combo por ciclos de 7 días:
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
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
                  <span>Controlar Cantidad y Página de Publicidad</span>
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
                      : 'Sincronizar Tarifas Oficiales en BD'}
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
                  Se activa automáticamente al crear/publicar cualquier producto o servicio nuevo.
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
                  ✨ Pasarela
                </div>
                <div className="text-base font-black text-zinc-900 dark:text-zinc-50">
                  $10.000 COP
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Aparición en Carruseles de Pasarela (Productos y Servicios).
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
                  🏆 Gran Vitrina
                </div>
                <div className="text-base font-black text-zinc-900 dark:text-zinc-50">
                  $20.000 COP
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Exposición principal en la Gran Vitrina rotativa superior.
                </p>
              </div>

              {/* Regla 4: Combo las dos */}
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
                  🔥 Las Dos (Vitrina + Pasarela)
                </div>
                <div className="text-base font-black text-purple-700 dark:text-purple-300">
                  $25.000 COP
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-600 dark:text-zinc-300">
                  Presencia simultánea en Gran Vitrina + Pasarela por 7 días.
                </p>
              </div>
            </div>
          </div>

          {/* Tabs for Ads */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              {[
                {
                  id: 'pending',
                  label: 'Campañas Pendientes (submitted)',
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
                  id: 'rejected',
                  label: 'Rechazadas',
                  count: rejectedAdsCount,
                  color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
                },
                {
                  id: 'all',
                  label: 'Todas',
                  count: adOrders.length,
                  color: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200',
                },
              ].map((tab) => {
                const isActive = adActiveTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAdActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
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

          {/* Ads List */}
          {filteredAds.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-4xl">{adActiveTab === 'pending' ? '🚀' : '🔍'}</span>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50">
                {adActiveTab === 'pending'
                  ? 'No hay campañas publicitarias pendientes de revisión'
                  : 'No se encontraron campañas en esta sección'}
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                {adActiveTab === 'pending'
                  ? 'Todas las solicitudes de publicidad han sido atendidas.'
                  : 'Prueba cambiando de pestaña o limpiando la búsqueda.'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4' : 'space-y-3 sm:space-y-4'}>
              {visibleAds.map((ad) => {
                const isPending = pendingAdStatuses.includes(ad.status)
                const isProcessing = processingId === ad.id
                const placement = resolveAdOrderPlacement(ad)

                return (
                  <div
                    key={ad.id}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5 shadow-sm transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-5">
                      <div className={`flex ${viewMode === 'grid' ? 'flex-col sm:flex-row' : 'flex-row'} items-start gap-3 sm:gap-4 min-w-0`}>
                        <div className={`relative ${viewMode === 'grid' ? 'w-full aspect-[4/3] sm:h-20 sm:w-32' : 'h-16 w-20 sm:h-20 sm:w-32'} shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700`}>
                          {ad.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ad.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">
                              📢
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300 uppercase tracking-wider">
                              {ad.package?.name || 'Paquete'}
                            </span>
                            <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300">
                              {placement === 'combo'
                                ? '🔥 Ubicación: Combo (Gran Vitrina + Pasarela)'
                                : placement === 'gran_vitrina'
                                ? '🏆 Ubicación: Gran Vitrina ($20.000)'
                                : '✨ Ubicación: Pasarela ($10.000)'}
                            </span>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
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
                                ? 'En vivo (live)'
                                : isPending
                                ? 'En revisión'
                                : ad.status === 'rejected'
                                ? 'Rechazado'
                                : ad.status}
                            </span>
                            <span className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100">
                              ${Number(ad.price_paid).toLocaleString('es-CO')} COP
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 truncate">
                            {ad.headline}
                          </h3>

                          {ad.body && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1">
                              {ad.body}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                            {ad.listing && (
                              <span>
                                Producto Vinculado:{' '}
                                <Link
                                  href={`/catalogo/${ad.listing.id}`}
                                  className="underline font-medium text-purple-600 dark:text-purple-400"
                                >
                                  {ad.listing.title}
                                </Link>
                              </span>
                            )}
                            {(ad.target_city || ad.target_category) && (
                              <span>
                                Segmentación: {[ad.target_city, ad.target_category].filter(Boolean).join(', ')}
                              </span>
                            )}
                            <span>
                              Enviado: {new Date(ad.created_at).toLocaleDateString('es-CO')}
                            </span>
                          </div>

                          {ad.status === 'rejected' && ad.reject_reason && (
                            <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                              <strong>Motivo de rechazo:</strong> {ad.reject_reason}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800 shrink-0">
                        {ad.status !== 'live' && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleApproveAd(ad.id)}
                            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50 transition-colors"
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
                            className="flex items-center gap-1.5 rounded-xl border border-red-300 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                          >
                            <span>✕</span>
                            <span>Rechazar</span>
                          </button>
                        )}
                      </div>
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
    </div>
  )
}
