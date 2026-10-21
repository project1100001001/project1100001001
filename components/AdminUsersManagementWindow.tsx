'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ListingWithRelations } from '@/lib/types'

export type UserAccountStatus = 'active' | 'suspended' | 'blocked' | 'under_review'

export interface UserModerationRecord {
  userId: string
  status: UserAccountStatus
  reason: string
  adminNotes: string
  suspendedUntil: string | null // ISO date string or null
  suspensionDurationDays: number | null
  warningsCount: number
  canPublishListings: boolean
  canCreateCampaigns: boolean
  canShowWhatsapp: boolean
  hideFromShowcase: boolean
  updatedAt: string
  history: Array<{
    date: string
    action: string
    reason: string
  }>
}

export const USERS_MODERATION_STORAGE_KEY = 'marketplace_users_moderation_v1'
export const USERS_MODERATION_SLOT_ID = 'config.users_moderation'

interface AdminUsersManagementWindowProps {
  users: any[]
  setUsers: React.Dispatch<React.SetStateAction<any[]>>
  listings: ListingWithRelations[]
  setListings: React.Dispatch<React.SetStateAction<ListingWithRelations[]>>
  locale: string
  t: any
  updatingUserId: string | null
  onUpdateUserRole: (targetUser: any, newRole: 'buyer' | 'seller' | 'admin') => Promise<void>
  onNotify: (text: string, type?: 'success' | 'error') => void
}

const DEFAULT_MODERATION_RECORD = (userId: string, sellerStatus?: string): UserModerationRecord => ({
  userId,
  status:
    sellerStatus === 'blocked'
      ? 'blocked'
      : sellerStatus === 'suspended'
      ? 'suspended'
      : sellerStatus === 'under_review'
      ? 'under_review'
      : 'active',
  reason: '',
  adminNotes: '',
  suspendedUntil: null,
  suspensionDurationDays: null,
  warningsCount: 0,
  canPublishListings: sellerStatus !== 'blocked' && sellerStatus !== 'suspended',
  canCreateCampaigns: sellerStatus !== 'blocked' && sellerStatus !== 'suspended',
  canShowWhatsapp: true,
  hideFromShowcase: sellerStatus === 'blocked' || sellerStatus === 'suspended',
  updatedAt: new Date().toISOString(),
  history: [],
})

export default function AdminUsersManagementWindow({
  users,
  setUsers,
  listings,
  setListings,
  locale,
  t,
  updatingUserId,
  onUpdateUserRole,
  onNotify,
}: AdminUsersManagementWindowProps) {
  const supabase = createClient()

  // Filtros de la ventana de usuarios
  const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'seller' | 'admin'>('all')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'suspended' | 'blocked' | 'under_review' | 'verified'
  >('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState(false)

  // Mapa de registros de moderación por usuario (persistido en Supabase ad_slot + seller + localStorage)
  const [moderationMap, setModerationMap] = useState<Record<string, UserModerationRecord>>({})
  const [processingActionUserId, setProcessingActionUserId] = useState<string | null>(null)

  // Modal de administración detallada / bloqueo / suspensión de un usuario
  const [selectedUserForModal, setSelectedUserForModal] = useState<any | null>(null)
  const [modalTab, setModalTab] = useState<'status' | 'permissions' | 'profile' | 'listings'>(
    'status'
  )

  // Estado del formulario dentro del modal
  const [targetStatus, setTargetStatus] = useState<UserAccountStatus>('active')
  const [suspensionDays, setSuspensionDays] = useState<number>(7)
  const [actionReason, setActionReason] = useState<string>('')
  const [adminNotes, setAdminNotes] = useState<string>('')
  const [pauseAllUserListings, setPauseAllUserListings] = useState<boolean>(true)
  const [canPublishListings, setCanPublishListings] = useState<boolean>(true)
  const [canCreateCampaigns, setCanCreateCampaigns] = useState<boolean>(true)
  const [canShowWhatsapp, setCanShowWhatsapp] = useState<boolean>(true)
  const [hideFromShowcase, setHideFromShowcase] = useState<boolean>(false)

  // Campos editables de perfil en el modal
  const [editFullName, setEditFullName] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editBusinessName, setEditBusinessName] = useState('')
  const [editWhatsapp, setEditWhatsapp] = useState('')

  // Cargar registros de moderación desde Supabase (ad_slot) y localStorage
  useEffect(() => {
    let loadedMap: Record<string, UserModerationRecord> = {}
    try {
      const raw = localStorage.getItem(USERS_MODERATION_STORAGE_KEY)
      if (raw) {
        loadedMap = JSON.parse(raw) || {}
      }
    } catch {
      // Ignorar errores de parseo
    }

    // Sincronizar también desde BD (ad_slot 'config.users_moderation')
    supabase
      .from('ad_slot')
      .select('*')
      .eq('id', USERS_MODERATION_SLOT_ID)
      .maybeSingle()
      .then(({ data }) => {
        if (data && Array.isArray(data.formats) && data.formats[0]) {
          try {
            const dbMap = JSON.parse(data.formats[0])
            const merged = { ...dbMap, ...loadedMap }
            setModerationMap(merged)
            localStorage.setItem(USERS_MODERATION_STORAGE_KEY, JSON.stringify(merged))
          } catch {
            setModerationMap(loadedMap)
          }
        } else {
          setModerationMap(loadedMap)
        }
      })
  }, [supabase])

  const getSellerInfo = (u: any) => {
    if (!u?.seller) return null
    return Array.isArray(u.seller) ? u.seller[0] || null : u.seller
  }

  const getUserModeration = (u: any): UserModerationRecord => {
    const existing = moderationMap[u.id]
    const sellerInfo = getSellerInfo(u)
    if (existing) return existing
    return DEFAULT_MODERATION_RECORD(u.id, sellerInfo?.status)
  }

  const persistModerationMap = async (nextMap: Record<string, UserModerationRecord>) => {
    setModerationMap(nextMap)
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_MODERATION_STORAGE_KEY, JSON.stringify(nextMap))
    }
    try {
      await supabase.from('ad_slot').upsert(
        {
          id: USERS_MODERATION_SLOT_ID,
          surface: 'users_moderation',
          formats: [JSON.stringify(nextMap)],
          max_ads: Object.keys(nextMap).length,
        },
        { onConflict: 'id' }
      )
    } catch {
      // Silencioso si falla red
    }
  }

  // Estadísticas globales de usuarios
  const stats = useMemo(() => {
    let activeCount = 0
    let suspendedCount = 0
    let blockedCount = 0
    let reviewCount = 0
    let verifiedSellersCount = 0

    users.forEach((u) => {
      const mod = getUserModeration(u)
      const seller = getSellerInfo(u)
      if (seller?.verified) verifiedSellersCount += 1

      if (mod.status === 'blocked') blockedCount += 1
      else if (mod.status === 'suspended') suspendedCount += 1
      else if (mod.status === 'under_review') reviewCount += 1
      else activeCount += 1
    })

    return {
      total: users.length,
      activeCount,
      suspendedCount,
      blockedCount,
      reviewCount,
      verifiedSellersCount,
    }
  }, [users, moderationMap])

  // Abrir el modal de administración para un usuario específico
  const handleOpenUserModal = (
    u: any,
    initialTab: 'status' | 'permissions' | 'profile' | 'listings' = 'status',
    presetStatus?: UserAccountStatus
  ) => {
    const mod = getUserModeration(u)
    const seller = getSellerInfo(u)

    setSelectedUserForModal(u)
    setModalTab(initialTab)
    setTargetStatus(presetStatus || mod.status)
    setSuspensionDays(mod.suspensionDurationDays || 7)
    setActionReason(mod.reason || '')
    setAdminNotes(mod.adminNotes || '')
    setPauseAllUserListings(
      (presetStatus || mod.status) === 'blocked' || (presetStatus || mod.status) === 'suspended'
    )
    setCanPublishListings(mod.canPublishListings)
    setCanCreateCampaigns(mod.canCreateCampaigns)
    setCanShowWhatsapp(mod.canShowWhatsapp)
    setHideFromShowcase(mod.hideFromShowcase)

    setEditFullName(u.full_name || '')
    setEditCity(u.city || seller?.city || '')
    setEditPhone(u.phone || seller?.phone || '')
    setEditBusinessName(seller?.business_name || '')
    setEditWhatsapp(seller?.whatsapp || u.phone || '')
  }

  // Acción rápida: Cambiar estado (Activar / Suspender / Bloquear) y sincronizar con BD
  const handleApplyUserModeration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedUserForModal) return

    const targetUser = selectedUserForModal
    const seller = getSellerInfo(targetUser)
    setProcessingActionUserId(targetUser.id)

    try {
      const now = new Date()
      let suspendedUntilIso: string | null = null
      if (targetStatus === 'suspended' && suspensionDays > 0) {
        suspendedUntilIso = new Date(
          now.getTime() + suspensionDays * 24 * 60 * 60 * 1000
        ).toISOString()
      }

      const prevRecord = getUserModeration(targetUser)
      const actionLabel =
        targetStatus === 'blocked'
          ? 'Cuenta Bloqueada'
          : targetStatus === 'suspended'
          ? `Cuenta Suspendida (${suspensionDays} días)`
          : targetStatus === 'under_review'
          ? 'Cuenta en Revisión / Advertencia'
          : 'Cuenta Activada / Restaurada'

      const nextRecord: UserModerationRecord = {
        userId: targetUser.id,
        status: targetStatus,
        reason:
          targetStatus === 'active'
            ? ''
            : actionReason.trim() || 'Medida administrativa aplicada por moderación',
        adminNotes: adminNotes.trim(),
        suspendedUntil: suspendedUntilIso,
        suspensionDurationDays: targetStatus === 'suspended' ? suspensionDays : null,
        warningsCount:
          targetStatus === 'under_review'
            ? (prevRecord.warningsCount || 0) + 1
            : prevRecord.warningsCount || 0,
        canPublishListings:
          targetStatus === 'blocked' || targetStatus === 'suspended' ? false : canPublishListings,
        canCreateCampaigns:
          targetStatus === 'blocked' || targetStatus === 'suspended' ? false : canCreateCampaigns,
        canShowWhatsapp,
        hideFromShowcase:
          targetStatus === 'blocked' || targetStatus === 'suspended' ? true : hideFromShowcase,
        updatedAt: now.toISOString(),
        history: [
          {
            date: now.toISOString(),
            action: actionLabel,
            reason: actionReason.trim() || 'Ajuste administrativo de cuenta',
          },
          ...(prevRecord.history || []).slice(0, 9),
        ],
      }

      // 1. Si el usuario tiene comercio (seller), actualizar su estado en public.seller
      if (seller?.id) {
        const dbSellerStatus =
          targetStatus === 'blocked'
            ? 'blocked'
            : targetStatus === 'suspended'
            ? 'suspended'
            : 'active'

        await supabase
          .from('seller')
          .update({
            status: dbSellerStatus,
            ...(targetStatus === 'blocked' ? { verified: false } : {}),
          })
          .eq('id', seller.id)

        // Actualizar estado local del usuario
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== targetUser.id) return u
            const updatedSeller = {
              ...seller,
              status: dbSellerStatus,
              ...(targetStatus === 'blocked' ? { verified: false } : {}),
            }
            return {
              ...u,
              seller: Array.isArray(u.seller) ? [updatedSeller] : updatedSeller,
            }
          })
        )

        // 2. Si se solicitó pausar todas sus publicaciones al suspender/bloquear
        if (
          (targetStatus === 'blocked' || targetStatus === 'suspended') &&
          pauseAllUserListings
        ) {
          await supabase
            .from('listing')
            .update({ status: 'paused' })
            .eq('seller_id', seller.id)
            .eq('status', 'published')

          setListings((prev) =>
            prev.map((l) =>
              l.seller_id === seller.id && l.status === 'published'
                ? { ...l, status: 'paused' }
                : l
            )
          )
        }

        // 3. Si se reactiva la cuenta y tenía publicaciones en pausa, opción de restaurarlas
        if (targetStatus === 'active' && pauseAllUserListings) {
          await supabase
            .from('listing')
            .update({ status: 'published' })
            .eq('seller_id', seller.id)
            .eq('status', 'paused')

          setListings((prev) =>
            prev.map((l) =>
              l.seller_id === seller.id && l.status === 'paused'
                ? { ...l, status: 'published' }
                : l
            )
          )
        }
      }

      // 4. Persistir el mapa de moderación
      const nextMap = {
        ...moderationMap,
        [targetUser.id]: nextRecord,
      }
      await persistModerationMap(nextMap)

      onNotify(
        `Estado de ${targetUser.full_name || 'usuario'} actualizado: ${actionLabel}.`
      )
      setSelectedUserForModal(null)
    } catch (err: any) {
      onNotify(err?.message || 'Error al aplicar la medida administrativa', 'error')
    } finally {
      setProcessingActionUserId(null)
    }
  }

  // Verificar / Quitar verificación de comercio en 1 clic
  const handleToggleVerifySeller = async (u: any) => {
    const seller = getSellerInfo(u)
    if (!seller?.id) {
      onNotify('Este usuario aún no tiene un comercio vinculado para verificar.', 'error')
      return
    }
    setProcessingActionUserId(u.id)
    try {
      const nextVerified = !seller.verified
      const { error } = await supabase
        .from('seller')
        .update({
          verified: nextVerified,
          verified_at: nextVerified ? new Date().toISOString() : null,
        })
        .eq('id', seller.id)

      if (error) throw error

      setUsers((prev) =>
        prev.map((item) => {
          if (item.id !== u.id) return item
          const updatedSeller = {
            ...seller,
            verified: nextVerified,
            verified_at: nextVerified ? new Date().toISOString() : null,
          }
          return {
            ...item,
            seller: Array.isArray(item.seller) ? [updatedSeller] : updatedSeller,
          }
        })
      )

      onNotify(
        nextVerified
          ? `🏅 Comercio "${seller.business_name}" verificado oficialmente.`
          : `Verificación removida para "${seller.business_name}".`
      )
    } catch (err: any) {
      onNotify(err?.message || 'Error al cambiar verificación del comercio', 'error')
    } finally {
      setProcessingActionUserId(null)
    }
  }

  // Guardar cambios de perfil y datos de contacto desde el modal administrativo
  const handleSaveUserProfileEdits = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserForModal) return
    const targetUser = selectedUserForModal
    const seller = getSellerInfo(targetUser)
    setProcessingActionUserId(targetUser.id)

    try {
      const { error: userErr } = await supabase
        .from('app_user')
        .update({
          full_name: editFullName.trim() || null,
          city: editCity.trim() || null,
          phone: editPhone.trim() || null,
        })
        .eq('id', targetUser.id)

      if (userErr) throw userErr

      if (seller?.id) {
        await supabase
          .from('seller')
          .update({
            business_name: editBusinessName.trim() || seller.business_name,
            city: editCity.trim() || seller.city,
            phone: editPhone.trim() || seller.phone,
            whatsapp: editWhatsapp.trim() || seller.whatsapp,
          })
          .eq('id', seller.id)
      }

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== targetUser.id) return u
          const updatedSeller = seller
            ? {
                ...seller,
                business_name: editBusinessName.trim() || seller.business_name,
                city: editCity.trim() || seller.city,
                phone: editPhone.trim() || seller.phone,
                whatsapp: editWhatsapp.trim() || seller.whatsapp,
              }
            : null
          return {
            ...u,
            full_name: editFullName.trim() || u.full_name,
            city: editCity.trim() || u.city,
            phone: editPhone.trim() || u.phone,
            seller: updatedSeller
              ? Array.isArray(u.seller)
                ? [updatedSeller]
                : updatedSeller
              : u.seller,
          }
        })
      )

      onNotify('Datos del usuario y comercio actualizados correctamente.')
      setSelectedUserForModal(null)
    } catch (err: any) {
      onNotify(err?.message || 'Error al actualizar datos del usuario', 'error')
    } finally {
      setProcessingActionUserId(null)
    }
  }

  // Pausar o reactivar todas las publicaciones de un vendedor desde el modal
  const handleBulkToggleSellerListings = async (
    sellerId: string,
    targetListingStatus: 'published' | 'paused'
  ) => {
    if (!sellerId) return
    setProcessingActionUserId(selectedUserForModal?.id || sellerId)
    try {
      const { error } = await supabase
        .from('listing')
        .update({ status: targetListingStatus })
        .eq('seller_id', sellerId)

      if (error) throw error

      setListings((prev) =>
        prev.map((l) => (l.seller_id === sellerId ? { ...l, status: targetListingStatus } : l))
      )

      onNotify(
        targetListingStatus === 'paused'
          ? '⏸️ Todas las publicaciones de este usuario han sido pausadas.'
          : '✅ Todas las publicaciones de este usuario han sido reactivadas.'
      )
    } catch (err: any) {
      onNotify(err?.message || 'Error al actualizar publicaciones del usuario', 'error')
    } finally {
      setProcessingActionUserId(null)
    }
  }

  // Filtrado combinado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false

      const mod = getUserModeration(u)
      const seller = getSellerInfo(u)

      if (statusFilter === 'active' && mod.status !== 'active') return false
      if (statusFilter === 'suspended' && mod.status !== 'suspended') return false
      if (statusFilter === 'blocked' && mod.status !== 'blocked') return false
      if (statusFilter === 'under_review' && mod.status !== 'under_review') return false
      if (statusFilter === 'verified' && !seller?.verified) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = u.full_name?.toLowerCase().includes(q)
        const matchCity = u.city?.toLowerCase().includes(q)
        const matchId = u.id?.toLowerCase().includes(q)
        const matchPhone = u.phone?.toLowerCase().includes(q)
        const matchBiz = seller?.business_name?.toLowerCase().includes(q)
        const matchWa = seller?.whatsapp?.toLowerCase().includes(q)
        return matchName || matchCity || matchId || matchPhone || matchBiz || matchWa
      }

      return true
    })
  }, [users, roleFilter, statusFilter, searchQuery, moderationMap])

  const renderStatusBadge = (mod: UserModerationRecord) => {
    if (mod.status === 'blocked') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-300 px-2.5 py-0.5 text-[10px] font-extrabold text-red-800 dark:bg-red-950/70 dark:border-red-800 dark:text-red-300">
          <span>🚫</span>
          <span>Bloqueado</span>
        </span>
      )
    }
    if (mod.status === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 dark:bg-amber-950/70 dark:border-amber-800 dark:text-amber-300">
          <span>⏸️</span>
          <span>
            Suspendido {mod.suspensionDurationDays ? `(${mod.suspensionDurationDays}d)` : ''}
          </span>
        </span>
      )
    }
    if (mod.status === 'under_review') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 border border-purple-300 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-800 dark:bg-purple-950/70 dark:border-purple-800 dark:text-purple-300">
          <span>⚠️</span>
          <span>En Revisión ({mod.warningsCount || 1} adv.)</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-950/70 dark:border-emerald-800 dark:text-emerald-300">
        <span>✅</span>
        <span>Activo</span>
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* 1. TARJETAS KPI DE ADMINISTRACIÓN DE USUARIOS Y SEGURIDAD             */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
              : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
              Total Usuarios
            </span>
            <span className="text-lg">👥</span>
          </div>
          <div className="mt-1 text-2xl font-black">{stats.total}</div>
          <p className="mt-0.5 text-[11px] opacity-75">Cuentas registradas</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
            statusFilter === 'active'
              ? 'border-emerald-600 bg-emerald-50/80 dark:border-emerald-500 dark:bg-emerald-950/40'
              : 'border-zinc-200 bg-white hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Cuentas Activas
            </span>
            <span className="text-lg">✅</span>
          </div>
          <div className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {stats.activeCount}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500">Operando con normalidad</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('suspended')}
          className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
            statusFilter === 'suspended'
              ? 'border-amber-500 bg-amber-50/80 dark:border-amber-500 dark:bg-amber-950/40'
              : 'border-zinc-200 bg-white hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Suspendidos
            </span>
            <span className="text-lg">⏸️</span>
          </div>
          <div className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-400">
            {stats.suspendedCount}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500">Pausa temporal preventiva</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('blocked')}
          className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
            statusFilter === 'blocked'
              ? 'border-red-600 bg-red-50/80 dark:border-red-500 dark:bg-red-950/40'
              : 'border-zinc-200 bg-white hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400">
              Bloqueados
            </span>
            <span className="text-lg">🚫</span>
          </div>
          <div className="mt-1 text-2xl font-black text-red-700 dark:text-red-400">
            {stats.blockedCount}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500">Acceso y anuncios inhabilitados</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('verified')}
          className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
            statusFilter === 'verified'
              ? 'border-purple-600 bg-purple-50/80 dark:border-purple-500 dark:bg-purple-950/40'
              : 'border-zinc-200 bg-white hover:border-purple-300 dark:border-zinc-800 dark:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Comercios Verificados
            </span>
            <span className="text-lg">🏅</span>
          </div>
          <div className="mt-1 text-2xl font-black text-purple-700 dark:text-purple-400">
            {stats.verifiedSellersCount}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500">Con sello de confianza</p>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 2. BARRA DE FILTROS POR ROL, ESTADO Y MATRIZ DE PERMISOS DESPLEGABLE  */}
      {/* ===================================================================== */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Filtro por Rol */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Todos los Roles', count: users.length },
              {
                id: 'buyer',
                label: '🛒 Compradores',
                count: users.filter((u) => u.role === 'buyer').length,
              },
              {
                id: 'seller',
                label: '🏪 Vendedores',
                count: users.filter((u) => u.role === 'seller').length,
              },
              {
                id: 'admin',
                label: '🛡️ Administradores',
                count: users.filter((u) => u.role === 'admin').length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id as any)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === tab.id
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                <span>{tab.label}</span>
                <span className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.2 text-[10px]">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Estado */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="all">Estado: Todos ({users.length})</option>
              <option value="active">✅ Solo Activos ({stats.activeCount})</option>
              <option value="suspended">⏸️ Suspendidos ({stats.suspendedCount})</option>
              <option value="blocked">🚫 Bloqueados ({stats.blockedCount})</option>
              <option value="under_review">⚠️ En Revisión ({stats.reviewCount})</option>
              <option value="verified">🏅 Comercios Verificados ({stats.verifiedSellersCount})</option>
            </select>

            {/* Buscador */}
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar usuario, comercio, ciudad o teléfono..."
              className="w-full sm:w-64 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />

            <button
              type="button"
              onClick={() => setShowPermissionsMatrix(!showPermissionsMatrix)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 cursor-pointer"
            >
              📋 {showPermissionsMatrix ? 'Ocultar Matriz de Roles' : 'Ver Matriz de Roles'}
            </button>
          </div>
        </div>

        {/* Matriz Explicativa de Permisos (Colapsable para ahorrar espacio visual) */}
        {showPermissionsMatrix && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20 text-xs">
              <div className="font-bold text-blue-900 dark:text-blue-200">🛒 Comprador (buyer)</div>
              <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                Explora catálogos, contacta por WhatsApp y califica vendedores. No publica anuncios.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20 text-xs">
              <div className="font-bold text-emerald-900 dark:text-emerald-200">
                🏪 Vendedor (seller)
              </div>
              <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                Publica productos/servicios, administra inventario, recarga billetera y lanza campañas.
              </p>
            </div>
            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 dark:border-purple-900/40 dark:bg-purple-950/20 text-xs">
              <div className="font-bold text-purple-900 dark:text-purple-200">
                🛡️ Administrador (admin)
              </div>
              <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                Control total: modera anuncios, aprueba saldo, configura vitrinas y suspende o bloquea cuentas.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. TABLA INTEGRAL DE USUARIOS CON BLOQUEO, SUSPENSIÓN Y EXPEDIENTE    */}
      {/* ===================================================================== */}
      {filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-4xl">👥</span>
          <p className="mt-3 text-sm font-bold text-zinc-800 dark:text-zinc-200">
            No se encontraron usuarios con los filtros seleccionados
          </p>
          <button
            type="button"
            onClick={() => {
              setRoleFilter('all')
              setStatusFilter('all')
              setSearchQuery('')
            }}
            className="mt-3 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Usuario / Contacto</th>
                  <th className="py-3.5 px-4 font-semibold">Estado de Cuenta</th>
                  <th className="py-3.5 px-4 font-semibold">Comercio & Anuncios</th>
                  <th className="py-3.5 px-4 font-semibold">Rol Asignado</th>
                  <th className="py-3.5 px-4 font-semibold text-right">
                    Acciones de Moderación (Suspender / Bloquear / Administrar)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredUsers.map((u) => {
                  const isUpdatingRole = updatingUserId === u.id
                  const isProcessingMod = processingActionUserId === u.id
                  const initials = (u.full_name || 'U').slice(0, 2).toUpperCase()
                  const sellerInfo = getSellerInfo(u)
                  const mod = getUserModeration(u)

                  const sellerListings = sellerInfo
                    ? listings.filter((l) => l.seller_id === sellerInfo.id)
                    : []
                  const publishedCount = sellerListings.filter(
                    (l) => l.status === 'published'
                  ).length
                  const pausedCount = sellerListings.filter((l) => l.status === 'paused').length

                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        mod.status === 'blocked'
                          ? 'bg-red-50/30 dark:bg-red-950/10'
                          : mod.status === 'suspended'
                          ? 'bg-amber-50/30 dark:bg-amber-950/10'
                          : 'hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30'
                      }`}
                    >
                      {/* Columna 1: Usuario y Ciudad */}
                      <td className="py-4 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                              mod.status === 'blocked'
                                ? 'bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200'
                                : mod.status === 'suspended'
                                ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                                : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold truncate text-xs flex items-center gap-1.5">
                              <span>{u.full_name || 'Usuario sin nombre'}</span>
                            </div>
                            <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                              <span>📍 {u.city || sellerInfo?.city || 'Sin ciudad'}</span>
                              {(u.phone || sellerInfo?.whatsapp) && (
                                <span>• 📞 {u.phone || sellerInfo?.whatsapp}</span>
                              )}
                            </div>
                            <div
                              className="text-[10px] text-zinc-400 font-mono truncate"
                              title={u.id}
                            >
                              ID: {u.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Columna 2: Estado de Cuenta y Restricciones */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {renderStatusBadge(mod)}
                          {mod.reason && mod.status !== 'active' && (
                            <p
                              className="text-[10px] text-zinc-500 dark:text-zinc-400 max-w-48 line-clamp-2"
                              title={mod.reason}
                            >
                              Motivo: {mod.reason}
                            </p>
                          )}
                          {(!mod.canPublishListings || !mod.canCreateCampaigns) && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {!mod.canPublishListings && (
                                <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                                  Sin publicar
                                </span>
                              )}
                              {!mod.canCreateCampaigns && (
                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                  Sin campañas
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Columna 3: Comercio Vinculado y Publicaciones */}
                      <td className="py-4 px-4 text-xs">
                        {sellerInfo ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-44">
                                {sellerInfo.business_name}
                              </span>
                              <button
                                type="button"
                                disabled={isProcessingMod}
                                onClick={() => handleToggleVerifySeller(u)}
                                title={
                                  sellerInfo.verified
                                    ? 'Comercio Verificado (Clic para quitar verificación)'
                                    : 'No verificado (Clic para verificar comercio)'
                                }
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer ${
                                  sellerInfo.verified
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                                    : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-zinc-800 dark:border-zinc-700'
                                }`}
                              >
                                {sellerInfo.verified ? '🏅 Verificado' : '☆ Verificar'}
                              </button>
                            </div>
                            <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                              <span>
                                📦 <strong>{publishedCount}</strong> activos
                              </span>
                              {pausedCount > 0 && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  • ⏸️ {pausedCount} pausados
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">Sin comercio vinculado</span>
                        )}
                      </td>

                      {/* Columna 4: Selector Rápido de Rol */}
                      <td className="py-4 px-4">
                        {isUpdatingRole ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 animate-pulse">
                            ⏳ Actualizando...
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => onUpdateUserRole(u, 'buyer')}
                              disabled={u.role === 'buyer'}
                              className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                                u.role === 'buyer'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-zinc-600 hover:text-blue-700 hover:bg-white dark:text-zinc-400 dark:hover:bg-zinc-700'
                              }`}
                            >
                              🛒 Buyer
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateUserRole(u, 'seller')}
                              disabled={u.role === 'seller'}
                              className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                                u.role === 'seller'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-zinc-600 hover:text-emerald-700 hover:bg-white dark:text-zinc-400 dark:hover:bg-zinc-700'
                              }`}
                            >
                              🏪 Seller
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateUserRole(u, 'admin')}
                              disabled={u.role === 'admin'}
                              className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                                u.role === 'admin'
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-zinc-600 hover:text-purple-700 hover:bg-white dark:text-zinc-400 dark:hover:bg-zinc-700'
                              }`}
                            >
                              🛡️ Admin
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Columna 5: Botones de Suspensión, Bloqueo y Ventana de Administración */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          {mod.status !== 'suspended' && (
                            <button
                              type="button"
                              onClick={() => handleOpenUserModal(u, 'status', 'suspended')}
                              className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 transition-colors cursor-pointer"
                              title="Suspender temporalmente al usuario"
                            >
                              ⏸️ Suspender
                            </button>
                          )}

                          {mod.status !== 'blocked' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenUserModal(u, 'status', 'blocked')}
                              className="rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 transition-colors cursor-pointer"
                              title="Bloquear cuenta permanentemente"
                            >
                              🚫 Bloquear
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenUserModal(u, 'status', 'active')}
                              className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors cursor-pointer"
                              title="Desbloquear y reactivar usuario"
                            >
                              ✅ Reactivar
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenUserModal(u, 'status')}
                            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 transition-colors cursor-pointer"
                          >
                            ⚙️ Administrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. MODAL / VENTANA DE ADMINISTRACIÓN INTEGRAL DEL USUARIO             */}
      {/* ===================================================================== */}
      {selectedUserForModal && (() => {
        const u = selectedUserForModal
        const sellerInfo = getSellerInfo(u)
        const mod = getUserModeration(u)
        const userListings = sellerInfo
          ? listings.filter((l) => l.seller_id === sellerInfo.id)
          : []

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-5 my-8">
              {/* Cabecera del Modal */}
              <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-lg font-black text-purple-800 dark:bg-purple-950 dark:text-purple-200">
                    {(u.full_name || 'U').slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                        {u.full_name || 'Usuario Registrado'}
                      </h3>
                      {renderStatusBadge(mod)}
                    </div>
                    <p className="text-xs text-zinc-500">
                      Rol: <strong className="uppercase">{u.role}</strong>
                      {sellerInfo ? ` · Comercio: ${sellerInfo.business_name}` : ''} · ID:{' '}
                      <span className="font-mono">{u.id.slice(0, 12)}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUserForModal(null)}
                  className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Sub-pestañas dentro del Modal del Usuario */}
              <div className="flex flex-wrap gap-1.5 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                {[
                  { id: 'status', icon: '🛡️', label: '1. Bloquear / Suspender / Estado' },
                  { id: 'permissions', icon: '🔑', label: '2. Permisos y Restricciones' },
                  { id: 'profile', icon: '✏️', label: '3. Editar Datos y Comercio' },
                  {
                    id: 'listings',
                    icon: '📦',
                    label: `4. Publicaciones (${userListings.length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModalTab(tab.id as any)}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      modalTab === tab.id
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* TAB 1: BLOQUEAR / SUSPENDER / CAMBIAR ESTADO DE CUENTA */}
              {modalTab === 'status' && (
                <form onSubmit={handleApplyUserModeration} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-2">
                      Seleccionar Estado o Medida Administrativa
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          id: 'active' as const,
                          icon: '✅',
                          title: 'Cuenta Activa (Normal)',
                          desc: 'Habilita todos los permisos del rol asignado.',
                          border: 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30',
                        },
                        {
                          id: 'suspended' as const,
                          icon: '⏸️',
                          title: 'Suspender Temporalmente',
                          desc: 'Inhabilita publicar/anunciar por un número de días.',
                          border: 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30',
                        },
                        {
                          id: 'blocked' as const,
                          icon: '🚫',
                          title: 'Bloquear Permanentemente',
                          desc: 'Bloquea cuenta, comercio y pausa sus publicaciones.',
                          border: 'border-red-600 bg-red-50/60 dark:bg-red-950/30',
                        },
                        {
                          id: 'under_review' as const,
                          icon: '⚠️',
                          title: 'En Revisión / Advertencia',
                          desc: 'Registra advertencia formal y seguimiento de moderación.',
                          border: 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30',
                        },
                      ].map((st) => (
                        <label
                          key={st.id}
                          className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                            targetStatus === st.id
                              ? `border-2 ${st.border}`
                              : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="userTargetStatus"
                            checked={targetStatus === st.id}
                            onChange={() => {
                              setTargetStatus(st.id)
                              if (st.id === 'blocked' || st.id === 'suspended') {
                                setPauseAllUserListings(true)
                              }
                            }}
                            className="mt-1 h-4 w-4"
                          />
                          <div>
                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              {st.icon} {st.title}
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5">{st.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Duración de suspensión si elige 'suspended' */}
                  {targetStatus === 'suspended' && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/20">
                      <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-2">
                        ⏱️ Duración de la Suspensión Temporal
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { days: 1, label: '24 Horas (1 día)' },
                          { days: 3, label: '3 Días' },
                          { days: 7, label: '7 Días (1 semana)' },
                          { days: 15, label: '15 Días' },
                          { days: 30, label: '30 Días (1 mes)' },
                        ].map((d) => (
                          <button
                            key={d.days}
                            type="button"
                            onClick={() => setSuspensionDays(d.days)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
                              suspensionDays === d.days
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-amber-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Motivo rápido + campo de texto */}
                  {targetStatus !== 'active' && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Motivo de la Suspensión / Bloqueo / Advertencia *
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {[
                          'Incumplimiento de políticas del marketplace',
                          'Publicaciones duplicadas o spam reiterado',
                          'Reportes de compradores por falta de respuesta',
                          'Información o precios engañosos',
                          'Verificación de identidad pendiente',
                        ].map((presetReason) => (
                          <button
                            key={presetReason}
                            type="button"
                            onClick={() => setActionReason(presetReason)}
                            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 cursor-pointer"
                          >
                            + {presetReason}
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        required={targetStatus !== 'active'}
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="Describe el motivo de la medida administrativa..."
                        className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>
                  )}

                  {/* Opción automática sobre las publicaciones del vendedor */}
                  {sellerInfo && (
                    <label className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 cursor-pointer dark:border-zinc-800 dark:bg-zinc-800/40">
                      <div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {targetStatus === 'active'
                            ? '📦 Reactivar automáticamente sus publicaciones pausadas'
                            : '⏸️ Pausar automáticamente todas sus publicaciones activas en catálogo y publicidad'}
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          Este comercio tiene {userListings.length} publicaciones registradas.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={pauseAllUserListings}
                        onChange={(e) => setPauseAllUserListings(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300 text-purple-600"
                      />
                    </label>
                  )}

                  {/* Notas internas del administrador */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Notas Internas de Administración (Solo visibles para Admins)
                    </label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Ej. Se contactó por WhatsApp el día de hoy para validar inventario..."
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  {/* Historial reciente de moderación del usuario */}
                  {mod.history && mod.history.length > 0 && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-1.5">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
                        Historial Reciente de Moderación
                      </div>
                      {mod.history.slice(0, 3).map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400"
                        >
                          <span>
                            <strong>{h.action}:</strong> {h.reason}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {new Date(h.date).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setSelectedUserForModal(null)}
                      className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={processingActionUserId === u.id}
                      className={`rounded-xl px-5 py-2 text-xs font-extrabold text-white shadow-sm transition-colors cursor-pointer ${
                        targetStatus === 'blocked'
                          ? 'bg-red-600 hover:bg-red-500'
                          : targetStatus === 'suspended'
                          ? 'bg-amber-600 hover:bg-amber-500'
                          : 'bg-emerald-600 hover:bg-emerald-500'
                      }`}
                    >
                      {processingActionUserId === u.id
                        ? 'Aplicando...'
                        : targetStatus === 'blocked'
                        ? '🚫 Confirmar Bloqueo de Usuario'
                        : targetStatus === 'suspended'
                        ? `⏸️ Confirmar Suspensión (${suspensionDays} días)`
                        : targetStatus === 'under_review'
                        ? '⚠️ Registrar Advertencia / En Revisión'
                        : '✅ Guardar y Dejar Cuenta Activa'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: PERMISOS GRANULARES Y RESTRICCIONES INDIVIDUALES */}
              {modalTab === 'permissions' && (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-500">
                    Restringe o habilita funciones específicas para este usuario sin necesidad de bloquear toda su cuenta:
                  </p>

                  <div className="space-y-2.5">
                    {[
                      {
                        checked: canPublishListings,
                        onChange: setCanPublishListings,
                        title: '📦 Permitir crear y publicar anuncios en el catálogo',
                        desc: 'Si se desactiva, el usuario no podrá enviar nuevos productos ni servicios.',
                      },
                      {
                        checked: canCreateCampaigns,
                        onChange: setCanCreateCampaigns,
                        title: '📢 Permitir contratar campañas publicitarias patrocinadas',
                        desc: 'Si se desactiva, no podrá crear nuevas órdenes en Gran Vitrina ni Pasarelas.',
                      },
                      {
                        checked: canShowWhatsapp,
                        onChange: setCanShowWhatsapp,
                        title: '💬 Permitir botón de contacto directo por WhatsApp',
                        desc: 'Controla si sus publicaciones muestran enlace directo de WhatsApp.',
                      },
                      {
                        checked: hideFromShowcase,
                        onChange: setHideFromShowcase,
                        title: '👁️‍🗨️ Ocultar preventivamente de la Página de Publicidad (Portada)',
                        desc: 'Sus anuncios no aparecerán en las pasarelas de inicio aunque estén publicados.',
                      },
                    ].map((perm, idx) => (
                      <label
                        key={idx}
                        className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 p-3.5 cursor-pointer hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      >
                        <div>
                          <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {perm.title}
                          </div>
                          <p className="text-[11px] text-zinc-500">{perm.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={perm.checked}
                          onChange={(e) => perm.onChange(e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-300 text-purple-600"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleApplyUserModeration()}
                      className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-purple-500 cursor-pointer"
                    >
                      💾 Guardar Permisos del Usuario
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: EDITAR DATOS DE PERFIL Y COMERCIO VINCULADO */}
              {modalTab === 'profile' && (
                <form onSubmit={handleSaveUserProfileEdits} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Nombre Completo del Usuario
                      </label>
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Ciudad / Ubicación
                      </label>
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Teléfono Principal
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>

                    {sellerInfo && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            Nombre del Comercio / Negocio
                          </label>
                          <input
                            type="text"
                            value={editBusinessName}
                            onChange={(e) => setEditBusinessName(e.target.value)}
                            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            WhatsApp Comercial
                          </label>
                          <input
                            type="text"
                            value={editWhatsapp}
                            onChange={(e) => setEditWhatsapp(e.target.value)}
                            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      type="submit"
                      disabled={processingActionUserId === u.id}
                      className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-emerald-500 cursor-pointer"
                    >
                      💾 Guardar Datos del Usuario
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: CONTROL DE PUBLICACIONES DEL USUARIO */}
              {modalTab === 'listings' && (
                <div className="space-y-4">
                  {!sellerInfo ? (
                    <p className="text-xs text-zinc-500 py-6 text-center">
                      Este usuario tiene rol de comprador y no posee publicaciones asociadas.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Total de publicaciones de {sellerInfo.business_name}:{' '}
                          <strong>{userListings.length}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleBulkToggleSellerListings(sellerInfo.id, 'paused')}
                            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 cursor-pointer"
                          >
                            ⏸️ Pausar Todas
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleBulkToggleSellerListings(sellerInfo.id, 'published')
                            }
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                          >
                            ✅ Reactivar Todas
                          </button>
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        {userListings.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 text-xs"
                          >
                            <div className="min-w-0 pr-3">
                              <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-zinc-500">
                                Tipo: {item.type} · Estado:{' '}
                                <strong className="uppercase">{item.status}</strong>
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                item.status === 'published'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'paused'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-zinc-100 text-zinc-700'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
