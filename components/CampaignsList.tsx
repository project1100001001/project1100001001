'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { AdOrderWithRelations, AdOrderStatus } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'
import {
  resolveAdOrderPlacement,
  extractSeasonalRunwayMeta,
  FREE_INITIAL_AD_DAYS,
} from '@/lib/adPolicies'
import {
  DEFAULT_AD_PAGE_CONFIG,
  AD_PAGE_CONFIG_STORAGE_KEY,
  sanitizeAdPageConfig,
  getListingSpecialClassification,
  type DynamicRunwayConfig,
} from '@/lib/adPageConfig'

interface CampaignsListProps {
  initialOrders: AdOrderWithRelations[]
  balance: number
  advertiserName: string
  userId?: string
  sellerListings?: any[]
}

export default function CampaignsList({
  initialOrders,
  balance,
  advertiserName,
  userId,
  sellerListings = [],
}: CampaignsListProps) {
  const { t, locale } = useTranslation()
  const supabase = createClient()
  const [orders, setOrders] = useState<AdOrderWithRelations[]>(initialOrders)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [visibleLimit, setVisibleLimit] = useState<number>(10)
  const [selectedAnalyticsOrder, setSelectedAnalyticsOrder] =
    useState<AdOrderWithRelations | null>(null)
  const [customRunways, setCustomRunways] = useState<DynamicRunwayConfig[]>(
    DEFAULT_AD_PAGE_CONFIG.customRunways
  )

  // Estados para Visualizar y Editar Campaña (incluida la imagen cargada)
  const [editingOrder, setEditingOrder] = useState<AdOrderWithRelations | null>(null)
  const [editHeadline, setEditHeadline] = useState<string>('')
  const [editBody, setEditBody] = useState<string>('')
  const [editImageUrl, setEditImageUrl] = useState<string>('')
  const [editListingId, setEditListingId] = useState<string>('')
  const [editTargetCity, setEditTargetCity] = useState<string>('')
  const [editTargetCategory, setEditTargetCategory] = useState<string>('')
  const [editSeasonalPrefix, setEditSeasonalPrefix] = useState<string>('')
  const [editCtaLabel, setEditCtaLabel] = useState<string>('Contactar')
  const [uploadingEditImage, setUploadingEditImage] = useState<boolean>(false)
  const [savingEditOrder, setSavingEditOrder] = useState<boolean>(false)
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null)
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null)

  const handleOpenEditModal = (order: AdOrderWithRelations) => {
    setEditingOrder(order)
    setEditHeadline(order.headline || '')
    setEditBody(order.body || '')
    setEditImageUrl(order.image_url || '')
    setEditListingId(order.listing_id || (order.listing as any)?.id || '')
    setEditTargetCity(order.target_city || '')
    setEditCtaLabel(order.cta_label || 'Contactar')
    setEditErrorMsg(null)
    setEditSuccessMsg(null)

    const rawCat = (order.target_category || '').trim()
    const matchPrefix = rawCat.match(/^(\[(?:SOLO_TEMPORADA|PLAN_MAS_TEMPORADA):[^\]]+\])\s*(.*)$/)
    if (matchPrefix) {
      setEditSeasonalPrefix(matchPrefix[1])
      setEditTargetCategory(matchPrefix[2] || '')
    } else {
      setEditSeasonalPrefix('')
      setEditTargetCategory(rawCat)
    }
  }

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingOrder) return

    setUploadingEditImage(true)
    setEditErrorMsg(null)
    try {
      const cleanName = `${Date.now()}_ad_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const folderOwner = userId || (editingOrder as any).advertiser_id || 'shared'
      const filePath = `${folderOwner}/ads/${cleanName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('listings')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('listings')
        .getPublicUrl(uploadData?.path || filePath)
      if (data?.publicUrl) {
        setEditImageUrl(data.publicUrl)
      }
    } catch (err: any) {
      setEditErrorMsg(
        err.message ||
          (locale === 'en'
            ? 'Error uploading image. Check connection or format.'
            : 'Error al subir la imagen. Verifica la conexión o el formato.')
      )
    } finally {
      setUploadingEditImage(false)
      e.target.value = ''
    }
  }

  const handleSelectEditListing = (newListingId: string) => {
    setEditListingId(newListingId)
    if (!newListingId) return
    const found = sellerListings.find((l) => l.id === newListingId)
    if (found) {
      const media = [...(found.listing_media || [])].sort(
        (a: any, b: any) =>
          (a.position ?? a.sort_order ?? 0) - (b.position ?? b.sort_order ?? 0)
      )
      if (!editImageUrl && media[0]?.url) {
        setEditImageUrl(media[0].url)
      }
    }
  }

  const handleSaveCampaignEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingOrder) return
    if (!editHeadline.trim()) {
      setEditErrorMsg(
        locale === 'en'
          ? 'Please enter a headline for the campaign.'
          : 'Por favor ingresa un titular para la campaña.'
      )
      return
    }

    setSavingEditOrder(true)
    setEditErrorMsg(null)
    setEditSuccessMsg(null)

    try {
      const finalCategory = editSeasonalPrefix
        ? editTargetCategory.trim()
          ? `${editSeasonalPrefix} ${editTargetCategory.trim()}`
          : editSeasonalPrefix
        : editTargetCategory.trim() || null

      const updatePayload = {
        headline: editHeadline.trim(),
        body: editBody.trim() || null,
        image_url: editImageUrl.trim() || null,
        listing_id: editListingId || null,
        target_city: editTargetCity.trim() || null,
        target_category: finalCategory,
        cta_label: editCtaLabel.trim() || 'Contactar',
      }

      // 1. Intentar actualizar directamente en ad_order
      const { error: updateErr } = await supabase
        .from('ad_order')
        .update(updatePayload)
        .eq('id', editingOrder.id)

      // 2. Respaldo en base de datos dentro de listing.attrs.campaign_overrides (permitido por RLS incluso cuando la campaña está 'live')
      const targetListingId =
        editListingId || editingOrder.listing_id || (editingOrder.listing as any)?.id
      const targetListingObj =
        sellerListings.find((l) => l.id === targetListingId) ||
        (editingOrder.listing?.id === targetListingId ? editingOrder.listing : null)

      let savedInListingAttrs = false
      if (targetListingId) {
        const baseAttrs =
          targetListingObj && typeof (targetListingObj as any).attrs === 'object'
            ? { ...(targetListingObj as any).attrs }
            : {}
        const prevOverrides =
          baseAttrs.campaign_overrides && typeof baseAttrs.campaign_overrides === 'object'
            ? { ...baseAttrs.campaign_overrides }
            : {}

        const nextAttrs = {
          ...baseAttrs,
          custom_campaign_image_url: updatePayload.image_url,
          campaign_overrides: {
            ...prevOverrides,
            [editingOrder.id]: {
              ...updatePayload,
              updated_at: new Date().toISOString(),
            },
          },
        }

        const { error: listingUpdateErr } = await supabase
          .from('listing')
          .update({ attrs: nextAttrs })
          .eq('id', targetListingId)

        if (!listingUpdateErr) {
          savedInListingAttrs = true
          if (targetListingObj) {
            ;(targetListingObj as any).attrs = nextAttrs
          }
        }
      }

      // 3. Guardar también en caché local como respaldo instantáneo
      try {
        const rawLocal = localStorage.getItem('campaign_edits_override_v1')
        const parsedLocal = rawLocal ? JSON.parse(rawLocal) : {}
        parsedLocal[editingOrder.id] = {
          ...updatePayload,
          updated_at: new Date().toISOString(),
        }
        localStorage.setItem('campaign_edits_override_v1', JSON.stringify(parsedLocal))
      } catch {
        // Ignorar error de almacenamiento local
      }

      // Si ad_order dio un error distinto de RLS y tampoco se pudo respaldar en listing.attrs, lanzar error
      if (updateErr && !savedInListingAttrs) {
        const isRlsError =
          updateErr.message?.toLowerCase().includes('row-level security') ||
          updateErr.code === '42501'
        if (!isRlsError) {
          throw updateErr
        }
      }

      const updatedListingObj = editListingId
        ? sellerListings.find((l) => l.id === editListingId) ||
          (editingOrder.listing?.id === editListingId ? editingOrder.listing : null)
        : null

      const updatedOrder: AdOrderWithRelations = {
        ...editingOrder,
        ...updatePayload,
        listing: updatedListingObj as any,
      }

      setOrders((prev) =>
        prev.map((item) => (item.id === editingOrder.id ? updatedOrder : item))
      )
      setEditingOrder(updatedOrder)
      if (selectedAnalyticsOrder?.id === editingOrder.id) {
        setSelectedAnalyticsOrder(updatedOrder)
      }

      setEditSuccessMsg(
        locale === 'en'
          ? '✅ Campaign updated successfully!'
          : '✅ ¡Los datos e imagen de la campaña se actualizaron correctamente!'
      )
    } catch (err: any) {
      setEditErrorMsg(
        err.message ||
          (locale === 'en'
            ? 'Error updating campaign.'
            : 'Error al guardar los cambios de la campaña.')
      )
    } finally {
      setSavingEditOrder(false)
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AD_PAGE_CONFIG_STORAGE_KEY)
      if (raw) {
        const parsed = sanitizeAdPageConfig(JSON.parse(raw))
        setCustomRunways(parsed.customRunways || DEFAULT_AD_PAGE_CONFIG.customRunways)
      }
    } catch {
      // Usar predeterminado
    }

    // Aplicar posibles ediciones guardadas en listing.attrs.campaign_overrides o localStorage
    try {
      const rawLocal = localStorage.getItem('campaign_edits_override_v1')
      const localOverrides = rawLocal ? JSON.parse(rawLocal) : {}
      setOrders((prev) =>
        prev.map((order) => {
          const listingOverride = (order.listing as any)?.attrs?.campaign_overrides?.[order.id]
          const localOverride = localOverrides?.[order.id]
          const mergedOverride = listingOverride || localOverride
          if (!mergedOverride) return order
          return {
            ...order,
            headline: mergedOverride.headline ?? order.headline,
            body: mergedOverride.body !== undefined ? mergedOverride.body : order.body,
            image_url:
              mergedOverride.image_url !== undefined
                ? mergedOverride.image_url
                : order.image_url,
            listing_id:
              mergedOverride.listing_id !== undefined
                ? mergedOverride.listing_id
                : order.listing_id,
            target_city:
              mergedOverride.target_city !== undefined
                ? mergedOverride.target_city
                : order.target_city,
            target_category:
              mergedOverride.target_category !== undefined
                ? mergedOverride.target_category
                : order.target_category,
            cta_label:
              mergedOverride.cta_label !== undefined
                ? mergedOverride.cta_label
                : order.cta_label,
          }
        })
      )
    } catch {
      // Ignorar
    }
  }, [])

  const statusBadges: Record<
    AdOrderStatus,
    { label: string; bg: string; text: string; dot: string }
  > = {
    draft: {
      label: t.common.draft,
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-700 dark:text-zinc-300',
      dot: 'bg-zinc-400',
    },
    submitted: {
      label: t.common.inReview,
      bg: 'bg-amber-100/80 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    in_review: {
      label: t.common.inReview,
      bg: 'bg-amber-100/80 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    approved: {
      label: t.common.approved,
      bg: 'bg-blue-100/80 dark:bg-blue-950/40',
      text: 'text-blue-800 dark:text-blue-300',
      dot: 'bg-blue-500',
    },
    scheduled: {
      label: locale === 'en' ? 'Scheduled' : 'Programado',
      bg: 'bg-indigo-100/80 dark:bg-indigo-950/40',
      text: 'text-indigo-800 dark:text-indigo-300',
      dot: 'bg-indigo-500',
    },
    live: {
      label: locale === 'en' ? 'Active (Live)' : 'Activo (En vivo)',
      bg: 'bg-emerald-100/80 dark:bg-emerald-950/40',
      text: 'text-emerald-800 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
    rejected: {
      label: t.common.rejected,
      bg: 'bg-rose-100/80 dark:bg-rose-950/40',
      text: 'text-rose-800 dark:text-rose-300',
      dot: 'bg-rose-500',
    },
    paused: {
      label: locale === 'en' ? 'Paused' : 'Pausado',
      bg: 'bg-yellow-100/80 dark:bg-yellow-950/40',
      text: 'text-yellow-800 dark:text-yellow-300',
      dot: 'bg-yellow-500',
    },
    ended: {
      label: locale === 'en' ? 'Ended' : 'Finalizado',
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-600 dark:text-zinc-400',
      dot: 'bg-zinc-400',
    },
    cancelled: {
      label: locale === 'en' ? 'Cancelled' : 'Cancelado',
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-500 dark:text-zinc-400',
      dot: 'bg-zinc-400',
    },
  }

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'in_review') return o.status === 'submitted' || o.status === 'in_review'
    if (filterStatus === 'active') return o.status === 'live' || o.status === 'approved'
    if (filterStatus === 'ended') return o.status === 'ended' || o.status === 'cancelled'
    if (filterStatus === 'rejected') return o.status === 'rejected'
    return o.status === filterStatus
  })

  useEffect(() => {
    setVisibleLimit(itemsPerPage === 0 ? filteredOrders.length : Math.max(10, itemsPerPage))
  }, [itemsPerPage, filteredOrders.length, filterStatus])

  const visibleOrders =
    itemsPerPage === 0
      ? filteredOrders
      : filteredOrders.slice(0, Math.max(10, visibleLimit))

  const handleChangeItemsPerPage = (newCount: number) => {
    setItemsPerPage(newCount)
    setVisibleLimit(newCount === 0 ? filteredOrders.length : Math.max(10, newCount))
  }

  // Métricas agregadas globales
  const countInReview = orders.filter(
    (o) => o.status === 'submitted' || o.status === 'in_review'
  ).length
  const countLive = orders.filter((o) => o.status === 'live').length
  const totalClicks = orders.reduce((acc, curr) => acc + (Number(curr.clicks_count) || 0), 0)
  const totalContacts = orders.reduce((acc, curr) => acc + (Number(curr.contacts_count) || 0), 0)
  const totalImpressions = orders.reduce(
    (acc, curr) => acc + (Number(curr.impressions_count) || 0),
    0
  )
  const globalCtr =
    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0'
  const totalInvested = orders.reduce((acc, curr) => acc + (Number(curr.price_paid) || 0), 0)

  const tabs = [
    { id: 'all', label: t.campaigns.tabAll },
    { id: 'active', label: t.campaigns.tabActive },
    { id: 'in_review', label: t.campaigns.tabInReview },
    { id: 'ended', label: t.campaigns.tabEnded },
    { id: 'rejected', label: t.campaigns.tabRejected },
  ]

  // Cálculo de tiempo restante individual formateado
  const formatRemainingTime = (order: AdOrderWithRelations) => {
    if (order.status === 'submitted' || order.status === 'in_review') {
      return {
        label: t.campaigns.campaignInReviewBadge,
        color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
        detail: 'Iniciará al ser aprobada',
        percent: 0,
      }
    }
    if (order.status === 'ended' || order.isExpired) {
      return {
        label: t.campaigns.campaignExpiredBadge,
        color: 'text-zinc-600 bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400',
        detail: order.ends_at
          ? `Expiró el ${new Date(order.ends_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO')}`
          : 'Completada',
        percent: 100,
      }
    }
    if (order.status === 'rejected') {
      return {
        label: t.common.rejected,
        color: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
        detail: order.reject_reason || 'Rechazada por moderación',
        percent: 0,
      }
    }

    const days = order.daysRemaining ?? 0
    const hours = order.hoursRemaining ?? 0

    if (days === 0 && hours === 0) {
      return {
        label: 'Últimas horas',
        color: 'text-red-700 bg-red-50 border-red-200 animate-pulse dark:bg-red-950/40 dark:text-red-300',
        detail: 'Menos de 1 hora restante',
        percent: 95,
      }
    }

    return {
      label: `⏳ ${days}d ${hours}h restantes`,
      color: 'text-emerald-800 bg-emerald-50 border-emerald-200 font-bold dark:bg-emerald-950/40 dark:text-emerald-300',
      detail: order.ends_at
        ? `Vence: ${new Date(order.ends_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO')}`
        : `${days} días de exhibición`,
      percent: order.progressPercent ?? 30,
    }
  }

  return (
    <div className="space-y-8 select-none">
      {/* 1. Resumen de Saldo de Billetera y Anunciante */}
      <div className="rounded-3xl border border-purple-200/80 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white p-6 sm:p-7 shadow-xs dark:border-purple-900/40 dark:from-purple-950/30 dark:via-zinc-900 dark:to-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white font-black text-2xl shadow-md">
              💳
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
                {t.campaigns.advertiserAccount}: {advertiserName}
              </span>
              <div className="flex items-baseline gap-2.5 mt-1">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {t.campaigns.availableBalance}:
                </span>
                <span className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  ${balance.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')} COP
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-purple-900 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/50 rounded-2xl p-3 border border-purple-200/60 dark:border-purple-800/60 max-w-sm">
            <div className="flex items-center gap-1.5 font-bold">
              <span>💡</span>
              <span>Gestión de Saldo:</span>
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed">
              Recarga saldo o activa nuevos paquetes desde el menú lateral izquierdo en{' '}
              <strong>Mis Campañas → Recarga de Saldo</strong>.
            </p>
          </div>
        </div>

        {/* Resumen de Políticas y Tarifas de Publicidad para el Cliente */}
        <div className="mt-5 pt-4 border-t border-purple-200/60 dark:border-purple-800/50 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="rounded-xl bg-emerald-50/90 border border-emerald-200 px-3 py-2 dark:bg-emerald-950/40 dark:border-emerald-800/60">
            <span className="text-[10px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300 block">
              🎁 Publicidad Inicial
            </span>
            <span className="font-black text-emerald-700 dark:text-emerald-400">
              {FREE_INITIAL_AD_DAYS} Días GRATIS ($0)
            </span>
            <span className="block text-[10px] text-zinc-500">Al crear producto o servicio</span>
          </div>
          <div className="rounded-xl bg-white/90 border border-zinc-200 px-3 py-2 dark:bg-zinc-800/70 dark:border-zinc-700">
            <span className="text-[10px] font-extrabold uppercase text-blue-700 dark:text-blue-400 block">
              ✨ Individual Pasarela + Proveedor
            </span>
            <span className="font-black text-zinc-900 dark:text-zinc-50">$10.000 COP</span>
            <span className="block text-[10px] text-zinc-500">7 días + Incluye Pasarela de Proveedores</span>
          </div>
          <div className="rounded-xl bg-white/90 border border-zinc-200 px-3 py-2 dark:bg-zinc-800/70 dark:border-zinc-700">
            <span className="text-[10px] font-extrabold uppercase text-purple-700 dark:text-purple-400 block">
              🏆 Individual Gran Vitrina + Proveedor
            </span>
            <span className="font-black text-zinc-900 dark:text-zinc-50">$20.000 COP</span>
            <span className="block text-[10px] text-zinc-500">7 días + Incluye Pasarela de Proveedores</span>
          </div>
          <div className="rounded-xl bg-purple-100/80 border border-purple-300 px-3 py-2 dark:bg-purple-950/60 dark:border-purple-700">
            <span className="text-[10px] font-extrabold uppercase text-purple-900 dark:text-purple-300 block">
              🔥 Plan Combo + Proveedor
            </span>
            <span className="font-black text-purple-700 dark:text-purple-300">$25.000 COP</span>
            <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
              Vitrina + Pasarela + Pasarela Proveedores
            </span>
          </div>
        </div>
      </div>

      {/* 2. Grid de Métricas de Rendimiento de Campañas (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Activas */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              {t.campaigns.activeLive}
            </span>
            {countLive > 0 && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />}
          </div>
          <div className="mt-1.5 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {countLive}
          </div>
          <span className="text-[10px] text-zinc-400">en exhibición portada</span>
        </div>

        {/* Total Clics Generados */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
            👆 {t.campaigns.totalClicks}
          </span>
          <div className="mt-1.5 text-2xl font-black text-purple-600 dark:text-purple-400">
            {totalClicks.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}
          </div>
          <span className="text-[10px] text-zinc-400">tráfico a ficha comercial</span>
        </div>

        {/* Contactos WhatsApp Directos */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            💬 {t.campaigns.whatsappContacts}
          </span>
          <div className="mt-1.5 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {totalContacts.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}
          </div>
          <span className="text-[10px] text-zinc-400">conversaciones iniciadas</span>
        </div>

        {/* Impresiones en Vitrina */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            👁️ {t.campaigns.impressionsCount}
          </span>
          <div className="mt-1.5 text-2xl font-black text-blue-600 dark:text-blue-400">
            {totalImpressions.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}
          </div>
          <span className="text-[10px] text-zinc-400">vistas en gran vitrina</span>
        </div>

        {/* Tasa de Clics (CTR) */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            🎯 {t.campaigns.ctrRate}
          </span>
          <div className="mt-1.5 text-2xl font-black text-amber-600 dark:text-amber-400">
            {globalCtr}%
          </div>
          <span className="text-[10px] text-zinc-400">efectividad de anuncio</span>
        </div>

        {/* Total Invertido */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            💰 {t.campaigns.totalInvested}
          </span>
          <div className="mt-1.5 text-lg font-black text-zinc-900 dark:text-zinc-100">
            ${totalInvested.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}
          </div>
          <span className="text-[10px] text-zinc-400">COP en paquetes</span>
        </div>
      </div>

      {/* 3. Filtros de Estado y Controles de Cantidad / Modo de Vista */}
      {orders.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  filterStatus === tab.id
                    ? 'bg-purple-600 text-white shadow-xs scale-105'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {locale === 'en'
                ? `Showing ${visibleOrders.length} of ${filteredOrders.length}`
                : `Mostrando ${visibleOrders.length} de ${filteredOrders.length}`}
            </span>

            {/* Selector de Cantidad de Ítems a Cargar (Mínimo 10 inicialmente) */}
            <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 px-2.5 py-1 shadow-2xs">
              <label
                htmlFor="campaigns-items-per-page"
                className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 whitespace-nowrap"
              >
                {locale === 'en' ? 'Load:' : 'Cargar:'}
              </label>
              <select
                id="campaigns-items-per-page"
                value={itemsPerPage}
                onChange={(e) => handleChangeItemsPerPage(Number(e.target.value))}
                className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:border-purple-500 focus:outline-none cursor-pointer shadow-2xs"
                title="Seleccionar cantidad de campañas a cargar (mínimo 10 inicialmente)"
              >
                <option value={10}>10 ítems</option>
                <option value={15}>15 ítems</option>
                <option value={20}>20 ítems</option>
                <option value={30}>30 ítems</option>
                <option value={50}>50 ítems</option>
                <option value={0}>{locale === 'en' ? `All (${filteredOrders.length})` : `Todos (${filteredOrders.length})`}</option>
              </select>
            </div>

            {/* Selector de Modo de Visualización (Lista predeterminada) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-purple-700 shadow-xs dark:bg-zinc-900 dark:text-purple-400 ring-1 ring-zinc-200 dark:ring-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
                title="Modo de visualización en lista"
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
                title="Modo de visualización en cuadrícula"
              >
                <span>⊞</span>
                <span className="hidden sm:inline">Cuadrícula</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Lista de Campañas */}
      {orders.length === 0 ? (
        <div className="my-10 rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-5xl">📢</span>
          <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {t.campaigns.emptyTitle}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            {t.campaigns.emptyDesc}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 px-5 py-3 text-xs font-semibold text-purple-800 dark:text-purple-300">
            <span>👈</span>
            <span>
              {locale === 'en'
                ? 'Select "Mis Campañas → Configurar Campaña" on the left menu to feature your first product.'
                : 'Usa el menú lateral izquierdo en "Mis Campañas → Configurar Campaña" para destacar tu primera publicación.'}
            </span>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          {locale === 'en'
            ? 'No campaigns match the selected filter.'
            : 'No hay campañas que coincidan con este filtro.'}
        </div>
      ) : (
        <>
          {/* Vista Cuadrícula (Tarjetas en Cuadrícula 2 columnas en móvil) */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {visibleOrders.map((order) => {
                const badge = statusBadges[order.status] || {
                  label: order.status,
                  bg: 'bg-zinc-100 dark:bg-zinc-800',
                  text: 'text-zinc-700 dark:text-zinc-300',
                  dot: 'bg-zinc-400',
                }
                const remaining = formatRemainingTime(order)
                const ctr =
                  order.impressions_count && order.impressions_count > 0
                    ? (
                        ((order.clicks_count || 0) / order.impressions_count) *
                        100
                      ).toFixed(1)
                    : '0.0'

                return (
                  <div
                    key={order.id}
                    className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-zinc-200 bg-white p-3 sm:p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 sm:space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-2.5 sm:gap-3.5">
                      <div className="w-full sm:h-18 sm:w-18 aspect-[4/3] sm:aspect-square shrink-0 overflow-hidden rounded-xl sm:rounded-2xl bg-zinc-100 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
                        {order.image_url ? (
                          <img src={order.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl">📢</div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 w-full">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-black ${badge.bg} ${badge.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                          <span className="text-[11px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400">
                            ${Number(order.price_paid).toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}
                          </span>
                        </div>

                        <h4 className="mt-1 font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-50 line-clamp-2 sm:truncate">
                          {order.headline}
                        </h4>
                        {order.listing && (
                          <div className="mt-0.5 space-y-1">
                            <Link
                              href={`/catalogo/${order.listing.id}`}
                              className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 hover:underline block truncate"
                            >
                              🔗 {order.listing.title}
                            </Link>
                            {(() => {
                              const specialClass = getListingSpecialClassification(
                                order.listing as any,
                                customRunways
                              )
                              return specialClass ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  ⭐ Catálogo Exclusivo: {specialClass.title || (specialClass as any).titleEs}
                                </span>
                              ) : null
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vigencia y Barra de Tiempo */}
                    <div className="rounded-xl sm:rounded-2xl bg-zinc-50 p-2 sm:p-3 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between gap-1 text-xs mb-1">
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] sm:text-[10px] border truncate ${remaining.color}`}>
                          {remaining.label}
                        </span>
                        <span className="hidden sm:inline text-[11px] text-zinc-500">{remaining.detail}</span>
                      </div>

                      {/* Barra de progreso de días */}
                      <div className="h-1.5 sm:h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${remaining.percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Métricas */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="rounded-lg sm:rounded-xl bg-purple-50/50 p-1.5 sm:p-2 dark:bg-purple-950/20">
                        <span className="text-[9px] sm:text-[10px] font-bold text-purple-700 dark:text-purple-300 block">
                          👆 Clics
                        </span>
                        <strong className="text-xs sm:text-sm font-black text-purple-900 dark:text-purple-100">
                          {order.clicks_count || 0}
                        </strong>
                      </div>

                      <div className="rounded-lg sm:rounded-xl bg-emerald-50/50 p-1.5 sm:p-2 dark:bg-emerald-950/20">
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">
                          💬 WA
                        </span>
                        <strong className="text-xs sm:text-sm font-black text-emerald-900 dark:text-emerald-100">
                          {order.contacts_count || 0}
                        </strong>
                      </div>

                      <div className="rounded-lg sm:rounded-xl bg-blue-50/50 p-1.5 sm:p-2 dark:bg-blue-950/20">
                        <span className="text-[9px] sm:text-[10px] font-bold text-blue-700 dark:text-blue-300 block">
                          🎯 CTR
                        </span>
                        <strong className="text-xs sm:text-sm font-black text-blue-900 dark:text-blue-100">
                          {ctr}%
                        </strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(order)}
                        className="w-full inline-flex items-center justify-center gap-1 rounded-xl border border-purple-300 bg-purple-50/80 py-2 text-[11px] sm:text-xs font-bold text-purple-800 shadow-2xs hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-200 transition-colors cursor-pointer"
                      >
                        <span>✏️</span>
                        <span className="truncate">
                          {locale === 'en' ? 'View / Edit' : 'Ver / Editar'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedAnalyticsOrder(order)}
                        className="w-full inline-flex items-center justify-center gap-1 rounded-xl border border-zinc-300 bg-white py-2 text-[11px] sm:text-xs font-bold text-zinc-800 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                      >
                        <span>📊</span>
                        <span className="truncate">{t.campaigns.viewAnalyticsBtn}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Vista Móvil Modo Lista (Filas Horizontales Compactas) */}
          {viewMode === 'list' && (
            <div className="md:hidden flex flex-col gap-2.5">
              {visibleOrders.map((order) => {
                const badge = statusBadges[order.status] || {
                  label: order.status,
                  bg: 'bg-zinc-100 dark:bg-zinc-800',
                  text: 'text-zinc-700 dark:text-zinc-300',
                  dot: 'bg-zinc-400',
                }
                const remaining = formatRemainingTime(order)
                const ctr =
                  order.impressions_count && order.impressions_count > 0
                    ? (
                        ((order.clicks_count || 0) / order.impressions_count) *
                        100
                      ).toFixed(1)
                    : '0.0'

                return (
                  <div
                    key={order.id}
                    className="flex flex-row items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {/* Miniatura izquierda */}
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
                      {order.image_url ? (
                        <img src={order.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg">📢</div>
                      )}
                    </div>

                    {/* Información compacta en fila */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black ${badge.bg} ${badge.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] border truncate ${remaining.color}`}>
                          {remaining.label}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-50 truncate">
                        {order.headline}
                      </h4>

                      <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            👆 {order.clicks_count || 0}
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            💬 {order.contacts_count || 0}
                          </span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            🎯 {ctr}%
                          </span>
                        </div>
                        <span className="font-black text-zinc-900 dark:text-zinc-100">
                          ${Number(order.price_paid).toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}
                        </span>
                      </div>
                    </div>

                    {/* Botones rápidos de Ver/Editar y Métricas */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(order)}
                        className="rounded-xl border border-purple-300 bg-purple-50 px-2.5 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-200 cursor-pointer"
                        title={locale === 'en' ? 'View / Edit Campaign' : 'Ver / Editar Campaña'}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAnalyticsOrder(order)}
                        className="rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                        title={t.campaigns.viewAnalyticsBtn}
                      >
                        📊
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Vista Escritorio Modo Lista (Tabla Exhaustiva con Métricas y Tiempos) */}
          {viewMode === 'list' && (
            <div className="hidden md:block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                  <thead className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <tr>
                      <th scope="col" className="px-5 py-4 font-bold">
                        {locale === 'en' ? 'Ad Creative & Product' : 'Anuncio & Publicación'}
                      </th>
                      <th scope="col" className="px-4 py-4 font-bold">
                        {t.campaigns.status}
                      </th>
                      <th scope="col" className="px-5 py-4 font-bold">
                        {t.campaigns.timeRemaining}
                      </th>
                      <th scope="col" className="px-5 py-4 font-bold">
                        {locale === 'en' ? 'Performance Metrics' : 'Métricas de Tráfico'}
                      </th>
                      <th scope="col" className="px-4 py-4 font-bold">
                        {locale === 'en' ? 'Paid / Package' : 'Inversión'}
                      </th>
                      <th scope="col" className="px-4 py-4 text-center font-bold">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {visibleOrders.map((order) => {
                      const badge = statusBadges[order.status] || {
                        label: order.status,
                        bg: 'bg-zinc-100 dark:bg-zinc-800',
                        text: 'text-zinc-700 dark:text-zinc-300',
                        dot: 'bg-zinc-400',
                      }
                      const remaining = formatRemainingTime(order)
                      const ctr =
                        order.impressions_count && order.impressions_count > 0
                          ? (
                              ((order.clicks_count || 0) / order.impressions_count) *
                              100
                            ).toFixed(1)
                          : '0.0'

                      return (
                        <tr key={order.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                          {/* 1. Anuncio Creatividad */}
                          <td className="px-5 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                            <div className="flex items-start gap-3.5">
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
                                {order.image_url ? (
                                  <img
                                    src={order.image_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-lg">
                                    📢
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 max-w-xs">
                                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                                  {order.headline}
                                </div>
                                {order.body && (
                                  <div className="text-xs text-zinc-500 truncate mt-0.5">
                                    {order.body}
                                  </div>
                                )}
                                {order.listing && (
                                  <div className="mt-1 space-y-1">
                                    <div className="text-[11px] text-purple-600 dark:text-purple-400 flex items-center gap-1 truncate">
                                      <span>🔗 Publicación:</span>
                                      <Link
                                        href={`/catalogo/${order.listing.id}`}
                                        className="underline hover:text-purple-700 truncate"
                                      >
                                        {order.listing.title}
                                      </Link>
                                    </div>
                                    {(() => {
                                      const specialClass = getListingSpecialClassification(
                                        order.listing as any,
                                        customRunways
                                      )
                                      return specialClass ? (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                          ⭐ Catálogo Exclusivo: {specialClass.title || (specialClass as any).titleEs}
                                        </span>
                                      ) : null
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. Estado */}
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${badge.bg} ${badge.text}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          </td>

                          {/* 3. Vigencia y Tiempo Restante */}
                          <td className="px-5 py-4">
                            <div className="space-y-1.5 min-w-[170px]">
                              <div className="flex items-center justify-between">
                                <span className={`rounded-md px-2 py-0.5 text-[10px] border ${remaining.color}`}>
                                  {remaining.label}
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200/60 dark:border-zinc-700/60">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full transition-all duration-500"
                                  style={{ width: `${remaining.percent}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                {remaining.detail}
                              </div>
                            </div>
                          </td>

                          {/* 4. Métricas de Rendimiento */}
                          <td className="px-5 py-4">
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-purple-600 dark:text-purple-400">
                                  👆 {order.clicks_count || 0} clics
                                </span>
                                <span className="text-zinc-300 dark:text-zinc-600">•</span>
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                  💬 {order.contacts_count || 0} WhatsApp
                                </span>
                              </div>
                              <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                                <span>👁️ {order.impressions_count || 0} vistas</span>
                                <span>•</span>
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                  CTR: {ctr}%
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 5. Inversión y Plan Oficial */}
                          <td className="px-4 py-4">
                            <div className="font-black text-sm text-zinc-900 dark:text-zinc-50">
                              ${Number(order.price_paid).toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}
                            </div>
                            <div className="text-[10px] font-semibold text-purple-700 dark:text-purple-400">
                              {(() => {
                                const pl = resolveAdOrderPlacement(order)
                                return locale === 'en' ? pl.planLabelEn : pl.planLabelEs
                              })()}
                            </div>
                          </td>

                          {/* 6. Botones de Acción (Ver/Editar + Analítica) */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(order)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 shadow-2xs hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-200 dark:hover:bg-purple-900/60 transition-colors cursor-pointer"
                              >
                                <span>✏️</span>
                                <span>{locale === 'en' ? 'View / Edit' : 'Ver / Editar'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedAnalyticsOrder(order)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                              >
                                <span>📊</span>
                                <span>Métricas</span>
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

          {/* Control inferior para cargar más campañas si hay más que el límite actual */}
          {filteredOrders.length > visibleOrders.length && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                {locale === 'en'
                  ? `Showing ${visibleOrders.length} of ${filteredOrders.length} campaigns`
                  : `Mostrando ${visibleOrders.length} de ${filteredOrders.length} campañas disponibles`}
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleLimit((prev) =>
                      Math.min(
                        filteredOrders.length,
                        prev + (itemsPerPage > 0 ? itemsPerPage : 10)
                      )
                    )
                  }
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  ➕ Cargar {Math.min(itemsPerPage > 0 ? itemsPerPage : 10, filteredOrders.length - visibleOrders.length)} más
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeItemsPerPage(0)}
                  className="rounded-xl border border-zinc-300 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Ver todos ({filteredOrders.length})
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL DE ANÁLISIS DETALLADO DE CAMPAÑA (ANALYTICS MODAL)               */}
      {/* ========================================================================= */}
      {selectedAnalyticsOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-lg dark:bg-purple-950 dark:text-purple-300">
                  📊
                </span>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                    {t.campaigns.analyticsModalTitle}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t.campaigns.analyticsModalSubtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnalyticsOrder(null)}
                className="h-8 w-8 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="mt-6 space-y-6">
              {/* Tarjeta de Creatividad del Anuncio */}
              <div className="flex items-center gap-4 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
                <div className="h-18 w-18 shrink-0 overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                  {selectedAnalyticsOrder.image_url ? (
                    <img
                      src={selectedAnalyticsOrder.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl select-none">📢</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">
                    {selectedAnalyticsOrder.package?.name || 'Campaña Patrocinada'}
                  </span>
                  <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-50 truncate">
                    {selectedAnalyticsOrder.headline}
                  </h4>
                  {selectedAnalyticsOrder.listing && (
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <Link
                        href={`/catalogo/${selectedAnalyticsOrder.listing.id}`}
                        target="_blank"
                        className="font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        <span>Ver publicación en catálogo</span>
                        <span>↗</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Métricas Principales Desglosadas */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">
                  Resultados Comerciales Generados
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 text-center dark:border-purple-900/40 dark:bg-purple-950/20">
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block">
                      👆 Clics Totales
                    </span>
                    <strong className="mt-1 block text-2xl font-black text-purple-900 dark:text-purple-100">
                      {selectedAnalyticsOrder.clicks_count || 0}
                    </strong>
                    <span className="text-[10px] text-purple-600/80">interacciones</span>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
                      💬 Leads WhatsApp
                    </span>
                    <strong className="mt-1 block text-2xl font-black text-emerald-900 dark:text-emerald-100">
                      {selectedAnalyticsOrder.contacts_count || 0}
                    </strong>
                    <span className="text-[10px] text-emerald-600/80">contactos directos</span>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-center dark:border-blue-900/40 dark:bg-blue-950/20">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block">
                      👁️ Vistas Vitrina
                    </span>
                    <strong className="mt-1 block text-2xl font-black text-blue-900 dark:text-blue-100">
                      {selectedAnalyticsOrder.impressions_count || 0}
                    </strong>
                    <span className="text-[10px] text-blue-600/80">impresiones</span>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block">
                      🎯 Efectividad CTR
                    </span>
                    <strong className="mt-1 block text-2xl font-black text-amber-900 dark:text-amber-100">
                      {selectedAnalyticsOrder.impressions_count &&
                      selectedAnalyticsOrder.impressions_count > 0
                        ? (
                            ((selectedAnalyticsOrder.clicks_count || 0) /
                              selectedAnalyticsOrder.impressions_count) *
                            100
                          ).toFixed(1)
                        : '0.0'}
                      %
                    </strong>
                    <span className="text-[10px] text-amber-600/80">ratio de clics</span>
                  </div>
                </div>
              </div>

              {/* Vigencia y Fechas */}
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Estado de Vigencia:
                  </span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {selectedAnalyticsOrder.daysRemaining ?? 0} días restantes
                  </span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full"
                    style={{ width: `${selectedAnalyticsOrder.progressPercent ?? 50}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-zinc-500 pt-1">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">
                      {t.campaigns.campaignStarted}
                    </span>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {selectedAnalyticsOrder.starts_at
                        ? new Date(selectedAnalyticsOrder.starts_at).toLocaleString(
                            locale === 'en' ? 'en-US' : 'es-CO'
                          )
                        : 'Al ser aprobada'}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">
                      {t.campaigns.campaignEnds}
                    </span>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {selectedAnalyticsOrder.ends_at
                        ? new Date(selectedAnalyticsOrder.ends_at).toLocaleString(
                            locale === 'en' ? 'en-US' : 'es-CO'
                          )
                        : 'Sin fecha de fin'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Inversión y Costo por Clic */}
              <div className="flex items-center justify-between rounded-2xl bg-purple-50/40 p-4 text-xs dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60">
                <div>
                  <span className="text-purple-700 dark:text-purple-300 font-bold">
                    Inversión Pagada:
                  </span>
                  <div className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                    ${Number(selectedAnalyticsOrder.price_paid).toLocaleString(
                      locale === 'en' ? 'en-US' : 'es-CO'
                    )}{' '}
                    COP
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-zinc-500 text-[11px]">Costo aprox. por Clic:</span>
                  <div className="font-bold text-zinc-700 dark:text-zinc-300">
                    ~$
                    {Math.round(
                      selectedAnalyticsOrder.price_paid /
                        Math.max(1, selectedAnalyticsOrder.clicks_count || 1)
                    ).toLocaleString('es-CO')}{' '}
                    COP
                  </div>
                </div>
              </div>
            </div>

            {/* Pie del Modal */}
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const orderToEdit = selectedAnalyticsOrder
                  setSelectedAnalyticsOrder(null)
                  handleOpenEditModal(orderToEdit)
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50 px-4 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-200 transition-colors cursor-pointer"
              >
                <span>✏️</span>
                <span>{locale === 'en' ? 'View / Edit Campaign' : 'Ver / Editar Campaña'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAnalyticsOrder(null)}
                className="rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 transition-colors cursor-pointer"
              >
                {t.campaigns.closeModal}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL DE VISUALIZACIÓN Y EDICIÓN DE CAMPAÑA (INCLUIDA LA IMAGEN)       */}
      {/* ========================================================================= */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[92vh] overflow-y-auto">
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-lg dark:bg-purple-950 dark:text-purple-300">
                  ✏️
                </span>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                    {locale === 'en'
                      ? 'View & Edit Campaign Details'
                      : 'Visualizar y Editar Campaña'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {locale === 'en'
                      ? 'Review or update your campaign fields, linked publication, and uploaded image.'
                      : 'Consulta todos los campos de tu campaña y edita su titular, textos, publicación o imagen cargada.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="h-8 w-8 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCampaignEdit} className="mt-5 space-y-5">
              {/* Mensajes de estado */}
              {editErrorMsg && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  ⚠️ {editErrorMsg}
                </div>
              )}

              {editSuccessMsg && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {editSuccessMsg}
                </div>
              )}

              {/* Resumen Informativo de solo lectura (Plan, Estado, Inversión, ID) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-800/50">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-zinc-400">
                    {locale === 'en' ? 'Plan / Placement' : 'Plan Contratado'}
                  </span>
                  <strong className="mt-0.5 block font-black text-purple-700 dark:text-purple-300 truncate">
                    {(() => {
                      const pl = resolveAdOrderPlacement(editingOrder)
                      return locale === 'en' ? pl.planLabelEn : pl.planLabelEs
                    })()}
                  </strong>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase text-zinc-400">
                    {locale === 'en' ? 'Status' : 'Estado'}
                  </span>
                  <strong className="mt-0.5 block font-bold text-zinc-900 dark:text-zinc-100">
                    {(statusBadges[editingOrder.status] || { label: editingOrder.status }).label}
                  </strong>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase text-zinc-400">
                    {locale === 'en' ? 'Paid Investment' : 'Inversión Pagada'}
                  </span>
                  <strong className="mt-0.5 block font-black text-emerald-600 dark:text-emerald-400">
                    ${Number(editingOrder.price_paid).toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')} COP
                  </strong>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase text-zinc-400">
                    {locale === 'en' ? 'Duration' : 'Vigencia'}
                  </span>
                  <strong className="mt-0.5 block font-bold text-zinc-800 dark:text-zinc-200">
                    {editingOrder.daysRemaining ?? FREE_INITIAL_AD_DAYS}{' '}
                    {locale === 'en' ? 'days left' : 'días rest.'}
                  </strong>
                </div>
              </div>

              {/* 1. IMAGEN DE LA CAMPAÑA (Visualización + Carga de nueva imagen + Miniaturas) */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                      🖼️ {locale === 'en' ? 'Campaign Image' : 'Imagen Cargada de la Campaña'}
                    </label>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {locale === 'en'
                        ? 'Preview the current image or upload a new one from your device.'
                        : 'Visualiza la imagen actual o reemplázala subiendo otra desde tu dispositivo.'}
                    </p>
                  </div>

                  <label
                    className={`inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition-colors cursor-pointer ${
                      uploadingEditImage ? 'opacity-60 pointer-events-none' : ''
                    }`}
                  >
                    <span>{uploadingEditImage ? '⏳' : '📤'}</span>
                    <span>
                      {uploadingEditImage
                        ? locale === 'en'
                          ? 'Uploading...'
                          : 'Subiendo imagen...'
                        : locale === 'en'
                          ? 'Upload / Change Image'
                          : 'Cambiar / Subir Imagen'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageUpload}
                      disabled={uploadingEditImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Vista previa grande de la imagen cargada */}
                <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900">
                  {editImageUrl ? (
                    <div className="relative h-48 sm:h-56 w-full flex items-center justify-center bg-zinc-950/5 dark:bg-zinc-950">
                      <img
                        src={editImageUrl}
                        alt={editHeadline || 'Imagen de la campaña'}
                        className="h-full w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setEditImageUrl('')}
                        className="absolute top-2.5 right-2.5 rounded-xl bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-black/90 transition-colors cursor-pointer"
                      >
                        🗑️ {locale === 'en' ? 'Remove image' : 'Quitar imagen'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-36 text-center p-4 text-zinc-400">
                      <span className="text-3xl mb-1">🖼️</span>
                      <span className="text-xs font-semibold">
                        {locale === 'en'
                          ? 'No image selected for this campaign'
                          : 'Sin imagen cargada en este momento'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Selector rápido de fotos desde la publicación vinculada */}
                {(() => {
                  const activeListing = sellerListings.find((l) => l.id === editListingId)
                  const mediaList = activeListing?.listing_media
                    ? [...activeListing.listing_media].sort(
                        (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
                      )
                    : []
                  if (mediaList.length === 0) return null
                  return (
                    <div className="pt-1">
                      <span className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1.5">
                        📸{' '}
                        {locale === 'en'
                          ? 'Or select an image from the linked publication:'
                          : 'O selecciona una foto de tu publicación vinculada:'}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {mediaList.map((m: any) => (
                          <button
                            key={m.id || m.url}
                            type="button"
                            onClick={() => setEditImageUrl(m.url)}
                            className={`h-14 w-14 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                              editImageUrl === m.url
                                ? 'border-purple-600 ring-2 ring-purple-500/30 scale-105'
                                : 'border-zinc-200 opacity-80 hover:opacity-100 dark:border-zinc-700'
                            }`}
                          >
                            <img src={m.url} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* URL de la imagen editable */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                    {locale === 'en'
                      ? 'Image URL (automatically filled on upload):'
                      : 'Enlace de la imagen (se actualiza automáticamente al subir archivo):'}
                  </label>
                  <input
                    type="url"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-800 focus:border-purple-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* 2. PUBLICACIÓN VINCULADA */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  🔗{' '}
                  {locale === 'en'
                    ? 'Linked Catalog Publication'
                    : 'Publicación del Catálogo Vinculada'}
                </label>
                <select
                  value={editListingId}
                  onChange={(e) => handleSelectEditListing(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-purple-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="">
                    {locale === 'en'
                      ? '-- No linked publication --'
                      : '-- Sin publicación vinculada --'}
                  </option>
                  {sellerListings.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} {item.city ? `(${item.city})` : ''}
                    </option>
                  ))}
                  {editListingId &&
                    !sellerListings.some((l) => l.id === editListingId) &&
                    editingOrder.listing && (
                      <option value={editListingId}>{editingOrder.listing.title}</option>
                    )}
                </select>
              </div>

              {/* 3. TITULAR PRINCIPAL DE LA CAMPAÑA */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  ✨ {locale === 'en' ? 'Campaign Headline *' : 'Titular Principal de la Campaña *'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={90}
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  placeholder={
                    locale === 'en'
                      ? 'Ex: 20% Off Carpentry & Home Installations'
                      : 'Ej: Oferta Especial en Servicios de Carpintería y Reformas'
                  }
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:border-purple-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* 4. TEXTO SECUNDARIO / DESCRIPCIÓN DE LA OFERTA */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  📝{' '}
                  {locale === 'en'
                    ? 'Secondary Text / Offer Description'
                    : 'Texto Secundario / Descripción de la Oferta'}
                </label>
                <textarea
                  rows={3}
                  maxLength={220}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder={
                    locale === 'en'
                      ? 'Describe your promotion, guarantee, or immediate availability...'
                      : 'Describe los beneficios, garantía o disponibilidad inmediata de tu anuncio...'
                  }
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-purple-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* 5. CIUDAD OBJETIVO, CATEGORÍA Y TEXTO DEL BOTÓN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    📍 {locale === 'en' ? 'Target City' : 'Ciudad Objetivo'}
                  </label>
                  <input
                    type="text"
                    value={editTargetCity}
                    onChange={(e) => setEditTargetCity(e.target.value)}
                    placeholder={locale === 'en' ? 'All cities' : 'Todas las ciudades'}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    🏷️ {locale === 'en' ? 'Target Category' : 'Categoría Objetivo'}
                  </label>
                  <input
                    type="text"
                    value={editTargetCategory}
                    onChange={(e) => setEditTargetCategory(e.target.value)}
                    placeholder={locale === 'en' ? 'General' : 'General'}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    🔘 {locale === 'en' ? 'Action Button Label' : 'Texto Botón de Acción'}
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    value={editCtaLabel}
                    onChange={(e) => setEditCtaLabel(e.target.value)}
                    placeholder="Contactar"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Pie con botones Guardar Cambios y Cerrar */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  {locale === 'en' ? 'Close' : 'Cerrar'}
                </button>

                <button
                  type="submit"
                  disabled={savingEditOrder || uploadingEditImage}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-black text-white shadow-sm hover:bg-purple-500 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <span>{savingEditOrder ? '⏳' : '💾'}</span>
                  <span>
                    {savingEditOrder
                      ? locale === 'en'
                        ? 'Saving Changes...'
                        : 'Guardando cambios...'
                      : locale === 'en'
                        ? 'Save Campaign Changes'
                        : 'Guardar Cambios de la Campaña'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
