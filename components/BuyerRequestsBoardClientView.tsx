// components/BuyerRequestsBoardClientView.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n'
import type { Category, Listing, Seller } from '@/lib/types'
import {
  BUYER_PROFILES,
  SERVICE_SELLER_PROFILES,
  type TestProfile,
} from '@/lib/testProfiles'
import {
  type BuyerClassifiedRequest,
  type BuyerRequestProposal,
  type BuyerRequestContract,
  type BuyerRequestContractLog,
  type ContractMilestoneType,
  type BuyerRequestType,
  type BuyerRequestUrgency,
  type BuyerRequestModality,
  BUYER_REQUESTS_STORAGE_KEY,
  INITIAL_BUYER_REQUESTS,
  sanitizeBuyerRequestsList,
  encodeBuyerRequestsToSlot,
  buildBuyerRequestWhatsappUrl,
} from '@/lib/buyerRequests'

interface BuyerRequestsBoardClientViewProps {
  initialRequests: BuyerClassifiedRequest[]
  categories: Category[]
  initialSellers: Seller[]
  initialListings: Listing[]
  windowMode?: 'board' | 'buyer_window' | 'seller_window'
}

const COLOMBIA_CITIES = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Bucaramanga',
  'Cartagena',
  'Pereira',
  'Manizales',
  'Santa Marta',
  'Cúcuta',
]

export default function BuyerRequestsBoardClientView({
  initialRequests,
  categories,
  initialSellers,
  initialListings,
  windowMode = 'board',
}: BuyerRequestsBoardClientViewProps) {
  const { locale } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  // Ventana activa: 'board' (Tablero general), 'buyer_window' (Ventana Independiente Comprador) o 'seller_window' (Ventana Independiente Vendedor)
  const [currentWindow, setCurrentWindow] = useState<'board' | 'buyer_window' | 'seller_window'>(
    windowMode
  )

  // Estado de usuario y perfil actual
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('Usuario')
  const [userPhone, setUserPhone] = useState<string>('')
  const [userCity, setUserCity] = useState<string>('Bogotá')
  const [userRole, setUserRole] = useState<'guest' | 'buyer' | 'seller' | 'admin'>('guest')
  const [sessionChecked, setSessionChecked] = useState<boolean>(false)
  const [mySellerProfile, setMySellerProfile] = useState<Seller | null>(null)
  const [mySellerListings, setMySellerListings] = useState<Listing[]>([])

  // Estado de Bloqueo de Acceso por Rol (Permite ver botones sin logueo pero exige el perfil correspondiente para ejecutar la acción)
  const [authGateInfo, setAuthGateInfo] = useState<{
    requiredProfile: 'buyer' | 'seller'
    actionTitle: string
    actionDescription: string
    pendingAction?: () => void
  } | null>(null)
  const [quickAuthLoading, setQuickAuthLoading] = useState<boolean>(false)

  // Lista reactiva de solicitudes clasificadas
  const [requests, setRequests] = useState<BuyerClassifiedRequest[]>(() =>
    sanitizeBuyerRequestsList(initialRequests)
  )

  // Filtros de exploración (Estilo Catálogo)
  const [activeTab, setActiveTab] = useState<'all' | 'services' | 'products' | 'mine' | 'attending'>(
    windowMode === 'buyer_window'
      ? 'mine'
      : windowMode === 'seller_window'
      ? 'attending'
      : 'all'
  )
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Modales y Ventana Independiente de Seguimiento del Contrato Pactado
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [proposalTargetRequest, setProposalTargetRequest] = useState<BuyerClassifiedRequest | null>(null)
  const [ratingTargetRequest, setRatingTargetRequest] = useState<BuyerClassifiedRequest | null>(null)
  const [detailRequest, setDetailRequest] = useState<BuyerClassifiedRequest | null>(null)
  const [contractWindowRequest, setContractWindowRequest] = useState<BuyerClassifiedRequest | null>(null)

  // Estados de la Ventana Independiente del Contrato Pactado y Bitácora de Seguimiento
  const [propPaymentTerms, setPropPaymentTerms] = useState<string>(
    'Pago contra entrega y verificación de cumplimiento de condiciones'
  )
  const [newLogTitle, setNewLogTitle] = useState<string>('')
  const [newLogDetail, setNewLogDetail] = useState<string>('')
  const [newLogMilestone, setNewLogMilestone] = useState<ContractMilestoneType>('progress_update')
  const [newProgressPercent, setNewProgressPercent] = useState<number>(50)
  const [savingContractUpdate, setSavingContractUpdate] = useState<boolean>(false)

  // Notificaciones
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const showFeedback = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text })
    setTimeout(() => setNotice(null), 5000)
  }

  // Estados del Formulario de Nueva Solicitud (Priorizando Estructura de Servicio)
  const [newReqType, setNewReqType] = useState<BuyerRequestType>('service')
  const [newCategorySlug, setNewCategorySlug] = useState<string>('servicios-hogar')
  const [newTitle, setNewTitle] = useState<string>('')
  const [newDescription, setNewDescription] = useState<string>('')
  const [newCity, setNewCity] = useState<string>('Bogotá')
  const [newWhatsapp, setNewWhatsapp] = useState<string>('')
  const [newUrgency, setNewUrgency] = useState<BuyerRequestUrgency>('immediate')
  const [newModality, setNewModality] = useState<BuyerRequestModality>('home')
  const [newSchedule, setNewSchedule] = useState<string>('Mañana entre 8:00 AM y 12:00 PM')
  const [newBudgetMin, setNewBudgetMin] = useState<string>('')
  const [newBudgetMax, setNewBudgetMax] = useState<string>('')
  const [newBudgetUnit, setNewBudgetUnit] = useState<string>('servicio completo')
  const [newRequiredSpec, setNewRequiredSpec] = useState<string>(
    'Técnico o profesional con experiencia comprobable y garantía del trabajo'
  )
  const [newScope, setNewScope] = useState<string>('Diagnóstico + ejecución completa del servicio')
  const [savingNewReq, setSavingNewReq] = useState<boolean>(false)

  // Estados del Formulario de Postulación y Aceptación de Servicio (Para Vendedores / Prestadores de Servicio)
  const [propSellerId, setPropSellerId] = useState<string>('')
  const [propBusinessName, setPropBusinessName] = useState<string>('')
  const [propWhatsapp, setPropWhatsapp] = useState<string>('')
  const [propLinkedListingId, setPropLinkedListingId] = useState<string>('')
  const [propOfferedPrice, setPropOfferedPrice] = useState<string>('')
  const [propEstimatedTime, setPropEstimatedTime] = useState<string>('Llegada en 60 minutos / Coordinación inmediata')
  const [propWarranty, setPropWarranty] = useState<string>('Garantía escrita de 60 días sobre el servicio')
  const [propMessage, setPropMessage] = useState<string>('')
  const [propAcceptDirectly, setPropAcceptDirectly] = useState<boolean>(true)
  const [savingProposal, setSavingProposal] = useState<boolean>(false)

  // Estados del Modal de Calificación Oficial (Integrado con public.review y public.seller)
  const [ratingValue, setRatingValue] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [ratingComment, setRatingComment] = useState<string>('')
  const [ratingRecommend, setRatingRecommend] = useState<boolean>(true)
  const [savingRating, setSavingRating] = useState<boolean>(false)

  // Cargar sesión actual y sincronizar almacenamiento
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BUYER_REQUESTS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRequests(sanitizeBuyerRequestsList(parsed))
        }
      }
    } catch {
      // Continuar con initialRequests
    }

    async function loadSessionAndProfile(sessionUser?: any) {
      let user = sessionUser
      if (user === undefined) {
        const {
          data: { user: fetchedUser },
        } = await supabase.auth.getUser()
        user = fetchedUser
      }

      if (!user) {
        setUserId(null)
        setUserEmail('')
        setUserRole('guest')
        setMySellerProfile(null)
        setMySellerListings([])
        setSessionChecked(true)
        return
      }

      setUserId(user.id)
      setUserEmail(user.email || '')
      const { data: appUser } = await supabase
        .from('app_user')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      const resolvedRole =
        appUser?.role === 'admin'
          ? 'admin'
          : appUser?.role === 'seller'
          ? 'seller'
          : 'buyer'
      setUserRole(resolvedRole)
      setUserName(appUser?.full_name || user.email?.split('@')[0] || 'Comprador Verificado')
      setUserCity(appUser?.city || 'Bogotá')
      setNewCity(appUser?.city || 'Bogotá')
      if (appUser?.phone) {
        setUserPhone(appUser.phone)
        setNewWhatsapp(appUser.phone)
      }

      // Buscar si el usuario tiene perfil de seller registrado
      const matchedSeller = initialSellers.find((s) => s.owner_user_id === user.id)
      if (matchedSeller) {
        setMySellerProfile(matchedSeller)
        setPropSellerId(matchedSeller.id)
        setPropBusinessName(matchedSeller.business_name)
        setPropWhatsapp(matchedSeller.whatsapp || matchedSeller.phone || appUser?.phone || '')
        const sellerItems = initialListings.filter((l) => l.seller_id === matchedSeller.id)
        setMySellerListings(sellerItems)
        if (sellerItems[0]) {
          setPropLinkedListingId(sellerItems[0].id)
        }
      } else {
        setMySellerProfile(null)
        setMySellerListings([])
        setPropBusinessName(appUser?.full_name ? `${appUser.full_name} Servicios` : 'Prestador de Servicio')
        setPropWhatsapp(appUser?.phone || '3001112233')
      }
      setSessionChecked(true)
    }

    loadSessionAndProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadSessionAndProfile(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, initialSellers, initialListings])

  // Validadores de Bloqueo por Rol (Botones visibles siempre, pero bloqueados hasta iniciar sesión con el perfil requerido)
  const requestBuyerAction = (
    actionTitle: string,
    actionDescription: string,
    callback: () => void
  ) => {
    if (!userId || userRole !== 'buyer') {
      setAuthGateInfo({
        requiredProfile: 'buyer',
        actionTitle,
        actionDescription,
        pendingAction: callback,
      })
      return
    }
    callback()
  }

  const requestSellerAction = (
    actionTitle: string,
    actionDescription: string,
    callback: () => void
  ) => {
    if (!userId || userRole !== 'seller') {
      setAuthGateInfo({
        requiredProfile: 'seller',
        actionTitle,
        actionDescription,
        pendingAction: callback,
      })
      return
    }
    callback()
  }

  const handleQuickProfileSignIn = async (profile: TestProfile) => {
    setQuickAuthLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: profile.password,
      })
      if (error) throw error

      const {
        data: { user: loggedUser },
      } = await supabase.auth.getUser()

      if (loggedUser) {
        setUserId(loggedUser.id)
        setUserEmail(loggedUser.email || profile.email)
        setUserRole(profile.role)
        setUserName(profile.name)
        setUserCity(profile.city)
        setNewCity(profile.city)

        const matchedSeller = initialSellers.find((s) => s.owner_user_id === loggedUser.id)
        if (matchedSeller) {
          setMySellerProfile(matchedSeller)
          setPropSellerId(matchedSeller.id)
          setPropBusinessName(matchedSeller.business_name)
          setPropWhatsapp(matchedSeller.whatsapp || matchedSeller.phone || '573102223301')
          const sellerItems = initialListings.filter((l) => l.seller_id === matchedSeller.id)
          setMySellerListings(sellerItems)
          if (sellerItems[0]) setPropLinkedListingId(sellerItems[0].id)
        }
      }

      const pending = authGateInfo?.pendingAction
      setAuthGateInfo(null)
      showFeedback(
        'success',
        `¡Sesión activa como ${profile.businessName || profile.name} (${
          profile.role === 'buyer' ? 'Perfil Comprador' : 'Perfil Vendedor'
        })! Ahora todo registro y seguimiento quedará asociado a tu cuenta.`
      )
      if (pending) {
        setTimeout(() => pending(), 120)
      }
    } catch (err: any) {
      showFeedback(
        'error',
        err?.message || 'No se pudo iniciar sesión rápida. Verifica las credenciales.'
      )
    } finally {
      setQuickAuthLoading(false)
    }
  }

  // Abrir modal automáticamente si viene desde query param (?action=nueva o ?request=id&attend=1) verificando el perfil requerido
  useEffect(() => {
    if (!sessionChecked) return
    const action = searchParams?.get('action')
    const reqId = searchParams?.get('request')
    const attend = searchParams?.get('attend')
    const filterParam = searchParams?.get('filter')

    if (action === 'nueva') {
      requestBuyerAction(
        'Registrar Nueva Solicitud de Servicio o Producto',
        'Para registrar y hacer seguimiento a una nueva solicitud en el clasificado, debes iniciar sesión o registrarte con un Perfil Comprador.',
        () => setShowCreateModal(true)
      )
    }
    if (filterParam === 'mine') {
      requestBuyerAction(
        'Mis Solicitudes Registradas',
        'Inicia sesión con tu Perfil Comprador para consultar el seguimiento de tus solicitudes registradas.',
        () => setActiveTab('mine')
      )
    } else if (filterParam === 'service') {
      setActiveTab('services')
    } else if (filterParam === 'product') {
      setActiveTab('products')
    }
    if (reqId) {
      const found = requests.find((r) => r.id === reqId)
      if (found) {
        setDetailRequest(found)
        if (attend === '1') {
          requestSellerAction(
            `Aceptar y Atender Solicitud ${found.referenceCode}`,
            'La aceptación y atención del servicio solicitado por el comprador requiere que estés logueado con un Perfil Vendedor.',
            () => {
              setPropAcceptDirectly(true)
              setProposalTargetRequest(found)
            }
          )
        }
      }
    }
  }, [sessionChecked, searchParams])

  // Persistir cambios en localStorage, evento global y ad_slot (si tiene permisos)
  const persistRequests = async (nextList: BuyerClassifiedRequest[]) => {
    setRequests(nextList)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(BUYER_REQUESTS_STORAGE_KEY, JSON.stringify(nextList))
        window.dispatchEvent(new CustomEvent('buyer-requests-updated', { detail: nextList }))
      } catch {
        // Ignore storage quota
      }
    }
    try {
      const slotPayload = encodeBuyerRequestsToSlot(nextList)
      await supabase.from('ad_slot').upsert(slotPayload, { onConflict: 'id' })
    } catch {
      // Si el usuario actual es buyer sin RLS de escritura en ad_slot, localStorage y el estado mantienen todo sincronizado
    }
  }

  // Sincronizar modo de ventana si cambia la prop windowMode
  useEffect(() => {
    setCurrentWindow(windowMode)
    if (windowMode === 'buyer_window') {
      setActiveTab('mine')
    } else if (windowMode === 'seller_window') {
      setActiveTab('attending')
    }
  }, [windowMode])

  // Filtrado de Solicitudes
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (currentWindow === 'buyer_window') {
        const isMyReq = userId && req.buyerUserId === userId
        if (activeTab === 'mine' && userId) {
          const hasAnyMine = requests.some((r) => r.buyerUserId === userId)
          if (hasAnyMine && !isMyReq) return false
        } else if (activeTab === 'services' && req.requestType !== 'service') {
          return false
        } else if (activeTab === 'products' && req.requestType !== 'product') {
          return false
        }
      } else if (currentWindow === 'seller_window') {
        const isMyAttending =
          userId &&
          (req.proposals.some(
            (p) => p.sellerUserId === userId || (mySellerProfile && p.sellerId === mySellerProfile.id)
          ) ||
            req.contract?.sellerUserId === userId ||
            (mySellerProfile && req.contract?.sellerId === mySellerProfile.id))
        if (activeTab === 'attending' && userId) {
          const hasAnyAttending = requests.some(
            (r) =>
              r.proposals.some(
                (p) => p.sellerUserId === userId || (mySellerProfile && p.sellerId === mySellerProfile.id)
              ) ||
              r.contract?.sellerUserId === userId
          )
          if (hasAnyAttending && !isMyAttending) return false
        } else if (activeTab === 'services' && req.requestType !== 'service') {
          return false
        } else if (activeTab === 'products' && req.requestType !== 'product') {
          return false
        }
      } else {
        if (activeTab === 'services' && req.requestType !== 'service') return false
        if (activeTab === 'products' && req.requestType !== 'product') return false
      }

      if (categoryFilter !== 'all' && req.categorySlug !== categoryFilter) return false
      if (cityFilter !== 'all' && req.buyerCity !== cityFilter) return false
      if (urgencyFilter !== 'all' && req.urgency !== urgencyFilter) return false
      if (statusFilter !== 'all' && req.status !== statusFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = req.title.toLowerCase().includes(q)
        const matchDesc = req.description.toLowerCase().includes(q)
        const matchCat = req.categoryName.toLowerCase().includes(q)
        const matchRef = req.referenceCode.toLowerCase().includes(q)
        const matchBuyer = req.buyerName.toLowerCase().includes(q)
        const matchContract = req.contract?.contractCode.toLowerCase().includes(q)
        const matchSale = req.contract?.saleReferenceCode.toLowerCase().includes(q)
        if (!matchTitle && !matchDesc && !matchCat && !matchRef && !matchBuyer && !matchContract && !matchSale)
          return false
      }

      return true
    })
  }, [
    requests,
    currentWindow,
    activeTab,
    categoryFilter,
    cityFilter,
    urgencyFilter,
    statusFilter,
    searchQuery,
    userId,
    mySellerProfile,
  ])

  const visibleRequests = useMemo(() => {
    return itemsPerPage === 0 ? filteredRequests : filteredRequests.slice(0, itemsPerPage)
  }, [filteredRequests, itemsPerPage])

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      activeTab !== (currentWindow === 'buyer_window' ? 'mine' : currentWindow === 'seller_window' ? 'attending' : 'all') ||
      categoryFilter !== 'all' ||
      cityFilter !== 'all' ||
      urgencyFilter !== 'all' ||
      statusFilter !== 'all'
  )

  const clearAllFilters = () => {
    setSearchQuery('')
    setActiveTab(
      currentWindow === 'buyer_window'
        ? 'mine'
        : currentWindow === 'seller_window'
        ? 'attending'
        : 'all'
    )
    setCategoryFilter('all')
    setCityFilter('all')
    setUrgencyFilter('all')
    setStatusFilter('all')
  }

  // Estadísticas rápidas del clasificado y de contratos pactados
  const stats = useMemo(() => {
    const total = requests.length
    const servicesCount = requests.filter((r) => r.requestType === 'service').length
    const openCount = requests.filter((r) => r.status === 'open').length
    const inAttentionCount = requests.filter((r) => r.status === 'in_attention').length
    const ratedCount = requests.filter((r) => r.status === 'rated' || r.review).length
    const activeContractsCount = requests.filter(
      (r) => r.contract && r.contract.buyerAcceptedConditions && r.contract.sellerAcceptedConditions
    ).length
    return { total, servicesCount, openCount, inAttentionCount, ratedCount, activeContractsCount }
  }, [requests])

  // Generador / asegurador de estructura de Contrato Pactado a partir de una propuesta
  const buildOrGetContract = (
    req: BuyerClassifiedRequest,
    proposal: BuyerRequestProposal
  ): BuyerRequestContract => {
    if (req.contract && req.contract.proposalId === proposal.id) {
      return req.contract
    }
    const suffix = req.referenceCode.replace(/\D/g, '') || String(Math.floor(100000 + Math.random() * 900000))
    return {
      contractCode: `#CTO-${suffix}`,
      saleReferenceCode: `#VTA-${suffix}`,
      proposalId: proposal.id,
      buyerUserId: req.buyerUserId,
      buyerName: req.buyerName,
      sellerUserId: proposal.sellerUserId,
      sellerId: proposal.sellerId || null,
      sellerBusinessName: proposal.sellerBusinessName,
      sellerWhatsapp: proposal.sellerWhatsapp,
      agreedPriceCop: proposal.offeredPriceCop || req.budgetMaxCop || 120000,
      agreedScope: `${req.quantityOrScope} — ${proposal.message}`,
      agreedTimeline: proposal.estimatedTime || req.urgencyLabel,
      agreedWarranty: proposal.warrantyOffered || 'Garantía escrita de satisfacción',
      paymentTerms: 'Pago contra entrega y verificación de cumplimiento de condiciones',
      buyerAcceptedConditions: false,
      buyerAcceptedAt: null,
      sellerAcceptedConditions: true,
      sellerAcceptedAt: proposal.createdAt || new Date().toISOString(),
      contractStatus: 'pending_mutual_acceptance',
      progressPercent: 15,
      trackingLogs: [
        {
          id: `log-init-${Date.now()}`,
          actorRole: 'seller',
          actorName: `${proposal.sellerBusinessName} (Vendedor)`,
          milestoneType: 'seller_accepted_conditions',
          title: 'Condiciones técnicas y económicas propuestas por el Vendedor',
          detail: `Valor propuesto: $${(
            proposal.offeredPriceCop ||
            req.budgetMaxCop ||
            120000
          ).toLocaleString('es-CO')} COP • Plazo: ${proposal.estimatedTime} • Garantía: ${
            proposal.warrantyOffered
          }`,
          createdAt: proposal.createdAt || new Date().toISOString(),
        },
      ],
      createdAt: proposal.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  // 1. Registrar Nueva Solicitud de Comprador (Exige Perfil Comprador Logueado)
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || userRole !== 'buyer') {
      setShowCreateModal(false)
      setAuthGateInfo({
        requiredProfile: 'buyer',
        actionTitle: 'Registrar Solicitud de Servicio o Producto',
        actionDescription:
          'Para registrar una nueva solicitud y asociar todo su seguimiento a tu cuenta, debes iniciar sesión o registrarte con un Perfil Comprador.',
        pendingAction: () => setShowCreateModal(true),
      })
      return
    }
    if (!newTitle.trim() || !newDescription.trim()) {
      showFeedback('error', 'Por favor ingresa el título y la descripción detallada de tu necesidad.')
      return
    }

    setSavingNewReq(true)
    try {
      const matchedCat = categories.find((c) => c.slug === newCategorySlug)
      const urgencyMap: Record<BuyerRequestUrgency, string> = {
        immediate: '⚡ Urgente / Hoy mismo',
        '24_48h': '⏱️ En 24 a 48 horas',
        scheduled: '📅 Fecha Programada',
        flexible: '🤝 Horario Flexible',
      }
      const modalityMap: Record<BuyerRequestModality, string> = {
        home: newReqType === 'service' ? '🏠 A Domicilio' : '🏠 Entrega a Domicilio',
        in_person: '📍 Presencial en Punto / Taller',
        virtual: '💻 Virtual / Remoto',
        flexible: '🔄 Modalidad a Convenir',
      }

      const randomCode = Math.floor(100000 + Math.random() * 900000)
      const newReq: BuyerClassifiedRequest = {
        id: `req-${Date.now()}`,
        referenceCode: `#SOL-${randomCode}`,
        buyerUserId: userId,
        buyerName: userName || 'Comprador Verificado',
        buyerCity: newCity,
        buyerPhone: newWhatsapp || userPhone || '3001112201',
        buyerWhatsapp: newWhatsapp || userPhone || '3001112201',
        requestType: newReqType,
        categoryName:
          matchedCat?.name ||
          (newReqType === 'service' ? 'Servicios del hogar' : 'Productos y Suministros'),
        categorySlug: newCategorySlug,
        title: newTitle.trim(),
        description: newDescription.trim(),
        urgency: newUrgency,
        urgencyLabel: urgencyMap[newUrgency],
        modality: newModality,
        modalityLabel: modalityMap[newModality],
        preferredSchedule: newSchedule.trim() || 'Horario a convenir',
        budgetMinCop: newBudgetMin ? Number(newBudgetMin) : null,
        budgetMaxCop: newBudgetMax ? Number(newBudgetMax) : null,
        budgetUnit:
          newBudgetUnit.trim() || (newReqType === 'service' ? 'servicio completo' : 'unidad'),
        requiredExperienceOrSpec:
          newRequiredSpec.trim() ||
          (newReqType === 'service'
            ? 'Experiencia verificable y garantía del servicio'
            : 'Producto en óptimas condiciones con entrega segura'),
        quantityOrScope:
          newScope.trim() || (newReqType === 'service' ? '1 servicio completo' : '1 unidad'),
        status: 'open',
        selectedProposalId: null,
        proposals: [],
        contract: null,
        review: null,
        viewsCount: 1,
        createdAt: new Date().toISOString(),
      }

      const nextList = [newReq, ...requests]
      await persistRequests(nextList)
      setShowCreateModal(false)
      setNewTitle('')
      setNewDescription('')
      setNewBudgetMin('')
      setNewBudgetMax('')
      showFeedback(
        'success',
        `¡Solicitud ${newReq.referenceCode} registrada en tu Ventana de Comprador (${newReq.buyerName})! Ya está activa para recibir propuestas y pactar contrato.`
      )
    } finally {
      setSavingNewReq(false)
    }
  }

  // 2. Postularse y Aceptar Condiciones del Contrato como Vendedor (Exige Perfil Vendedor Logueado)
  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proposalTargetRequest) return
    if (!userId || userRole !== 'seller') {
      const target = proposalTargetRequest
      setProposalTargetRequest(null)
      setAuthGateInfo({
        requiredProfile: 'seller',
        actionTitle: `Aceptar y Atender Solicitud ${target.referenceCode}`,
        actionDescription:
          'La aceptación y atención del servicio solicitado por el comprador debe realizarse con un usuario logueado con Perfil Vendedor.',
        pendingAction: () => setProposalTargetRequest(target),
      })
      return
    }
    if (!propMessage.trim() || !propBusinessName.trim()) {
      showFeedback('error', 'Por favor completa tu nombre comercial y el detalle de tu propuesta de atención.')
      return
    }

    setSavingProposal(true)
    try {
      const selectedSeller =
        initialSellers.find((s) => s.id === propSellerId) || mySellerProfile
      const selectedListing = initialListings.find((l) => l.id === propLinkedListingId)
      const sellerAcceptsConditions = propAcceptDirectly
      const nowIso = new Date().toISOString()

      const newProposal: BuyerRequestProposal = {
        id: `prop-${Date.now()}`,
        requestId: proposalTargetRequest.id,
        sellerUserId: userId,
        sellerId: selectedSeller?.id || null,
        sellerBusinessName: selectedSeller?.business_name || propBusinessName.trim(),
        sellerCity: selectedSeller?.city || userCity || proposalTargetRequest.buyerCity,
        sellerWhatsapp:
          propWhatsapp.trim() || selectedSeller?.whatsapp || selectedSeller?.phone || '573102223301',
        sellerPhone: selectedSeller?.phone || propWhatsapp.trim() || null,
        sellerVerified: Boolean(selectedSeller?.verified ?? true),
        sellerRatingAvg: Number(selectedSeller?.rating_avg || 4.9),
        sellerRatingCount: Number(selectedSeller?.rating_count || 10),
        linkedListingId: selectedListing?.id || null,
        linkedListingTitle: selectedListing?.title || null,
        offeredPriceCop: propOfferedPrice ? Number(propOfferedPrice) : null,
        estimatedTime: propEstimatedTime.trim() || 'Inmediata',
        warrantyOffered: propWarranty.trim() || 'Garantía de satisfacción',
        message: propMessage.trim(),
        status: sellerAcceptsConditions ? 'accepted' : 'pending',
        createdAt: nowIso,
      }

      const suffix =
        proposalTargetRequest.referenceCode.replace(/\D/g, '') ||
        String(Math.floor(100000 + Math.random() * 900000))
      const agreedPrice =
        newProposal.offeredPriceCop || proposalTargetRequest.budgetMaxCop || 120000

      const generatedContract: BuyerRequestContract = {
        contractCode: `#CTO-${suffix}`,
        saleReferenceCode: `#VTA-${suffix}`,
        proposalId: newProposal.id,
        buyerUserId: proposalTargetRequest.buyerUserId,
        buyerName: proposalTargetRequest.buyerName,
        sellerUserId: userId,
        sellerId: newProposal.sellerId || null,
        sellerBusinessName: newProposal.sellerBusinessName,
        sellerWhatsapp: newProposal.sellerWhatsapp,
        agreedPriceCop: agreedPrice,
        agreedScope: `${proposalTargetRequest.quantityOrScope} — ${newProposal.message}`,
        agreedTimeline: newProposal.estimatedTime,
        agreedWarranty: newProposal.warrantyOffered,
        paymentTerms:
          propPaymentTerms.trim() ||
          'Pago contra entrega y verificación de cumplimiento de condiciones',
        buyerAcceptedConditions: Boolean(proposalTargetRequest.contract?.buyerAcceptedConditions),
        buyerAcceptedAt: proposalTargetRequest.contract?.buyerAcceptedAt || null,
        sellerAcceptedConditions: sellerAcceptsConditions,
        sellerAcceptedAt: sellerAcceptsConditions ? nowIso : null,
        contractStatus:
          proposalTargetRequest.contract?.buyerAcceptedConditions && sellerAcceptsConditions
            ? 'active_in_execution'
            : 'pending_mutual_acceptance',
        progressPercent:
          proposalTargetRequest.contract?.buyerAcceptedConditions && sellerAcceptsConditions
            ? 30
            : 15,
        trackingLogs: [
          {
            id: `log-${Date.now()}`,
            actorRole: 'seller',
            actorName: `${newProposal.sellerBusinessName} (Vendedor)`,
            milestoneType: sellerAcceptsConditions
              ? 'seller_accepted_conditions'
              : 'conditions_proposed',
            title: sellerAcceptsConditions
              ? 'El Vendedor registró propuesta y aceptó las condiciones del Contrato Pactado'
              : 'El Vendedor registró propuesta técnica y condiciones del servicio',
            detail: `Valor pactado: $${agreedPrice.toLocaleString('es-CO')} COP • Tiempo: ${
              newProposal.estimatedTime
            } • Garantía: ${newProposal.warrantyOffered}.`,
            createdAt: nowIso,
          },
          ...(proposalTargetRequest.contract?.trackingLogs || []),
        ],
        createdAt: proposalTargetRequest.contract?.createdAt || nowIso,
        updatedAt: nowIso,
      }

      const bothAccepted =
        generatedContract.buyerAcceptedConditions && generatedContract.sellerAcceptedConditions

      const nextList = requests.map((req) => {
        if (req.id !== proposalTargetRequest.id) return req
        return {
          ...req,
          status: bothAccepted || sellerAcceptsConditions ? ('in_attention' as const) : req.status,
          selectedProposalId: newProposal.id,
          proposals: [newProposal, ...req.proposals],
          contract: generatedContract,
        }
      })

      await persistRequests(nextList)
      const updatedReq = nextList.find((r) => r.id === proposalTargetRequest.id) || null
      if (detailRequest?.id === proposalTargetRequest.id) {
        setDetailRequest(updatedReq)
      }
      setProposalTargetRequest(null)
      setPropMessage('')
      setPropOfferedPrice('')
      if (updatedReq) {
        setContractWindowRequest(updatedReq)
      }
      showFeedback(
        'success',
        `¡Condiciones de Vendedor registradas en el Contrato ${generatedContract.contractCode} (Venta ${generatedContract.saleReferenceCode})! Se ha abierto la Ventana Independiente de Seguimiento del Contrato.`
      )
    } finally {
      setSavingProposal(false)
    }
  }

  // 3. Aceptación Bilateral de Condiciones del Contrato Pactado (Comprador y Vendedor deben aceptar condiciones)
  const handleAcceptContractConditions = async (
    req: BuyerClassifiedRequest,
    proposal: BuyerRequestProposal,
    partyToAccept: 'buyer' | 'seller'
  ) => {
    if (partyToAccept === 'buyer' && (!userId || userRole !== 'buyer')) {
      setAuthGateInfo({
        requiredProfile: 'buyer',
        actionTitle: `Aceptar Condiciones del Contrato (Comprador) • ${req.referenceCode}`,
        actionDescription:
          'Para aceptar las condiciones del contrato pactado por parte del comprador y activar el seguimiento, debes estar logueado con tu Perfil Comprador.',
        pendingAction: () => handleAcceptContractConditions(req, proposal, 'buyer'),
      })
      return
    }

    if (partyToAccept === 'seller' && (!userId || userRole !== 'seller')) {
      setAuthGateInfo({
        requiredProfile: 'seller',
        actionTitle: `Aceptar Condiciones del Contrato (Vendedor) • ${req.referenceCode}`,
        actionDescription:
          'Para aceptar las condiciones del contrato pactado por parte del vendedor y registrar la venta/servicio, debes estar logueado con tu Perfil Vendedor.',
        pendingAction: () => handleAcceptContractConditions(req, proposal, 'seller'),
      })
      return
    }

    const baseContract = buildOrGetContract(req, proposal)
    const nowIso = new Date().toISOString()

    const nextBuyerAccepted =
      partyToAccept === 'buyer' ? true : baseContract.buyerAcceptedConditions
    const nextSellerAccepted =
      partyToAccept === 'seller' ? true : baseContract.sellerAcceptedConditions
    const bothAccepted = nextBuyerAccepted && nextSellerAccepted

    const newLogs: BuyerRequestContractLog[] = [
      {
        id: `log-accept-${Date.now()}`,
        actorRole: partyToAccept,
        actorName:
          partyToAccept === 'buyer'
            ? `${userName || req.buyerName} (Comprador)`
            : `${mySellerProfile?.business_name || proposal.sellerBusinessName} (Vendedor)`,
        milestoneType:
          partyToAccept === 'buyer'
            ? 'buyer_accepted_conditions'
            : 'seller_accepted_conditions',
        title:
          partyToAccept === 'buyer'
            ? '✅ El Comprador aceptó oficialmente las condiciones del Contrato Pactado'
            : '✅ El Vendedor aceptó oficialmente las condiciones del Contrato Pactado',
        detail:
          partyToAccept === 'buyer'
            ? `Conformidad con tarifa de $${baseContract.agreedPriceCop.toLocaleString(
                'es-CO'
              )} COP, plazo (${baseContract.agreedTimeline}) y garantía (${baseContract.agreedWarranty}).`
            : `Compromiso técnico confirmado por $${baseContract.agreedPriceCop.toLocaleString(
                'es-CO'
              )} COP bajo el registro de venta ${baseContract.saleReferenceCode}.`,
        createdAt: nowIso,
      },
    ]

    if (bothAccepted && baseContract.contractStatus === 'pending_mutual_acceptance') {
      newLogs.unshift({
        id: `log-active-${Date.now() + 1}`,
        actorRole: 'system',
        actorName: 'Sistema de Contratos Indie Clasificados',
        milestoneType: 'contract_activated',
        title: `📜 Contrato Pactado ${baseContract.contractCode} Formalizado por Ambas Partes`,
        detail: `Tanto Comprador (${baseContract.buyerName}) como Vendedor (${baseContract.sellerBusinessName}) han aceptado las condiciones. Orden de venta/servicio ${baseContract.saleReferenceCode} activa en seguimiento.`,
        createdAt: nowIso,
      })
    }

    const updatedContract: BuyerRequestContract = {
      ...baseContract,
      buyerAcceptedConditions: nextBuyerAccepted,
      buyerAcceptedAt:
        partyToAccept === 'buyer' ? nowIso : baseContract.buyerAcceptedAt,
      sellerAcceptedConditions: nextSellerAccepted,
      sellerAcceptedAt:
        partyToAccept === 'seller' ? nowIso : baseContract.sellerAcceptedAt,
      contractStatus: bothAccepted
        ? 'active_in_execution'
        : 'pending_mutual_acceptance',
      progressPercent: bothAccepted
        ? Math.max(baseContract.progressPercent, 35)
        : baseContract.progressPercent,
      trackingLogs: [...newLogs, ...baseContract.trackingLogs],
      updatedAt: nowIso,
    }

    const nextList = requests.map((item) => {
      if (item.id !== req.id) return item
      return {
        ...item,
        status: bothAccepted ? ('in_attention' as const) : item.status,
        selectedProposalId: proposal.id,
        proposals: item.proposals.map((p) => ({
          ...p,
          status: p.id === proposal.id ? ('accepted' as const) : p.status,
        })),
        contract: updatedContract,
      }
    })

    await persistRequests(nextList)
    const updatedReq = nextList.find((r) => r.id === req.id) || null
    if (updatedReq) {
      setContractWindowRequest(updatedReq)
      setNewProgressPercent(updatedContract.progressPercent)
    }
    showFeedback(
      'success',
      bothAccepted
        ? `¡Contrato Pactado ${updatedContract.contractCode} formalizado con éxito! Tanto Comprador como Vendedor aceptaron las condiciones. Ya puedes gestionar el seguimiento en su ventana independiente.`
        : `¡Condiciones aceptadas por parte del ${
            partyToAccept === 'buyer' ? 'Comprador' : 'Vendedor'
          }! El contrato ${updatedContract.contractCode} ha sido actualizado.`
    )
  }

  // 3.B Registrar Hito de Seguimiento en el Contrato Pactado (Desde Ventana Comprador o Ventana Vendedor)
  const handleAddContractTrackingLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractWindowRequest || !contractWindowRequest.contract) return
    if (!userId || (userRole !== 'buyer' && userRole !== 'seller')) {
      setAuthGateInfo({
        requiredProfile: currentWindow === 'seller_window' ? 'seller' : 'buyer',
        actionTitle: `Registrar Seguimiento en Contrato ${contractWindowRequest.contract.contractCode}`,
        actionDescription:
          'Debes iniciar sesión con tu perfil de Comprador o Vendedor para agregar registros a la bitácora del contrato pactado.',
      })
      return
    }
    if (!newLogTitle.trim() || !newLogDetail.trim()) {
      showFeedback('error', 'Ingresa el título del registro y el detalle del avance o seguimiento.')
      return
    }

    setSavingContractUpdate(true)
    try {
      const currentContract = contractWindowRequest.contract
      const nowIso = new Date().toISOString()
      const actorRole: 'buyer' | 'seller' = userRole === 'seller' ? 'seller' : 'buyer'
      const actorName =
        actorRole === 'seller'
          ? `${mySellerProfile?.business_name || currentContract.sellerBusinessName} (Vendedor)`
          : `${userName || currentContract.buyerName} (Comprador)`

      let nextStatus = currentContract.contractStatus
      let nextProgress = newProgressPercent
      if (newLogMilestone === 'service_delivered') {
        nextStatus = 'delivered_pending_approval'
        nextProgress = Math.max(nextProgress, 90)
      } else if (newLogMilestone === 'buyer_conformity') {
        nextStatus = 'completed_fulfilled'
        nextProgress = 100
      } else if (
        currentContract.buyerAcceptedConditions &&
        currentContract.sellerAcceptedConditions &&
        nextStatus === 'pending_mutual_acceptance'
      ) {
        nextStatus = 'active_in_execution'
      }

      const newEntry: BuyerRequestContractLog = {
        id: `log-${Date.now()}`,
        actorRole,
        actorName,
        milestoneType: newLogMilestone,
        title: newLogTitle.trim(),
        detail: newLogDetail.trim(),
        createdAt: nowIso,
      }

      const updatedContract: BuyerRequestContract = {
        ...currentContract,
        contractStatus: nextStatus,
        progressPercent: nextProgress,
        trackingLogs: [newEntry, ...currentContract.trackingLogs],
        updatedAt: nowIso,
      }

      const nextList = requests.map((item) => {
        if (item.id !== contractWindowRequest.id) return item
        return {
          ...item,
          status:
            nextStatus === 'completed_fulfilled' && item.status === 'open'
              ? ('in_attention' as const)
              : item.status,
          contract: updatedContract,
        }
      })

      await persistRequests(nextList)
      const updatedReq = nextList.find((r) => r.id === contractWindowRequest.id) || null
      setContractWindowRequest(updatedReq)
      setNewLogTitle('')
      setNewLogDetail('')
      showFeedback(
        'success',
        `¡Registro de seguimiento añadido al Contrato ${updatedContract.contractCode} (${updatedContract.saleReferenceCode}) como ${
          actorRole === 'buyer' ? 'Comprador' : 'Vendedor'
        }!`
      )
    } finally {
      setSavingContractUpdate(false)
    }
  }

  // 4. Calificar la Atención Recibida (Exige Perfil Comprador Logueado y alimenta el sistema oficial de reputación)
  const handleConfirmRating = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ratingTargetRequest) return
    if (!userId || userRole !== 'buyer') {
      const target = ratingTargetRequest
      setRatingTargetRequest(null)
      setAuthGateInfo({
        requiredProfile: 'buyer',
        actionTitle: `Calificar Atención • ${target.referenceCode}`,
        actionDescription:
          'Solo un usuario logueado con Perfil Comprador puede registrar la calificación oficial de la atención recibida.',
        pendingAction: () => setRatingTargetRequest(target),
      })
      return
    }
    if (ratingComment.trim().length < 10) {
      showFeedback(
        'error',
        'El comentario de calificación debe tener al menos 10 caracteres para validar la reputación del prestador.'
      )
      return
    }

    setSavingRating(true)
    try {
      const acceptedProposal =
        ratingTargetRequest.proposals.find((p) => p.id === ratingTargetRequest.selectedProposalId) ||
        ratingTargetRequest.proposals[0]

      // Si el prestador tiene sellerId y listingId reales en base de datos, insertar también en public.review y public.sale
      if (userId && acceptedProposal?.sellerId) {
        let targetListingId = acceptedProposal.linkedListingId
        if (!targetListingId) {
          const fallbackListing = initialListings.find(
            (l) => l.seller_id === acceptedProposal.sellerId
          )
          targetListingId = fallbackListing?.id || null
        }

        if (targetListingId) {
          try {
            const { data: insertedSale } = await supabase
              .from('sale')
              .insert({
                seller_id: acceptedProposal.sellerId,
                listing_id: targetListingId,
                buyer_id: userId,
                buyer_name: ratingTargetRequest.buyerName,
                buyer_phone: ratingTargetRequest.buyerWhatsapp || ratingTargetRequest.buyerPhone,
                quantity: 1,
                unit_price:
                  ratingTargetRequest.contract?.agreedPriceCop ||
                  acceptedProposal.offeredPriceCop ||
                  ratingTargetRequest.budgetMaxCop ||
                  95000,
                total_amount:
                  ratingTargetRequest.contract?.agreedPriceCop ||
                  acceptedProposal.offeredPriceCop ||
                  ratingTargetRequest.budgetMaxCop ||
                  95000,
                type: ratingTargetRequest.requestType,
                status: 'completed',
                service_duration: acceptedProposal.estimatedTime,
                notes: `Contrato Pactado ${
                  ratingTargetRequest.contract?.contractCode || ratingTargetRequest.referenceCode
                } (${ratingTargetRequest.contract?.saleReferenceCode || 'Venta Directa'}): ${
                  ratingTargetRequest.title
                }`,
                has_reviewed: true,
              })
              .select('id')
              .maybeSingle()

            await supabase.from('review').insert({
              listing_id: targetListingId,
              seller_id: acceptedProposal.sellerId,
              buyer_user_id: userId,
              sale_id: insertedSale?.id || null,
              rating: ratingValue,
              comment: `[Contrato ${
                ratingTargetRequest.contract?.contractCode || ratingTargetRequest.referenceCode
              }] ${ratingComment.trim()}`,
              recommend: ratingRecommend,
              status: 'published',
            })
          } catch {
            // Si RLS restringe, el estado del clasificado guarda igualmente la reseña verificada
          }
        }
      }

      const reviewRecord = {
        rating: ratingValue,
        comment: ratingComment.trim(),
        recommend: ratingRecommend,
        reviewedAt: new Date().toISOString(),
        sellerId: acceptedProposal?.sellerId || null,
        sellerBusinessName:
          acceptedProposal?.sellerBusinessName || 'Prestador Calificado',
      }

      const nowIso = new Date().toISOString()
      const nextList = requests.map((item) => {
        if (item.id !== ratingTargetRequest.id) return item
        const baseContract = acceptedProposal
          ? buildOrGetContract(item, acceptedProposal)
          : item.contract || null
        const completedContract: BuyerRequestContract | null = baseContract
          ? {
              ...baseContract,
              buyerAcceptedConditions: true,
              sellerAcceptedConditions: true,
              contractStatus: 'completed_fulfilled',
              progressPercent: 100,
              trackingLogs: [
                {
                  id: `log-rated-${Date.now()}`,
                  actorRole: 'buyer',
                  actorName: `${userName || item.buyerName} (Comprador)`,
                  milestoneType: 'buyer_conformity',
                  title: `⭐ Contrato Finalizado y Calificado con ${ratingValue}.0 ★`,
                  detail: `Calificación oficial otorgada a ${reviewRecord.sellerBusinessName}: "${ratingComment.trim()}"`,
                  createdAt: nowIso,
                },
                ...baseContract.trackingLogs,
              ],
              updatedAt: nowIso,
            }
          : null

        return {
          ...item,
          status: 'rated' as const,
          contract: completedContract,
          review: reviewRecord,
        }
      })

      await persistRequests(nextList)
      const updatedReq = nextList.find((r) => r.id === ratingTargetRequest.id) || null
      if (detailRequest?.id === ratingTargetRequest.id) {
        setDetailRequest(updatedReq)
      }
      if (contractWindowRequest?.id === ratingTargetRequest.id) {
        setContractWindowRequest(updatedReq)
      }
      setRatingTargetRequest(null)
      setRatingComment('')
      setRatingValue(5)
      showFeedback(
        'success',
        `¡Calificación de ${ratingValue} ★ registrada y Contrato cerrado a conformidad para ${reviewRecord.sellerBusinessName}!`
      )
    } finally {
      setSavingRating(false)
    }
  }

  const isBuyerSession = Boolean(userId && (userRole === 'buyer' || userRole === 'admin'))
  const isSellerSession = Boolean(userId && (userRole === 'seller' || userRole === 'admin'))

  return (
    <main className="flex-1 bg-zinc-50/40 dark:bg-zinc-950">
      {/* ========================================================================= */}
      {/* MODO 1: TABLERO DE SOLICITUDES (/solicitudes) — ESTILO CATÁLOGO LIMPIO    */}
      {/* Solo ítems con su panel de búsqueda y filtros, sin botones de acción/login */}
      {/* ========================================================================= */}
      {currentWindow === 'board' ? (
        <>
          {/* Cabecera y Panel de Búsqueda y Filtros (Idéntico al Catálogo de Servicios o Productos) */}
          <section className="border-b border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-0.5 text-[11px] font-bold text-teal-800 dark:bg-teal-950/60 dark:border-teal-800 dark:text-teal-300 mb-2">
                    📜 {locale === 'en' ? 'Contracts Directory' : 'Directorio de Contratos'}
                  </span>
                  <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {locale === 'en'
                      ? 'Service & Product Requests Board'
                      : 'Tablero de Solicitudes de Servicios y Productos'}
                  </h1>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {locale === 'en'
                      ? 'Explore active service and product requests with priority on professional service requirements.'
                      : 'Explora las necesidades de servicios y productos registradas en el directorio de contratos.'}
                  </p>
                </div>
              </div>

              {/* Caja de Filtros Estilo Catálogo */}
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                  {/* Búsqueda por palabra clave */}
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {locale === 'en' ? 'Search' : 'Buscar solicitud'}
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        locale === 'en'
                          ? 'Service, product, #SOL code, city...'
                          : 'Servicio, producto, código #SOL o ciudad...'
                      }
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  {/* Tipo (Todos / Servicios / Productos) */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {locale === 'en' ? 'Request Type' : 'Tipo de Solicitud'}
                    </label>
                    <div className="flex rounded-xl border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
                      <button
                        type="button"
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 rounded-lg py-1 text-xs font-semibold transition-all cursor-pointer ${
                          activeTab === 'all'
                            ? 'bg-teal-600 text-white shadow-2xs'
                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                        }`}
                      >
                        {locale === 'en' ? 'All' : 'Todos'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('services')}
                        className={`flex-1 rounded-lg py-1 text-xs font-semibold transition-all cursor-pointer ${
                          activeTab === 'services'
                            ? 'bg-teal-600 text-white shadow-2xs'
                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                        }`}
                      >
                        {locale === 'en' ? 'Services' : 'Servicios'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 rounded-lg py-1 text-xs font-semibold transition-all cursor-pointer ${
                          activeTab === 'products'
                            ? 'bg-teal-600 text-white shadow-2xs'
                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                        }`}
                      >
                        {locale === 'en' ? 'Products' : 'Productos'}
                      </button>
                    </div>
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {locale === 'en' ? 'Category' : 'Categoría'}
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <option value="all">
                        {locale === 'en' ? 'All categories' : 'Todas las categorías'}
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.slug}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {locale === 'en' ? 'City' : 'Ciudad'}
                    </label>
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <option value="all">
                        {locale === 'en' ? 'All cities' : 'Todas las ciudades'}
                      </option>
                      {COLOMBIA_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Urgencia / Estado */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {locale === 'en' ? 'Urgency' : 'Urgencia Requerida'}
                    </label>
                    <select
                      value={urgencyFilter}
                      onChange={(e) => setUrgencyFilter(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <option value="all">
                        {locale === 'en' ? 'Any urgency' : 'Cualquier urgencia'}
                      </option>
                      <option value="immediate">⚡ Urgente / Hoy mismo</option>
                      <option value="24_48h">⏱️ En 24 a 48 horas</option>
                      <option value="scheduled">📅 Fecha Programada</option>
                      <option value="flexible">🤝 Horario Flexible</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-200/70 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {locale === 'en' ? 'Status:' : 'Estado de solicitud:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'all'
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                          : 'bg-white text-zinc-600 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'
                      }`}
                    >
                      Todos ({requests.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('open')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'open'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-zinc-600 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'
                      }`}
                    >
                      🟢 Buscando Atención ({stats.openCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('in_attention')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'in_attention'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white text-zinc-600 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'
                      }`}
                    >
                      📜 En Contrato Pactado ({stats.inAttentionCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('rated')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'rated'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-zinc-600 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'
                      }`}
                    >
                      ⭐ Atendidas y Calificadas ({stats.ratedCount})
                    </button>
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-500 dark:text-teal-400 cursor-pointer"
                    >
                      ✕ {locale === 'en' ? 'Clear filters' : 'Limpiar filtros'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Resultados del Tablero de Solicitudes (Solo visualización de ítems como en el Catálogo) */}
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-bold text-zinc-900 dark:text-zinc-50">
                  {filteredRequests.length}
                </span>{' '}
                {locale === 'en' ? 'requests found' : 'solicitudes encontradas'}
                {itemsPerPage > 0 && filteredRequests.length > itemsPerPage && (
                  <span className="ml-1 text-xs text-zinc-400">
                    ({locale === 'en' ? 'showing' : 'mostrando'} {visibleRequests.length})
                  </span>
                )}
              </p>

              {/* Controles de Cantidad de Ítems y Vista Lista / Cuadrícula (Igual que en Catálogo) */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                  <label
                    htmlFor="requests-items-limit"
                    className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
                  >
                    {locale === 'en' ? 'Load:' : 'Cargar:'}
                  </label>
                  <select
                    id="requests-items-limit"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-transparent text-xs font-bold text-zinc-800 focus:outline-none dark:text-zinc-200 cursor-pointer"
                  >
                    <option value={10}>10 {locale === 'en' ? 'items' : 'ítems'}</option>
                    <option value={15}>15 {locale === 'en' ? 'items' : 'ítems'}</option>
                    <option value={20}>20 {locale === 'en' ? 'items' : 'ítems'}</option>
                    <option value={30}>30 {locale === 'en' ? 'items' : 'ítems'}</option>
                    <option value={50}>50 {locale === 'en' ? 'items' : 'ítems'}</option>
                    <option value={0}>{locale === 'en' ? 'All' : 'Todos'}</option>
                  </select>
                </div>

                <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-white p-1 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                  >
                    <span>{locale === 'en' ? 'List' : 'Lista'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                  >
                    <span>{locale === 'en' ? 'Grid' : 'Cuadrícula'}</span>
                  </button>
                </div>
              </div>
            </div>

            {visibleRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  {locale === 'en'
                    ? 'No requests match your filters'
                    : 'No se encontraron solicitudes con los filtros seleccionados'}
                </h3>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'list'
                    ? 'flex flex-col gap-1.5 sm:gap-2'
                    : 'grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3'
                }
              >
                {visibleRequests.map((req) => {
                  const isService = req.requestType === 'service'
                  const primaryProposal =
                    req.proposals.find((p) => p.id === req.selectedProposalId) || req.proposals[0]
                  const activeContract = primaryProposal
                    ? buildOrGetContract(req, primaryProposal)
                    : req.contract || null

                  if (viewMode === 'list') {
                    return (
                      <article
                        key={req.id}
                        className="flex items-center justify-between gap-2 sm:gap-5 rounded-xl border border-zinc-200/90 bg-white px-2.5 py-2.5 sm:px-4 sm:py-3 shadow-2xs transition-all hover:border-teal-300 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        {/* Izquierda: 3 líneas expandidas horizontalmente en móvil y con margen amplio antes de la derecha en web */}
                        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1 pr-1 sm:pr-6">
                          {/* Línea 1: Tipo + Título + Código */}
                          <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">
                            <span
                              className={`shrink-0 rounded border px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold leading-none ${
                                isService
                                  ? 'border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-200'
                                  : 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
                              }`}
                            >
                              {isService ? 'Servicio' : 'Producto'}
                            </span>
                            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate min-w-0 flex-1">
                              {req.title}
                            </h2>
                            <span className="hidden sm:inline-block shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {req.referenceCode}
                            </span>
                          </div>

                          {/* Línea 2: Línea adicional de texto informativo / descripción de la solicitud */}
                          <p className="w-full truncate text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400">
                            {req.description}
                          </p>

                          {/* Línea 3: Metadatos redistribuidos con buen espaciado */}
                          <div className="w-full flex items-center justify-between gap-2 sm:gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate min-w-0">
                              {req.buyerName}
                            </span>
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                              <span className="font-semibold text-teal-600 dark:text-teal-400">
                                {req.buyerCity}
                              </span>
                              {req.categoryName && (
                                <span className="hidden xs:inline sm:inline truncate max-w-[120px]">{req.categoryName}</span>
                              )}
                              <span className="hidden md:inline">{req.urgencyLabel}</span>
                              <span className="hidden lg:inline text-zinc-400">{req.modalityLabel}</span>
                            </div>
                          </div>
                        </div>

                        {/* Derecha: En móvil presupuesto sobre estado/acciones; en web en fila */}
                        <div className="flex flex-col items-end justify-center gap-1 sm:flex-row sm:items-center sm:gap-2.5 shrink-0 pl-2 sm:pl-4 border-l border-zinc-100 dark:border-zinc-800/80">
                          <span className="text-[11px] sm:text-xs font-extrabold text-teal-600 dark:text-teal-400 whitespace-nowrap leading-tight">
                            {req.budgetMaxCop !== null
                              ? req.budgetMinCop
                                ? `$${req.budgetMinCop.toLocaleString('es-CO')} - $${req.budgetMaxCop.toLocaleString('es-CO')}`
                                : `Hasta $${req.budgetMaxCop.toLocaleString('es-CO')}`
                              : 'Cotizar'}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="hidden sm:inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 whitespace-nowrap">
                              {req.proposals.length} {req.proposals.length === 1 ? 'postulación' : 'postulaciones'}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${
                                req.status === 'open'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : req.status === 'in_attention'
                                  ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              }`}
                            >
                              {req.status === 'open'
                                ? 'Abierta'
                                : req.status === 'in_attention'
                                ? 'En Contrato'
                                : 'Atendida'}
                            </span>
                          </div>
                        </div>
                      </article>
                    )
                  }

                  return (
                    <article
                      key={req.id}
                      className="rounded-2xl border border-zinc-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between"
                    >
                      <div className="space-y-3 flex-1 min-w-0">
                        {/* Etiquetas de Tipo, Referencia y Estado */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[11px] font-bold ${
                                isService
                                  ? 'border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-200'
                                  : 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
                              }`}
                            >
                              {isService ? 'Solicitud de Servicio' : 'Solicitud de Producto'}
                            </span>
                            <span className="rounded-lg bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {req.referenceCode}
                            </span>
                            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                              {req.categoryName}
                            </span>
                            {activeContract && (
                              <span className="rounded-lg bg-teal-50 border border-teal-200 px-2 py-0.5 font-mono text-[11px] font-bold text-teal-800 dark:bg-teal-950/60 dark:border-teal-800 dark:text-teal-300">
                                {activeContract.contractCode}
                              </span>
                            )}
                          </div>

                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${
                              req.status === 'open'
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : req.status === 'in_attention'
                                ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                            }`}
                          >
                            {req.status === 'open'
                              ? 'Abierta para Atención'
                              : req.status === 'in_attention'
                              ? 'En Contrato / Atención'
                              : 'Atendida y Calificada'}
                          </span>
                        </div>

                        {/* Título y Datos del Solicitante */}
                        <div>
                          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
                            {req.title}
                          </h2>
                          <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs text-zinc-500">
                            <span>
                              Solicitante:{' '}
                              <strong className="text-zinc-800 dark:text-zinc-200">
                                {req.buyerName}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-teal-600 dark:text-teal-400">
                              {req.buyerCity}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(req.createdAt).toLocaleDateString('es-CO', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Descripción */}
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-2">
                          {req.description}
                        </p>

                        {/* Ficha Técnica de la Solicitud */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-800/50">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                              Urgencia:
                            </span>
                            <strong className="text-zinc-800 dark:text-zinc-200 mt-0.5 block truncate">
                              {req.urgencyLabel}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                              Modalidad:
                            </span>
                            <strong className="text-zinc-800 dark:text-zinc-200 mt-0.5 block truncate">
                              {req.modalityLabel}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                              Horario:
                            </span>
                            <strong
                              className="text-zinc-800 dark:text-zinc-200 mt-0.5 block truncate"
                              title={req.preferredSchedule}
                            >
                              {req.preferredSchedule}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                              Alcance:
                            </span>
                            <strong
                              className="text-zinc-800 dark:text-zinc-200 mt-0.5 block truncate"
                              title={req.quantityOrScope}
                            >
                              {req.quantityOrScope}
                            </strong>
                          </div>
                        </div>

                        {/* Calificación si ya fue atendida */}
                        {req.review && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs dark:border-amber-900/60 dark:bg-amber-950/30 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-amber-900 dark:text-amber-200 font-semibold">
                              Atendido por <strong>{req.review.sellerBusinessName}</strong> — &ldquo;
                              {req.review.comment}&rdquo;
                            </span>
                            <span className="font-black text-amber-500">
                              ★ {req.review.rating.toFixed(1)} / 5.0
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Columna derecha / inferior: Presupuesto e Indicador de Postulaciones (Sin botones ni enlaces) */}
                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                            Presupuesto ({req.budgetUnit})
                          </span>
                          <span className="mt-0.5 text-base font-black text-teal-600 dark:text-teal-400 block">
                            {req.budgetMaxCop !== null
                              ? req.budgetMinCop
                                ? `$${req.budgetMinCop.toLocaleString('es-CO')} - $${req.budgetMaxCop.toLocaleString('es-CO')}`
                                : `Hasta $${req.budgetMaxCop.toLocaleString('es-CO')}`
                              : 'Abierto a Cotizaciones'}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                          <div className="rounded-lg bg-zinc-100 px-2.5 py-1 font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            {req.proposals.length}{' '}
                            {req.proposals.length === 1
                              ? 'postulación registrada'
                              : 'postulaciones registradas'}
                          </div>
                          {activeContract && (
                            <div className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                              Avance contrato: {activeContract.progressPercent}%
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        /* ========================================================================= */
        /* MODO 2 Y 3: VENTANA DEL COMPRADOR (/solicitudes/comprador) Y              */
        /*             VENTANA DEL VENDEDOR (/solicitudes/vendedor)                  */
        /* Visualización exclusiva desde la respectiva sesión con formularios/botones */
        /* ========================================================================= */
        <div className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Banner de notificación */}
          {notice && (
            <div
              className={`rounded-2xl border p-4 text-xs font-bold shadow-sm flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
                notice.type === 'success'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                  : 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200'
              }`}
            >
              <span>{notice.type === 'success' ? `✅ ${notice.text}` : `⚠️ ${notice.text}`}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="text-sm font-black opacity-70 hover:opacity-100 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Verificación de sesión requerida para la ventana correspondiente */}
          {currentWindow === 'buyer_window' && !isBuyerSession ? (
            <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
              <span className="text-4xl">🛒</span>
              <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                Ventana del Comprador — Sesión de Comprador Requerida
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-xl mx-auto">
                La visualización y gestión de la Ventana del Comprador está habilitada exclusivamente desde una sesión activa con Perfil Comprador. Inicia sesión desde el menú lateral izquierdo para registrar solicitudes, aceptar condiciones y hacer seguimiento a tus contratos pactados.
              </p>
            </section>
          ) : currentWindow === 'seller_window' && !isSellerSession ? (
            <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
              <span className="text-4xl">🏪</span>
              <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                Ventana del Vendedor — Sesión de Vendedor Requerida
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-xl mx-auto">
                La visualización y gestión de la Ventana del Vendedor está habilitada exclusivamente desde una sesión activa con Perfil Vendedor. Inicia sesión desde el menú lateral izquierdo para postularte a solicitudes, aceptar condiciones de contrato y gestionar tus ventas de atención (#VTA).
              </p>
            </section>
          ) : (
            <>
              {/* PANEL DE CONTROL DE CONTRATOS PACTADOS Y FORMULARIO (SEGÚN SESIÓN ACTIVA) */}
              <section
                className={`rounded-3xl border-2 p-6 shadow-md space-y-4 ${
                  currentWindow === 'buyer_window'
                    ? 'border-teal-300 bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/60 dark:border-teal-800 dark:from-teal-950/40 dark:via-zinc-900 dark:to-emerald-950/20'
                    : 'border-purple-300 bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/60 dark:border-purple-800 dark:from-purple-950/40 dark:via-zinc-900 dark:to-indigo-950/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/80 pb-4 dark:border-zinc-800">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                        currentWindow === 'buyer_window'
                          ? 'bg-teal-600 text-white'
                          : 'bg-purple-600 text-white'
                      }`}
                    >
                      {currentWindow === 'buyer_window'
                        ? `🛒 Directorio de Contratos • Ventana del Comprador (${userName})`
                        : `🏪 Directorio de Contratos • Ventana del Vendedor (${
                            mySellerProfile?.business_name || userName
                          })`}
                    </span>
                    <h1 className="mt-1.5 text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
                      {currentWindow === 'buyer_window'
                        ? 'Mis Solicitudes Registradas, Aceptación de Condiciones y Contratos Pactados'
                        : 'Mis Ventas de Atención (#VTA), Aceptación de Condiciones y Contratos Pactados'}
                    </h1>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {currentWindow === 'buyer_window'
                        ? 'Registra aquí tus nuevas solicitudes de servicio o producto, acepta las condiciones propuestas por el vendedor y realiza el seguimiento del contrato hasta calificar.'
                        : 'Postúlate a las solicitudes de los compradores, acepta las condiciones del contrato pactado y registra cada avance técnico de la venta (#VTA).'}
                    </p>
                  </div>

                  {/* Botones de Formulario y Filtro en la Ventana del Comprador / Vendedor */}
                  <div className="flex flex-wrap items-center gap-2">
                    {currentWindow === 'buyer_window' && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewReqType('service')
                          setShowCreateModal(true)
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-xs sm:text-sm font-black text-white shadow-sm hover:bg-teal-500 transition-all cursor-pointer"
                      >
                        <span>➕</span>
                        <span>Registrar Nueva Solicitud de Servicio / Producto</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          activeTab === 'all'
                            ? currentWindow === 'buyer_window'
                              ? 'mine'
                              : 'attending'
                            : 'all'
                        )
                      }
                      className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                    >
                      {activeTab === 'all'
                        ? currentWindow === 'buyer_window'
                          ? '🛒 Ver Mis Solicitudes y Contratos'
                          : '🏪 Ver Mis Ventas y Contratos'
                        : '🔍 Ver Todas las Solicitudes para Operar'}
                    </button>
                  </div>
                </div>

                {/* Tarjetas resumen de Contratos Pactados activos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {requests
                    .filter((r) => r.contract || r.proposals.length > 0)
                    .slice(0, 6)
                    .map((req) => {
                      const primaryProp =
                        req.proposals.find((p) => p.id === req.selectedProposalId) ||
                        req.proposals[0]
                      if (!primaryProp) return null
                      const contract = buildOrGetContract(req, primaryProp)
                      const bothAccepted =
                        contract.buyerAcceptedConditions && contract.sellerAcceptedConditions

                      return (
                        <div
                          key={`cto-card-${req.id}`}
                          className="flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="rounded-lg bg-zinc-900 px-2 py-0.5 font-mono text-[11px] font-black text-white dark:bg-zinc-100 dark:text-zinc-900">
                                {contract.contractCode}
                              </span>
                              <span className="rounded-lg bg-purple-100 px-2 py-0.5 font-mono text-[10px] font-black text-purple-900 dark:bg-purple-950 dark:text-purple-200">
                                Venta {contract.saleReferenceCode}
                              </span>
                            </div>

                            <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 line-clamp-1">
                              {req.title}
                            </h4>

                            <div className="text-[11px] text-zinc-600 dark:text-zinc-400 space-y-0.5">
                              <div>
                                🛒 Comprador: <strong>{contract.buyerName}</strong>
                              </div>
                              <div>
                                🏪 Vendedor: <strong>{contract.sellerBusinessName}</strong>
                              </div>
                              <div className="font-black text-emerald-600 dark:text-emerald-400">
                                💰 Valor Pactado: ${contract.agreedPriceCop.toLocaleString('es-CO')} COP
                              </div>
                            </div>

                            {/* Estado de Doble Aceptación de Condiciones */}
                            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                              <div
                                className={`rounded-lg border px-2 py-1 font-bold ${
                                  contract.buyerAcceptedConditions
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                }`}
                              >
                                🛒 Comprador:{' '}
                                {contract.buyerAcceptedConditions ? '✓ Aceptó' : '⏳ Pendiente'}
                              </div>
                              <div
                                className={`rounded-lg border px-2 py-1 font-bold ${
                                  contract.sellerAcceptedConditions
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                }`}
                              >
                                🏪 Vendedor:{' '}
                                {contract.sellerAcceptedConditions ? '✓ Aceptó' : '⏳ Pendiente'}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-1.5">
                            {currentWindow === 'buyer_window' && !contract.buyerAcceptedConditions && (
                              <button
                                type="button"
                                onClick={() => handleAcceptContractConditions(req, primaryProp, 'buyer')}
                                className="w-full rounded-xl bg-teal-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-teal-500 cursor-pointer"
                              >
                                ✅ Aceptar Condiciones (Comprador)
                              </button>
                            )}
                            {currentWindow === 'seller_window' && !contract.sellerAcceptedConditions && (
                              <button
                                type="button"
                                onClick={() => handleAcceptContractConditions(req, primaryProp, 'seller')}
                                className="w-full rounded-xl bg-purple-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-purple-500 cursor-pointer"
                              >
                                ✅ Aceptar Condiciones (Vendedor)
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const ensured = { ...req, contract }
                                setContractWindowRequest(ensured)
                                setNewProgressPercent(contract.progressPercent)
                              }}
                              className="w-full rounded-xl bg-zinc-900 px-3 py-2 text-[11px] font-black text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
                            >
                              📂 Abrir Ventana de Seguimiento ({bothAccepted ? 'Contrato Activo' : 'Revisar Pacto'})
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </section>

              {/* Filtros de búsqueda dentro de la Ventana del Comprador / Vendedor */}
              <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por servicio, #SOL, #CTO, #VTA o ciudad..."
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:border-teal-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />

                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="all">📍 Todas las ciudades</option>
                    {COLOMBIA_CITIES.map((city) => (
                      <option key={city} value={city}>
                        📍 {city}
                      </option>
                    ))}
                  </select>

                  <select
                    value={urgencyFilter}
                    onChange={(e) => setUrgencyFilter(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="all">⏱️ Cualquier urgencia</option>
                    <option value="immediate">⚡ Urgente / Hoy mismo</option>
                    <option value="24_48h">⏱️ En 24 a 48 horas</option>
                    <option value="scheduled">📅 Fecha Programada</option>
                    <option value="flexible">🤝 Horario Flexible</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="all">🔄 Todos los estados</option>
                    <option value="open">🟢 Abiertas (Buscando quien atienda)</option>
                    <option value="in_attention">⚙️ En Contrato / Proceso de Atención</option>
                    <option value="rated">⭐ Atendidas y Calificadas</option>
                  </select>
                </div>
              </section>

              {/* Listado de Tarjetas con Botones de Acción de la Ventana Correspondiente */}
              {filteredRequests.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-4xl">📋</span>
                  <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-50">
                    No se encontraron solicitudes con los filtros seleccionados
                  </h3>
                  {currentWindow === 'buyer_window' && (
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition-colors cursor-pointer"
                    >
                      <span>➕</span>
                      <span>Registrar Nueva Solicitud Ahora</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {filteredRequests.map((req) => {
                    const isService = req.requestType === 'service'
                    const primaryProposal =
                      req.proposals.find((p) => p.id === req.selectedProposalId) || req.proposals[0]
                    const activeContract = primaryProposal
                      ? buildOrGetContract(req, primaryProposal)
                      : req.contract || null

                    return (
                      <article
                        key={req.id}
                        className="flex flex-col justify-between rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-xs hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="space-y-4">
                          {/* Cabecera de la tarjeta */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1 text-xs font-extrabold ${
                                  isService
                                    ? 'border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-200'
                                    : 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
                                }`}
                              >
                                {isService ? '🛠️ Solicitud de Servicio' : '📦 Solicitud de Producto'}
                              </span>
                              <span className="rounded-lg bg-zinc-100 px-2.5 py-1 font-mono text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                {req.referenceCode}
                              </span>
                              {activeContract && (
                                <span className="rounded-lg bg-teal-100 px-2.5 py-1 font-mono text-[11px] font-black text-teal-900 dark:bg-teal-950 dark:text-teal-300">
                                  📜 {activeContract.contractCode}
                                </span>
                              )}
                            </div>

                            <span
                              className={`rounded-full border px-3 py-1 text-[11px] font-extrabold ${
                                req.status === 'open'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : req.status === 'in_attention'
                                  ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              }`}
                            >
                              {req.status === 'open'
                                ? '🟢 Abierta para Atención'
                                : req.status === 'in_attention'
                                ? '📜 En Contrato / Atención'
                                : '⭐ Atendida y Calificada'}
                            </span>
                          </div>

                          {/* Título y Comprador */}
                          <div>
                            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 leading-snug">
                              {req.title}
                            </h2>
                            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                              <span>
                                🛒 Comprador solicitante:{' '}
                                <strong className="text-zinc-800 dark:text-zinc-200">
                                  {req.buyerName}
                                </strong>
                              </span>
                              <span>•</span>
                              <span className="font-bold text-teal-600 dark:text-teal-400">
                                📍 {req.buyerCity}
                              </span>
                              <span>•</span>
                              <span>
                                📅{' '}
                                {new Date(req.createdAt).toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'short',
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Descripción de la necesidad */}
                          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {req.description}
                          </p>

                          {/* Ficha Técnica Estructurada */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-2xl border border-teal-100 bg-teal-50/50 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-800/50">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                                Urgencia:
                              </span>
                              <strong className="text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                                {req.urgencyLabel}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                                Modalidad:
                              </span>
                              <strong className="text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                                {req.modalityLabel}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                                Horario Preferido:
                              </span>
                              <strong
                                className="text-zinc-900 dark:text-zinc-100 mt-0.5 block truncate"
                                title={req.preferredSchedule}
                              >
                                🕒 {req.preferredSchedule}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                                Presupuesto ({req.budgetUnit}):
                              </span>
                              <strong className="text-teal-700 dark:text-teal-300 font-black mt-0.5 block">
                                {req.budgetMaxCop !== null
                                  ? req.budgetMinCop
                                    ? `$${req.budgetMinCop.toLocaleString('es-CO')} - $${req.budgetMaxCop.toLocaleString('es-CO')}`
                                    : `Hasta $${req.budgetMaxCop.toLocaleString('es-CO')}`
                                  : 'A Cotizar'}
                              </strong>
                            </div>
                          </div>

                          {/* RESUMEN DEL CONTRATO PACTADO Y ACEPTACIÓN DE CONDICIONES */}
                          {activeContract && primaryProposal && (
                            <div className="rounded-2xl border-2 border-teal-500/40 bg-gradient-to-r from-teal-50/80 via-white to-purple-50/80 p-4 text-xs dark:border-teal-800 dark:from-teal-950/30 dark:via-zinc-900 dark:to-purple-950/30 space-y-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-lg bg-zinc-900 px-2.5 py-1 font-mono text-[11px] font-black text-white dark:bg-zinc-100 dark:text-zinc-900">
                                    📜 Contrato {activeContract.contractCode}
                                  </span>
                                  <span className="rounded-lg bg-purple-100 px-2.5 py-1 font-mono text-[11px] font-black text-purple-900 dark:bg-purple-950 dark:text-purple-200">
                                    🧾 Registro Venta {activeContract.saleReferenceCode}
                                  </span>
                                </div>
                                <span className="font-black text-emerald-700 dark:text-emerald-400">
                                  Avance: {activeContract.progressPercent}%
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div
                                  className={`flex items-center justify-between rounded-xl border p-2.5 ${
                                    activeContract.buyerAcceptedConditions
                                      ? 'border-emerald-300 bg-emerald-50/80 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                                      : 'border-amber-300 bg-amber-50/80 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                                  }`}
                                >
                                  <div>
                                    <span className="text-[10px] font-black uppercase block">
                                      🛒 Condiciones Comprador
                                    </span>
                                    <span className="font-bold">
                                      {activeContract.buyerAcceptedConditions
                                        ? '✓ Aceptadas por Comprador'
                                        : '⏳ Pendiente Aceptación'}
                                    </span>
                                  </div>
                                  {currentWindow === 'buyer_window' &&
                                    !activeContract.buyerAcceptedConditions && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleAcceptContractConditions(req, primaryProposal, 'buyer')
                                        }
                                        className="rounded-lg bg-teal-600 px-2.5 py-1.5 text-[10px] font-black text-white hover:bg-teal-500 cursor-pointer"
                                      >
                                        ✅ Aceptar
                                      </button>
                                    )}
                                </div>

                                <div
                                  className={`flex items-center justify-between rounded-xl border p-2.5 ${
                                    activeContract.sellerAcceptedConditions
                                      ? 'border-emerald-300 bg-emerald-50/80 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                                      : 'border-amber-300 bg-amber-50/80 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                                  }`}
                                >
                                  <div>
                                    <span className="text-[10px] font-black uppercase block">
                                      🏪 Condiciones Vendedor
                                    </span>
                                    <span className="font-bold">
                                      {activeContract.sellerAcceptedConditions
                                        ? '✓ Aceptadas por Vendedor'
                                        : '⏳ Pendiente Aceptación'}
                                    </span>
                                  </div>
                                  {currentWindow === 'seller_window' &&
                                    !activeContract.sellerAcceptedConditions && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleAcceptContractConditions(req, primaryProposal, 'seller')
                                        }
                                        className="rounded-lg bg-purple-600 px-2.5 py-1.5 text-[10px] font-black text-white hover:bg-purple-500 cursor-pointer"
                                      >
                                        ✅ Aceptar
                                      </button>
                                    )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                  📋 {activeContract.trackingLogs.length} registros en bitácora de seguimiento
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const ensured = { ...req, contract: activeContract }
                                    setContractWindowRequest(ensured)
                                    setNewProgressPercent(activeContract.progressPercent)
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-1.5 text-[11px] font-black text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
                                >
                                  <span>📂</span>
                                  <span>Abrir Ventana del Contrato y Seguimiento</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Propuestas recibidas */}
                          <div className="space-y-2.5 pt-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                🙋‍♂️ Prestadores / Vendedores Postulados ({req.proposals.length})
                              </h4>
                              {currentWindow === 'seller_window' && req.status !== 'rated' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPropAcceptDirectly(true)
                                    setProposalTargetRequest(req)
                                  }}
                                  className="text-xs font-bold text-purple-600 hover:text-purple-500 dark:text-purple-400 cursor-pointer"
                                >
                                  + Postular / Aceptar Contrato
                                </button>
                              )}
                            </div>

                            {req.proposals.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-zinc-200 p-3 text-center text-xs text-zinc-500 dark:border-zinc-800">
                                Aún no hay postulaciones registradas para esta solicitud.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {req.proposals.map((prop) => {
                                  const isAccepted =
                                    req.selectedProposalId === prop.id || prop.status === 'accepted'
                                  const buyerToSellerWa = buildBuyerRequestWhatsappUrl(
                                    prop.sellerWhatsapp,
                                    prop.sellerBusinessName,
                                    req,
                                    'buyer_contacting_seller'
                                  )

                                  return (
                                    <div
                                      key={prop.id}
                                      className={`rounded-2xl border p-3.5 text-xs transition-all ${
                                        isAccepted
                                          ? 'border-emerald-400 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
                                          : 'border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40'
                                      }`}
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                                            🏪 {prop.sellerBusinessName}
                                          </span>
                                          {prop.sellerVerified && (
                                            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                              ✓ Verificado
                                            </span>
                                          )}
                                          <span className="font-bold text-amber-500">
                                            ★ {prop.sellerRatingAvg.toFixed(1)} ({prop.sellerRatingCount})
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                                            {prop.offeredPriceCop
                                              ? `$${prop.offeredPriceCop.toLocaleString('es-CO')} COP`
                                              : 'Cotización directa'}
                                          </span>
                                          {isAccepted && (
                                            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
                                              ✓ Vinculado a Contrato
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <p className="mt-1.5 text-zinc-600 dark:text-zinc-300">
                                        {prop.message}
                                      </p>

                                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
                                        <span>⏱️ {prop.estimatedTime}</span>
                                        <span>🛡️ {prop.warrantyOffered}</span>
                                      </div>

                                      {/* Botones según la ventana de sesión activa */}
                                      <div className="mt-2.5 pt-2 border-t border-zinc-200/70 dark:border-zinc-700/60 flex flex-wrap items-center justify-end gap-2">
                                        {buyerToSellerWa && (
                                          <a
                                            href={buyerToSellerWa}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500"
                                          >
                                            <span>💬</span>
                                            <span>WhatsApp</span>
                                          </a>
                                        )}

                                        {currentWindow === 'buyer_window' && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleAcceptContractConditions(req, prop, 'buyer')
                                            }
                                            className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-teal-500 cursor-pointer"
                                          >
                                            <span>🛒</span>
                                            <span>Aceptar Condiciones (Comprador)</span>
                                          </button>
                                        )}

                                        {currentWindow === 'seller_window' && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleAcceptContractConditions(req, prop, 'seller')
                                            }
                                            className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-purple-500 cursor-pointer"
                                          >
                                            <span>🏪</span>
                                            <span>Aceptar Condiciones (Vendedor)</span>
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => {
                                            const cto = buildOrGetContract(req, prop)
                                            setContractWindowRequest({ ...req, contract: cto })
                                            setNewProgressPercent(cto.progressPercent)
                                          }}
                                          className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
                                        >
                                          <span>📜</span>
                                          <span>Seguimiento Contrato</span>
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>

                          {/* Reseña y Calificación Oficial Otorgada tras la Atención */}
                          {req.review && (
                            <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-800 dark:bg-amber-950/30 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                  <span>⭐</span>
                                  <span>
                                    Calificación Oficial de Atención para{' '}
                                    {req.review.sellerBusinessName}
                                  </span>
                                </span>
                                <span className="text-sm font-black text-amber-500">
                                  {'★'.repeat(req.review.rating)} ({req.review.rating}.0 / 5.0)
                                </span>
                              </div>
                              <p className="text-xs text-zinc-700 dark:text-zinc-200 italic">
                                &ldquo;{req.review.comment}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Pie de Tarjeta con Acciones Exclusivas de la Ventana Correspondiente */}
                        <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {currentWindow === 'seller_window' && req.status !== 'rated' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPropAcceptDirectly(true)
                                  setProposalTargetRequest(req)
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition-colors cursor-pointer"
                              >
                                <span>🛠️</span>
                                <span>Aceptar Servicio / Pactar Contrato</span>
                              </button>
                            )}

                            {activeContract && (
                              <button
                                type="button"
                                onClick={() => {
                                  setContractWindowRequest({ ...req, contract: activeContract })
                                  setNewProgressPercent(activeContract.progressPercent)
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-300 bg-teal-50 px-3.5 py-2.5 text-xs font-bold text-teal-900 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200 transition-colors cursor-pointer"
                              >
                                <span>📜</span>
                                <span>Seguimiento del Contrato ({activeContract.contractCode})</span>
                              </button>
                            )}
                          </div>

                          {currentWindow === 'buyer_window' &&
                            req.status !== 'rated' &&
                            req.proposals.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setRatingTargetRequest(req)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-amber-400 transition-colors cursor-pointer"
                              >
                                <span>⭐</span>
                                <span>Calificar Atención</span>
                              </button>
                            )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REGISTRAR NUEVA SOLICITUD (PRIORIDAD ESTRUCTURA DE SERVICIO)     */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  🙋‍♂️ Módulo de Demanda del Comprador
                </span>
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                  Registrar Solicitud de Servicio o Producto
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="mt-5 space-y-4">
              {/* Selector de Tipo con Prioridad Destacada en Servicio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                  1. ¿Qué necesitas que te atiendan? (Prioridad Servicios)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewReqType('service')
                      setNewBudgetUnit('servicio completo')
                    }}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                      newReqType === 'service'
                        ? 'border-purple-500 bg-purple-50/80 ring-2 ring-purple-500/30 dark:border-purple-500 dark:bg-purple-950/40'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/40'
                    }`}
                  >
                    <span className="text-2xl">🛠️</span>
                    <div>
                      <span className="block text-xs font-black text-zinc-900 dark:text-zinc-50">
                        Solicitud de Servicio Profesional (Recomendado)
                      </span>
                      <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Plomería, técnicos, mantenimiento, asesorías, transporte, salud o reformas.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewReqType('product')
                      setNewBudgetUnit('unidad / lote')
                    }}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                      newReqType === 'product'
                        ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/30 dark:border-blue-500 dark:bg-blue-950/40'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/40'
                    }`}
                  >
                    <span className="text-2xl">📦</span>
                    <div>
                      <span className="block text-xs font-black text-zinc-900 dark:text-zinc-50">
                        Solicitud de Producto o Insumo
                      </span>
                      <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Repuestos, alimentos por encargo, equipos nuevos o artículos específicos.
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Título y Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Título claro de tu necesidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={
                      newReqType === 'service'
                        ? 'Ej. Urgente: Técnico para reparación de lavadora o instalación eléctrica'
                        : 'Ej. Busco proveedor de empaques biodegradables o repuesto específico'
                    }
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newCategorySlug}
                    onChange={(e) => setNewCategorySlug(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Descripción detallada de lo que requieres *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe el problema a resolver, características del servicio, ubicación aproximada y qué esperas de la persona o comercio que te atienda..."
                  className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Parámetros Operativos de Servicio (Urgencia, Modalidad, Ciudad y WhatsApp) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl bg-zinc-50 p-3.5 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Urgencia de Atención
                  </label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value as BuyerRequestUrgency)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <option value="immediate">⚡ Urgente / Hoy mismo</option>
                    <option value="24_48h">⏱️ En 24 a 48 horas</option>
                    <option value="scheduled">📅 Fecha Programada</option>
                    <option value="flexible">🤝 Horario Flexible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Modalidad Requerida
                  </label>
                  <select
                    value={newModality}
                    onChange={(e) => setNewModality(e.target.value as BuyerRequestModality)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <option value="home">🏠 A Domicilio</option>
                    <option value="in_person">📍 En Local / Taller</option>
                    <option value="virtual">💻 Virtual / Remoto</option>
                    <option value="flexible">🔄 A Convenir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Ciudad
                  </label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {COLOMBIA_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tu WhatsApp de Contacto
                  </label>
                  <input
                    type="text"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    placeholder="Ej. 3001112201"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
              </div>

              {/* Presupuesto y Horario */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Presupuesto Máximo ($ COP)
                  </label>
                  <input
                    type="number"
                    value={newBudgetMax}
                    onChange={(e) => setNewBudgetMax(e.target.value)}
                    placeholder="Vacío = Abierto a cotizar"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Unidad de Presupuesto
                  </label>
                  <input
                    type="text"
                    value={newBudgetUnit}
                    onChange={(e) => setNewBudgetUnit(e.target.value)}
                    placeholder="servicio completo, hora, unidad..."
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Disponibilidad de Horario
                  </label>
                  <input
                    type="text"
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value)}
                    placeholder="Ej. Mañana de 8am a 12pm"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>

              {/* Requisitos técnicos y alcance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Experiencia / Garantía Solicitada al Prestador
                  </label>
                  <input
                    type="text"
                    value={newRequiredSpec}
                    onChange={(e) => setNewRequiredSpec(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Alcance del Trabajo o Cantidad
                  </label>
                  <input
                    type="text"
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingNewReq}
                  className="rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-black text-white shadow-sm hover:bg-teal-500 disabled:opacity-50 cursor-pointer"
                >
                  {savingNewReq ? 'Publicando...' : '🚀 Publicar Solicitud en Tablero y Pasarela'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ACEPTAR SERVICIO Y POSTULARSE COMO PRESTADOR (PERFIL VENDEDOR)   */}
      {/* ========================================================================= */}
      {proposalTargetRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  🏪 Aceptación y Atención con Perfil Vendedor Activo ({userEmail || userName})
                </span>
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-50">
                  Aceptar / Atender Solicitud {proposalTargetRequest.referenceCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProposalTargetRequest(null)}
                className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 rounded-2xl bg-teal-50/70 p-3.5 text-xs dark:bg-zinc-800/60 border border-teal-200/70 dark:border-zinc-700">
              <div className="font-bold text-zinc-900 dark:text-zinc-100">
                {proposalTargetRequest.title}
              </div>
              <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                Solicitado por <strong>{proposalTargetRequest.buyerName}</strong> en{' '}
                <strong>{proposalTargetRequest.buyerCity}</strong> • {proposalTargetRequest.urgencyLabel}
              </div>
            </div>

            <form onSubmit={handleSendProposal} className="mt-4 space-y-3.5">
              {/* Opción de aceptación directa del servicio por parte del vendedor logueado */}
              {proposalTargetRequest.status === 'open' && (
                <label className="flex items-start gap-2.5 rounded-2xl border border-purple-300 bg-purple-50/70 p-3 text-xs cursor-pointer dark:border-purple-800 dark:bg-purple-950/40">
                  <input
                    type="checkbox"
                    checked={propAcceptDirectly}
                    onChange={(e) => setPropAcceptDirectly(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-purple-400 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="font-black text-purple-950 dark:text-purple-200 block">
                      🤝 Aceptar e iniciar de inmediato la atención del servicio con mi Perfil Vendedor
                    </span>
                    <span className="text-[11px] text-purple-800/80 dark:text-purple-300/80 block mt-0.5">
                      Al marcar esta opción, la solicitud quedará en estado &ldquo;En Proceso de Atención&rdquo; vinculada a tu cuenta de vendedor para seguimiento y calificación posterior.
                    </span>
                  </div>
                </label>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tu Negocio o Nombre Profesional *
                  </label>
                  <input
                    type="text"
                    required
                    value={propBusinessName}
                    onChange={(e) => setPropBusinessName(e.target.value)}
                    placeholder="Ej. Plomería & Redes Hidráulicas Pro"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    WhatsApp Directo de Atención *
                  </label>
                  <input
                    type="text"
                    required
                    value={propWhatsapp}
                    onChange={(e) => setPropWhatsapp(e.target.value)}
                    placeholder="Ej. 573102223301"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>

              {mySellerListings.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Vincular Servicio / Producto de tu Catálogo (Para recibir la calificación allí)
                  </label>
                  <select
                    value={propLinkedListingId}
                    onChange={(e) => setPropLinkedListingId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    {mySellerListings.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.type === 'service' ? '🛠️' : '📦'} {item.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tarifa Ofrecida ($ COP)
                  </label>
                  <input
                    type="number"
                    value={propOfferedPrice}
                    onChange={(e) => setPropOfferedPrice(e.target.value)}
                    placeholder="Ej. 110000"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tiempo de Respuesta
                  </label>
                  <input
                    type="text"
                    value={propEstimatedTime}
                    onChange={(e) => setPropEstimatedTime(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Garantía Ofrecida
                  </label>
                  <input
                    type="text"
                    value={propWarranty}
                    onChange={(e) => setPropWarranty(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mensaje de Propuesta Técnica / Comercial *
                </label>
                <textarea
                  rows={3}
                  required
                  value={propMessage}
                  onChange={(e) => setPropMessage(e.target.value)}
                  placeholder="Indícale al comprador cómo atenderás su necesidad, qué incluye tu servicio o producto y tu disponibilidad inmediata..."
                  className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setProposalTargetRequest(null)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProposal}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-black text-white hover:bg-teal-500 cursor-pointer"
                >
                  {savingProposal
                    ? 'Procesando...'
                    : propAcceptDirectly && proposalTargetRequest.status === 'open'
                    ? '🤝 Aceptar Servicio e Iniciar Atención'
                    : '🙋‍♂️ Enviar Propuesta de Atención'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CALIFICAR ATENCIÓN RECIBIDA (SISTEMA OFICIAL DE REPUTACIÓN)      */}
      {/* ========================================================================= */}
      {ratingTargetRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-50">
                  Calificar Atención de Solicitud {ratingTargetRequest.referenceCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRatingTargetRequest(null)}
                className="text-zinc-400 hover:text-zinc-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 rounded-xl bg-zinc-50 p-3 text-xs dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
              <div className="font-bold text-zinc-900 dark:text-zinc-100">
                {ratingTargetRequest.title}
              </div>
              <div className="mt-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                Prestador que atendió:{' '}
                {ratingTargetRequest.proposals.find(
                  (p) => p.id === ratingTargetRequest.selectedProposalId
                )?.sellerBusinessName ||
                  ratingTargetRequest.proposals[0]?.sellerBusinessName ||
                  'Comercio / Profesional Verificado'}
              </div>
            </div>

            <form onSubmit={handleConfirmRating} className="mt-4 space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-center dark:border-amber-900/50 dark:bg-amber-950/20">
                <label className="block text-xs font-bold uppercase text-amber-900 dark:text-amber-200 mb-1">
                  Selecciona de 1 a 5 Estrellas según la atención recibida
                </label>
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoverRating || ratingValue)
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingValue(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-3xl transition-transform hover:scale-125 cursor-pointer"
                      >
                        <span className={active ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-700'}>
                          ★
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Comentario de Calificación (Mínimo 10 caracteres) *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={10}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Describe cómo fue la puntualidad, calidad técnica del servicio o producto y atención del profesional..."
                  className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRatingRecommend(true)}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold border cursor-pointer ${
                    ratingRecommend
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  👍 Sí recomiendo su atención
                </button>
                <button
                  type="button"
                  onClick={() => setRatingRecommend(false)}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold border cursor-pointer ${
                    !ratingRecommend
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  👎 No lo recomiendo
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setRatingTargetRequest(null)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingRating || ratingComment.trim().length < 10}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-black text-white hover:bg-amber-400 disabled:opacity-50 cursor-pointer"
                >
                  {savingRating ? 'Guardando...' : '⭐ Publicar Calificación Oficial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: VENTANA INDEPENDIENTE DEL CONTRATO PACTADO Y BITÁCORA (#CTO)     */}
      {/* ========================================================================= */}
      {contractWindowRequest && contractWindowRequest.contract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-6 w-full max-w-4xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-5">
            {/* Cabecera del Contrato Pactado */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-zinc-900 px-3 py-1 font-mono text-xs font-black text-white dark:bg-zinc-100 dark:text-zinc-900">
                    📜 Contrato {contractWindowRequest.contract.contractCode}
                  </span>
                  <span className="rounded-lg bg-purple-100 px-3 py-1 font-mono text-xs font-black text-purple-900 dark:bg-purple-950 dark:text-purple-200">
                    🧾 Registro Venta {contractWindowRequest.contract.saleReferenceCode}
                  </span>
                  <span className="rounded-lg bg-zinc-100 px-2.5 py-1 font-mono text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    Solicitud {contractWindowRequest.referenceCode}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50">
                  {contractWindowRequest.title}
                </h3>
                <p className="text-xs text-zinc-500">
                  Ventana independiente de seguimiento bilateral: registro de condiciones pactadas, orden de venta y bitácora de cumplimiento.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setContractWindowRequest(null)}
                className="rounded-xl bg-zinc-100 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 cursor-pointer"
              >
                ✕ Cerrar Ventana
              </button>
            </div>

            {/* Estado de Doble Aceptación de Condiciones (Comprador + Vendedor) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Caja Comprador */}
              <div
                className={`rounded-2xl border-2 p-4 space-y-2 ${
                  contractWindowRequest.contract.buyerAcceptedConditions
                    ? 'border-emerald-400 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30'
                    : 'border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
                    🛒 Parte 1: Comprador Solicitante
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                      contractWindowRequest.contract.buyerAcceptedConditions
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {contractWindowRequest.contract.buyerAcceptedConditions
                      ? '✓ Condiciones Aceptadas'
                      : '⏳ Pendiente Aceptar Condiciones'}
                  </span>
                </div>
                <div className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                  {contractWindowRequest.contract.buyerName}
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  Ciudad: {contractWindowRequest.buyerCity} • Modalidad: {contractWindowRequest.modalityLabel}
                </div>
                {contractWindowRequest.contract.buyerAcceptedAt && (
                  <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    Firmado / Aceptado el{' '}
                    {new Date(contractWindowRequest.contract.buyerAcceptedAt).toLocaleString('es-CO')}
                  </div>
                )}
                {!contractWindowRequest.contract.buyerAcceptedConditions && (
                  <button
                    type="button"
                    onClick={() => {
                      const prop =
                        contractWindowRequest.proposals.find(
                          (p) => p.id === contractWindowRequest.contract?.proposalId
                        ) || contractWindowRequest.proposals[0]
                      if (prop) {
                        handleAcceptContractConditions(contractWindowRequest, prop, 'buyer')
                      }
                    }}
                    className="w-full rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-black text-white hover:bg-teal-500 cursor-pointer shadow-xs"
                  >
                    {userId && userRole === 'buyer' ? '✅ ' : '🔒 '}
                    Aceptar Condiciones del Contrato como Comprador
                  </button>
                )}
              </div>

              {/* Caja Vendedor */}
              <div
                className={`rounded-2xl border-2 p-4 space-y-2 ${
                  contractWindowRequest.contract.sellerAcceptedConditions
                    ? 'border-emerald-400 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30'
                    : 'border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-800 dark:text-purple-300">
                    🏪 Parte 2: Vendedor / Prestador
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                      contractWindowRequest.contract.sellerAcceptedConditions
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {contractWindowRequest.contract.sellerAcceptedConditions
                      ? '✓ Condiciones Aceptadas'
                      : '⏳ Pendiente Aceptar Condiciones'}
                  </span>
                </div>
                <div className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                  {contractWindowRequest.contract.sellerBusinessName}
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  Orden de Venta Asociada: <strong>{contractWindowRequest.contract.saleReferenceCode}</strong>
                </div>
                {contractWindowRequest.contract.sellerAcceptedAt && (
                  <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    Firmado / Aceptado el{' '}
                    {new Date(contractWindowRequest.contract.sellerAcceptedAt).toLocaleString('es-CO')}
                  </div>
                )}
                {!contractWindowRequest.contract.sellerAcceptedConditions && (
                  <button
                    type="button"
                    onClick={() => {
                      const prop =
                        contractWindowRequest.proposals.find(
                          (p) => p.id === contractWindowRequest.contract?.proposalId
                        ) || contractWindowRequest.proposals[0]
                      if (prop) {
                        handleAcceptContractConditions(contractWindowRequest, prop, 'seller')
                      }
                    }}
                    className="w-full rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-black text-white hover:bg-purple-500 cursor-pointer shadow-xs"
                  >
                    {userId && userRole === 'seller' ? '✅ ' : '🔒 '}
                    Aceptar Condiciones del Contrato como Vendedor
                  </button>
                )}
              </div>
            </div>

            {/* Cláusulas y Condiciones Pactadas del Contrato y Registro de Venta */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-800/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 pb-2.5 dark:border-zinc-700">
                <span className="font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                  📋 Condiciones Económicas y Técnicas del Contrato Pactado
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  Valor Pactado: ${contractWindowRequest.contract.agreedPriceCop.toLocaleString('es-CO')} COP
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                    ⏱️ Plazo / Tiempo Acordado:
                  </span>
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    {contractWindowRequest.contract.agreedTimeline}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                    🛡️ Garantía del Servicio / Producto:
                  </span>
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    {contractWindowRequest.contract.agreedWarranty}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                    💳 Condiciones de Pago:
                  </span>
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    {contractWindowRequest.contract.paymentTerms}
                  </strong>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                  📐 Alcance y Entregables Pactados:
                </span>
                <p className="mt-0.5 text-zinc-700 dark:text-zinc-300 font-medium">
                  {contractWindowRequest.contract.agreedScope}
                </p>
              </div>

              {/* Barra de Progreso del Contrato */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <span>Progreso de Ejecución y Cumplimiento del Contrato</span>
                  <span className="text-teal-600 dark:text-teal-400">
                    {contractWindowRequest.contract.progressPercent}% Completado
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-purple-600 transition-all duration-300"
                    style={{ width: `${contractWindowRequest.contract.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Formulario para Registrar Nuevo Hito de Seguimiento (Comprador o Vendedor Logueado) */}
            <form
              onSubmit={handleAddContractTrackingLog}
              className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                  ✍️ Registrar Nuevo Seguimiento / Avance en el Contrato Pactado
                </span>
                <span className="text-[11px] font-bold text-zinc-500">
                  {userId && (userRole === 'buyer' || userRole === 'seller')
                    ? `Registrando como ${
                        userRole === 'buyer'
                          ? `🛒 Comprador (${userName})`
                          : `🏪 Vendedor (${mySellerProfile?.business_name || userName})`
                      }`
                    : '🔒 Requiere iniciar sesión como Comprador o Vendedor'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tipo de Registro
                  </label>
                  <select
                    value={newLogMilestone}
                    onChange={(e) => setNewLogMilestone(e.target.value as ContractMilestoneType)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <option value="progress_update">⚙️ Avance de Ejecución / Seguimiento</option>
                    <option value="service_delivered">📦 Entrega Técnica del Servicio / Producto (Vendedor)</option>
                    <option value="buyer_conformity">✅ Recibido a Conformidad (Comprador)</option>
                    <option value="observation">📋 Observación / Novedad del Contrato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Título del Hito *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLogTitle}
                    onChange={(e) => setNewLogTitle(e.target.value)}
                    placeholder="Ej. Inicio de diagnóstico en sitio / Entrega final"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Porcentaje de Avance ({newProgressPercent}%)
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={newProgressPercent}
                    onChange={(e) => setNewProgressPercent(Number(e.target.value))}
                    className="w-full accent-teal-600 mt-2"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={newLogDetail}
                  onChange={(e) => setNewLogDetail(e.target.value)}
                  placeholder="Describe el avance realizado, cumplimiento de condiciones o novedad del servicio/venta..."
                  className="flex-1 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                />
                <button
                  type="submit"
                  disabled={savingContractUpdate}
                  className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-black text-white hover:bg-teal-500 cursor-pointer shrink-0"
                >
                  {savingContractUpdate ? 'Guardando...' : '+ Añadir Seguimiento al Contrato'}
                </button>
              </div>
            </form>

            {/* Bitácora Cronológica de Seguimiento del Contrato Pactado */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  🕒 Bitácora Oficial de Registros y Seguimientos ({contractWindowRequest.contract.trackingLogs.length})
                </h4>
                {contractWindowRequest.status !== 'rated' && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = contractWindowRequest
                      setContractWindowRequest(null)
                      requestBuyerAction(
                        `Calificar Cumplimiento del Contrato ${target.contract?.contractCode}`,
                        'Para otorgar la calificación oficial y cerrar el contrato pactado, debes estar logueado con tu Perfil Comprador.',
                        () => setRatingTargetRequest(target)
                      )
                    }}
                    className="rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-black text-white hover:bg-amber-400 cursor-pointer"
                  >
                    ⭐ Finalizar Contrato y Calificar Atención (Comprador)
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {contractWindowRequest.contract.trackingLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`rounded-2xl border p-3 text-xs ${
                      log.actorRole === 'buyer'
                        ? 'border-teal-200 bg-teal-50/50 dark:border-teal-900/50 dark:bg-teal-950/20'
                        : log.actorRole === 'seller'
                        ? 'border-purple-200 bg-purple-50/50 dark:border-purple-900/50 dark:bg-purple-950/20'
                        : 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-black text-zinc-900 dark:text-zinc-100">
                        {log.actorRole === 'buyer'
                          ? '🛒 '
                          : log.actorRole === 'seller'
                          ? '🏪 '
                          : '📜 '}
                        {log.title}
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-500">
                        {log.actorName} •{' '}
                        {new Date(log.createdAt).toLocaleString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-zinc-600 dark:text-zinc-300">{log.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: BLOQUEO DE ACCIÓN HASTA INICIAR SESIÓN CON EL PERFIL REQUERIDO   */}
      {/* ========================================================================= */}
      {authGateInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl font-black ${
                    authGateInfo.requiredProfile === 'buyer'
                      ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                  }`}
                >
                  🔒
                </div>
                <div>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      authGateInfo.requiredProfile === 'buyer'
                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
                    }`}
                  >
                    {authGateInfo.requiredProfile === 'buyer'
                      ? '🛒 Bloqueo de Seguridad • Requiere Perfil Comprador'
                      : '🏪 Bloqueo de Seguridad • Requiere Perfil Vendedor'}
                  </span>
                  <h3 className="mt-1 text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50">
                    {authGateInfo.actionTitle}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAuthGateInfo(null)}
                className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 leading-relaxed">
                <p className="font-bold">{authGateInfo.actionDescription}</p>
                <p className="mt-1.5 text-[11px] opacity-90">
                  {userId ? (
                    <>
                      Actualmente tienes sesión iniciada como{' '}
                      <strong>
                        {userName} (
                        {userRole === 'buyer'
                          ? 'Perfil Comprador'
                          : userRole === 'seller'
                          ? 'Perfil Vendedor'
                          : 'Administrador'}
                        )
                      </strong>
                      . Para garantizar la trazabilidad del proceso, cambia o inicia sesión con un{' '}
                      <strong>
                        {authGateInfo.requiredProfile === 'buyer'
                          ? 'Perfil Comprador'
                          : 'Perfil Vendedor'}
                      </strong>
                      .
                    </>
                  ) : (
                    <>
                      Aún no has iniciado sesión. Inicia sesión o regístrate con tu cuenta para desbloquear esta acción y continuar inmediatamente.
                    </>
                  )}
                </p>
              </div>

              {/* Opción 1: Ir a la pantalla completa de Login / Registro */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push('/login?redirectTo=/solicitudes')}
                  className={`w-full sm:flex-1 rounded-2xl px-4 py-3 text-xs font-black text-white shadow-sm transition-all cursor-pointer ${
                    authGateInfo.requiredProfile === 'buyer'
                      ? 'bg-teal-600 hover:bg-teal-500'
                      : 'bg-purple-600 hover:bg-purple-500'
                  }`}
                >
                  🔑 Ir a Iniciar Sesión o Registrarme (
                  {authGateInfo.requiredProfile === 'buyer' ? 'Perfil Comprador' : 'Perfil Vendedor'})
                </button>
                <button
                  type="button"
                  onClick={() => setAuthGateInfo(null)}
                  className="w-full sm:w-auto rounded-2xl border border-zinc-300 px-4 py-3 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Seguir explorando sin logueo
                </button>
              </div>

              {/* Opción 2: Acceso Rápido 1-Clic con Perfiles Verificados para continuar de inmediato */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    ⚡ O inicia sesión en 1 clic con una cuenta verificada de{' '}
                    {authGateInfo.requiredProfile === 'buyer' ? 'Comprador' : 'Vendedor de Servicios'}:
                  </span>
                  {quickAuthLoading && (
                    <span className="text-[11px] font-bold text-teal-600 animate-pulse">
                      Iniciando sesión...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {(authGateInfo.requiredProfile === 'buyer'
                    ? BUYER_PROFILES.slice(0, 6)
                    : SERVICE_SELLER_PROFILES.slice(0, 6)
                  ).map((prof) => (
                    <button
                      key={prof.email}
                      type="button"
                      disabled={quickAuthLoading}
                      onClick={() => handleQuickProfileSignIn(prof)}
                      className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-left transition-all cursor-pointer disabled:opacity-50 ${
                        authGateInfo.requiredProfile === 'buyer'
                          ? 'border-teal-200 bg-teal-50/50 hover:bg-teal-100/70 dark:border-teal-900/60 dark:bg-teal-950/30'
                          : 'border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 dark:border-purple-900/60 dark:bg-purple-950/30'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                          {prof.role === 'buyer' ? '🛒 ' : '🛠️ '}
                          {prof.businessName || prof.name}
                        </div>
                        <div className="truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                          {prof.city} • {prof.specialty || 'Comprador Verificado'}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-[10px] font-black text-zinc-800 shadow-2xs dark:bg-zinc-800 dark:text-zinc-200">
                        Entrar →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
