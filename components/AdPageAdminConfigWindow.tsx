'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type {
  ListingWithRelations,
  AdOrderWithRelations,
  SellerProfileWithUser,
  AdAccountWithUser,
} from '@/lib/types'
import {
  type AdPageConfig,
  type CustomAdminSetting,
  type AdPagePerformancePreset,
  type DynamicRunwayConfig,
  type DynamicRunwayReason,
  DEFAULT_AD_PAGE_CONFIG,
  AD_PAGE_PRESETS,
  AD_PAGE_CONFIG_STORAGE_KEY,
  sanitizeAdPageConfig,
  encodeAdPageConfigToSlot,
  calculateVisualizationPerformance,
} from '@/lib/adPageConfig'

const formatPrice = (amount: number) =>
  `$${Number(amount || 0).toLocaleString('es-CO')} COP`

interface AdPageAdminConfigWindowProps {
  initialConfig: AdPageConfig
  listings: ListingWithRelations[]
  adOrders: AdOrderWithRelations[]
  sellers?: SellerProfileWithUser[]
  adAccounts?: AdAccountWithUser[]
  locale: string
  onNotify?: (text: string, type?: 'success' | 'error') => void
}

export default function AdPageAdminConfigWindow({
  initialConfig,
  listings,
  adOrders,
  sellers = [],
  adAccounts = [],
  locale,
  onNotify,
}: AdPageAdminConfigWindowProps) {
  const supabase = createClient()
  const [config, setConfig] = useState<AdPageConfig>(() => sanitizeAdPageConfig(initialConfig))
  const [activeSubTab, setActiveSubTab] = useState<
    'capacity' | 'runways' | 'sections' | 'behavior' | 'extensible'
  >('capacity')
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Estado para agregar nuevas configuraciones extensibles en el futuro
  const [newSettingKey, setNewSettingKey] = useState('')
  const [newSettingLabel, setNewSettingLabel] = useState('')
  const [newSettingType, setNewSettingType] = useState<'boolean' | 'number' | 'text'>('boolean')
  const [newSettingValue, setNewSettingValue] = useState<string>('true')
  const [newSettingDesc, setNewSettingDesc] = useState('')

  // Estado para adicionar nuevas pasarelas en la página de publicidad (con su catálogo exclusivo)
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
  const [expandedRunwaySellersId, setExpandedRunwaySellersId] = useState<string | null>(null)
  const [assignListingSelection, setAssignListingSelection] = useState<Record<string, string>>({})

  // Sincronizar con configuración guardada en localStorage si es más reciente
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(AD_PAGE_CONFIG_STORAGE_KEY)
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw)
        setConfig(sanitizeAdPageConfig(parsed))
      }
    } catch {
      // Ignorar errores de lectura local
    }
    const handleCfgEvent = (e: any) => {
      if (e?.detail) {
        setConfig(sanitizeAdPageConfig(e.detail))
      }
    }
    window.addEventListener('ad-page-config-updated', handleCfgEvent)
    return () => window.removeEventListener('ad-page-config-updated', handleCfgEvent)
  }, [])

  // Estadísticas reales del inventario publicado actualmente
  const inventoryStats = useMemo(() => {
    const published = listings.filter((l) => l.status === 'published')
    const servicesCount = published.filter((l) => l.type === 'service').length
    const articlesCount = published.filter((l) => l.type === 'article').length
    const productsCount = published.filter((l) => l.type === 'product').length
    const uniqueSellers = new Set(published.map((l) => l.seller_id)).size
    const liveAdsCount = adOrders.filter(
      (a) => a.status === 'live' || a.status === 'approved'
    ).length

    return {
      totalPublished: published.length,
      servicesCount,
      articlesCount,
      productsCount,
      uniqueSellers,
      liveAdsCount,
    }
  }, [listings, adOrders])

  const perfMetrics = useMemo(() => calculateVisualizationPerformance(config), [config])

  const updateField = <K extends keyof AdPageConfig>(key: K, value: AdPageConfig[K]) => {
    setConfig((prev) => {
      const next = sanitizeAdPageConfig({
        ...prev,
        [key]: value,
        performancePreset: key === 'performancePreset' ? (value as any) : 'custom',
        updatedAt: new Date().toISOString(),
      })
      return next
    })
    setHasUnsavedChanges(true)
  }

  const handleApplyPreset = (presetKey: Exclude<AdPagePerformancePreset, 'custom'>) => {
    const preset = AD_PAGE_PRESETS[presetKey]
    if (!preset) return
    const next = sanitizeAdPageConfig({
      ...config,
      ...preset.values,
      performancePreset: presetKey,
      updatedAt: new Date().toISOString(),
    })
    setConfig(next)
    setHasUnsavedChanges(true)
    if (onNotify) {
      onNotify(
        locale === 'en'
          ? `Applied preset: ${preset.nameEn}. Click "Save Configuration" to persist.`
          : `Perfil aplicado: ${preset.nameEs}. Haz clic en "Guardar Configuración" para aplicar.`
      )
    }
  }

  const handleSaveConfig = async () => {
    setIsSaving(true)
    try {
      const cleanConfig = sanitizeAdPageConfig({
        ...config,
        updatedAt: new Date().toISOString(),
      })

      // 1. Guardar en localStorage y emitir evento reactivo inmediato para el navegador
      if (typeof window !== 'undefined') {
        localStorage.setItem(AD_PAGE_CONFIG_STORAGE_KEY, JSON.stringify(cleanConfig))
        window.dispatchEvent(
          new CustomEvent('ad-page-config-updated', { detail: cleanConfig })
        )
      }

      // 2. Persistir en Supabase usando la tabla oficial public.ad_slot (con RLS admin activo)
      const encodedSlot = encodeAdPageConfigToSlot(cleanConfig)
      const { error: slotErr } = await supabase.from('ad_slot').upsert(
        [
          encodedSlot,
          {
            id: 'home.carousel',
            surface: 'hero',
            formats: ['hero', 'banner'],
            max_ads: cleanConfig.maxHeroItems,
          },
          {
            id: 'search.top',
            surface: 'runway',
            formats: ['card', 'runway'],
            max_ads: cleanConfig.maxProductsItems,
          },
          {
            id: 'category.banner',
            surface: 'combo',
            formats: ['hero', 'runway', 'combo'],
            max_ads: cleanConfig.maxServicesItems,
          },
          {
            id: 'free.initial',
            surface: 'free_trial',
            formats: ['runway', 'hero'],
            max_ads: cleanConfig.maxTotalListingsFetched,
          },
        ],
        { onConflict: 'id' }
      )

      if (slotErr) {
        console.warn('Aviso al sincronizar ad_slot en BD:', slotErr.message)
      }

      setConfig(cleanConfig)
      setHasUnsavedChanges(false)
      if (onNotify) {
        onNotify(
          locale === 'en'
            ? 'Advertising page configuration saved and applied successfully!'
            : '¡Configuración de la página de publicidad guardada y aplicada exitosamente!'
        )
      }
    } catch (err: any) {
      if (onNotify) {
        onNotify(
          err?.message || 'Error al guardar la configuración de la página de publicidad',
          'error'
        )
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetDefaults = () => {
    const defaults = sanitizeAdPageConfig(DEFAULT_AD_PAGE_CONFIG)
    setConfig(defaults)
    setHasUnsavedChanges(true)
    if (onNotify) {
      onNotify(
        locale === 'en'
          ? 'Restored default values. Click "Save Configuration" to confirm.'
          : 'Valores predeterminados restaurados. Pulsa "Guardar Configuración" para confirmar.'
      )
    }
  }

  const handleUpdateCustomSetting = (index: number, newValue: string | number | boolean) => {
    const updated = [...config.customSettings]
    updated[index] = {
      ...updated[index],
      value: newValue,
    }
    updateField('customSettings', updated)
  }

  const handleDeleteCustomSetting = (key: string) => {
    const updated = config.customSettings.filter((s) => s.key !== key)
    updateField('customSettings', updated)
  }

  const handleAddCustomSetting = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanKey = newSettingKey
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
    const cleanLabel = newSettingLabel.trim()
    if (!cleanKey || !cleanLabel) return

    let parsedValue: string | number | boolean = newSettingValue
    if (newSettingType === 'boolean') {
      parsedValue = newSettingValue === 'true'
    } else if (newSettingType === 'number') {
      parsedValue = Number(newSettingValue) || 0
    }

    const newEntry: CustomAdminSetting = {
      key: cleanKey,
      label: cleanLabel,
      type: newSettingType,
      value: parsedValue,
      description: newSettingDesc.trim() || 'Parámetro administrativo personalizado',
    }

    const existingIdx = config.customSettings.findIndex((s) => s.key === cleanKey)
    const nextList = [...config.customSettings]
    if (existingIdx >= 0) {
      nextList[existingIdx] = newEntry
    } else {
      nextList.push(newEntry)
    }

    updateField('customSettings', nextList)
    setNewSettingKey('')
    setNewSettingLabel('')
    setNewSettingDesc('')
    if (onNotify) {
      onNotify(`Parámetro "${cleanLabel}" agregado al módulo de configuración.`)
    }
  }

  const handleAddCustomRunway = (e: React.FormEvent) => {
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
          ? 'Pasarela especial de temporada con ofertas y servicios destacados'
          : 'Pasarela habilitada por expansión de mercado y nuevos rubros'),
      badge:
        newRunwayBadge.trim() ||
        (newRunwayReason === 'season' ? '🎄 Temporada' : '🚀 Expansión de Mercado'),
      icon: newRunwayIcon.trim() || '🔥',
      reason: newRunwayReason,
      filterType: newRunwayFilterType,
      filterKeyword: newRunwayKeyword.trim(),
      maxItems: Math.max(1, Math.min(50, Number(newRunwayMaxItems) || 12)),
      defaultDurationDays: Math.max(1, Math.min(90, Number(newRunwayDurationDays) || 7)),
      scrollSpeed: config.runwayScrollSpeed || 0.65,
      active: true,
      accentColor: newRunwayReason === 'season' ? 'rose' : 'emerald',
      assignedListingIds: [],
      hasExclusiveCatalog: newRunwayHasExclusiveCatalog,
      campaignCostCop: Math.max(0, Number(newRunwayCampaignCostCop) || 15000),
      authorizedSellerIds: [],
      allowAllPaidSellers: true,
      createdAt: new Date().toISOString(),
      endsAt: new Date(
        Date.now() + (Number(newRunwayDurationDays) || 7) * 24 * 60 * 60 * 1000
      ).toISOString(),
    }

    updateField('customRunways', [...(config.customRunways || []), newRunway])
    setNewRunwayTitle('')
    setNewRunwaySubtitle('')
    setNewRunwayKeyword('')
    if (onNotify) {
      onNotify(
        `Pasarela "${cleanTitle}" y su catálogo exclusivo creados. Pulsa "Guardar Configuración" para aplicar.`
      )
    }
  }

  const handleUpdateCustomRunway = (
    runwayId: string,
    patch: Partial<DynamicRunwayConfig>
  ) => {
    const nextList = (config.customRunways || []).map((r) =>
      r.id === runwayId ? { ...r, ...patch } : r
    )
    updateField('customRunways', nextList)
  }

  const handleDeleteCustomRunway = (runwayId: string) => {
    const nextList = (config.customRunways || []).filter((r) => r.id !== runwayId)
    updateField('customRunways', nextList)
  }

  const handleToggleRunwaySeller = (runwayId: string, sellerUserId: string) => {
    const runway = (config.customRunways || []).find((r) => r.id === runwayId)
    if (!runway) return
    const current = Array.isArray(runway.authorizedSellerIds) ? runway.authorizedSellerIds : []
    const nextIds = current.includes(sellerUserId)
      ? current.filter((id) => id !== sellerUserId)
      : [...current, sellerUserId]
    handleUpdateCustomRunway(runwayId, { authorizedSellerIds: nextIds })
  }

  const handleAssignListingToRunway = async (runwayId: string, listingId: string) => {
    if (!listingId) return
    const runway = (config.customRunways || []).find((r) => r.id === runwayId)
    if (!runway) return
    const current = Array.isArray(runway.assignedListingIds) ? runway.assignedListingIds : []
    if (!current.includes(listingId)) {
      handleUpdateCustomRunway(runwayId, {
        assignedListingIds: [...current, listingId],
      })
    }
    const targetListing = listings.find((l) => l.id === listingId)
    if (targetListing) {
      const nextAttrs = {
        ...((targetListing.attrs as Record<string, any>) || {}),
        special_runway_id: runway.id,
        special_runway_title: runway.title,
      }
      await supabase.from('listing').update({ attrs: nextAttrs }).eq('id', listingId)
    }
    setAssignListingSelection((prev) => ({ ...prev, [runwayId]: '' }))
    if (onNotify) {
      onNotify(
        `Artículo clasificado en la pasarela "${runway.title}" y su Catálogo Exclusivo. Recuerda pulsar "Guardar Configuración".`
      )
    }
  }

  const handleRemoveListingFromRunway = async (runwayId: string, listingId: string) => {
    const runway = (config.customRunways || []).find((r) => r.id === runwayId)
    if (!runway) return
    const current = Array.isArray(runway.assignedListingIds) ? runway.assignedListingIds : []
    handleUpdateCustomRunway(runwayId, {
      assignedListingIds: current.filter((id) => id !== listingId),
    })
    const targetListing = listings.find((l) => l.id === listingId)
    if (
      targetListing &&
      (targetListing.attrs as Record<string, any>)?.special_runway_id === runwayId
    ) {
      const nextAttrs = { ...((targetListing.attrs as Record<string, any>) || {}) }
      delete nextAttrs.special_runway_id
      delete nextAttrs.special_runway_title
      await supabase.from('listing').update({ attrs: nextAttrs }).eq('id', listingId)
    }
  }

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* 1. BARRA SUPERIOR DE ESTADO DE RENDIMIENTO Y ACCIONES GUARDAR         */}
      {/* ===================================================================== */}
      <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/70 p-5 shadow-xs dark:border-purple-900/60 dark:from-purple-950/40 dark:via-zinc-900 dark:to-zinc-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-purple-200/60 dark:border-purple-900/50">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-purple-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                Centro de Control de Vitrina
              </span>
              {hasUnsavedChanges && (
                <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300 animate-pulse">
                  ● Cambios pendientes por guardar
                </span>
              )}
            </div>
            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
              Administración de Capacidad, Velocidad y Visualización de la Página de Publicidad
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl">
              Ajusta cuántas publicaciones se muestran simultáneamente en cada pasarela de la portada publicitaria (<strong>/</strong>) para garantizar una visualización rápida, controlar el orden de secciones y añadir futuras configuraciones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/"
              className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-colors"
            >
              👁️ Ver Página de Publicidad ↗
            </Link>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              ↺ Restaurar por Defecto
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveConfig}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span>💾</span>
              <span>{isSaving ? 'Guardando cambios...' : 'Guardar Configuración'}</span>
            </button>
          </div>
        </div>

        {/* Resumen de Impacto en Velocidad y Capacidad Total */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* KPI 1: Índice de Velocidad de Visualización */}
          <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
                Índice de Rapidez Visual
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  perfMetrics.level === 'ultra_fast'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : perfMetrics.level === 'balanced'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {perfMetrics.estimatedSpeedScore}/100 pts
              </span>
            </div>
            <div className="mt-1.5 text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
              {locale === 'en' ? perfMetrics.labelEn : perfMetrics.labelEs}
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  perfMetrics.level === 'ultra_fast'
                    ? 'bg-emerald-500'
                    : perfMetrics.level === 'balanced'
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${perfMetrics.estimatedSpeedScore}%` }}
              />
            </div>
          </div>

          {/* KPI 2: Cupo Total Configurado en Vitrina */}
          <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
                Cupo Total en Pasarelas
              </span>
              <span className="text-sm">📊</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-purple-700 dark:text-purple-400">
                {perfMetrics.totalMaxCardsRendered}
              </span>
              <span className="text-xs text-zinc-500">tarjetas máx. simultáneas</span>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Límite consulta BD: <strong>{config.maxTotalListingsFetched} anuncios</strong> · Máx{' '}
              <strong>{config.maxPhotosPerItem} fotos/anuncio</strong>
            </p>
          </div>

          {/* KPI 3: Publicaciones Activas Disponibles Hoy */}
          <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
                Inventario Activo en BD
              </span>
              <span className="text-sm">📦</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                {inventoryStats.totalPublished}
              </span>
              <span className="text-xs text-zinc-500">publicados ({inventoryStats.liveAdsCount} campañas)</span>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              🛠️ {inventoryStats.servicesCount} Serv. · 📦 {inventoryStats.articlesCount} Usados · 🛍️{' '}
              {inventoryStats.productsCount} Nuevos
            </p>
          </div>

          {/* KPI 4: Secciones Visibles */}
          <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
                Bloques Activos en Portada
              </span>
              <span className="text-sm">🧩</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {
                  [
                    config.showHeroRunway,
                    config.showServicesRunway,
                    config.showArticlesRunway,
                    config.showProductsRunway,
                    config.showMerchantsRunway,
                    config.showCatalogQuickCards,
                    config.showPromotionalBanner,
                  ].filter(Boolean).length
                }{' '}
                / 7
              </span>
              <span className="text-xs text-zinc-500">secciones habilitadas</span>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Rotación Hero: <strong>{config.heroRotationSeconds}s</strong> · Scroll GPU:{' '}
              <strong>{config.runwayScrollSpeed}x</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. PERFILES PRECONFIGURADOS DE VELOCIDAD Y CANTIDAD (1 CLIC)          */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['fast', 'balanced', 'extended'] as const).map((presetKey) => {
          const preset = AD_PAGE_PRESETS[presetKey]
          const isSelected = config.performancePreset === presetKey
          return (
            <button
              key={presetKey}
              type="button"
              onClick={() => handleApplyPreset(presetKey)}
              className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                isSelected
                  ? 'border-2 border-purple-600 bg-purple-50/70 shadow-sm dark:border-purple-500 dark:bg-purple-950/40'
                  : 'border-zinc-200 bg-white hover:border-purple-300 dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50">
                  {locale === 'en' ? preset.nameEn : preset.nameEs}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isSelected
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {locale === 'en' ? preset.badgeEn : preset.badgeEs}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {locale === 'en' ? preset.descEn : preset.descEs}
              </p>
              <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-2 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                <span>🏆 Vitrina: {preset.values.maxHeroItems}</span>
                <span>•</span>
                <span>🛠️ Serv: {preset.values.maxServicesItems}</span>
                <span>•</span>
                <span>📦 Usados: {preset.values.maxArticlesItems}</span>
                <span>•</span>
                <span>🛍️ Nuevos: {preset.values.maxProductsItems}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* ===================================================================== */}
      {/* 3. SUB-PESTAÑAS DE LA VENTANA ADMINISTRATIVA DE PUBLICIDAD            */}
      {/* ===================================================================== */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        {[
          {
            id: 'capacity',
            icon: '🔢',
            label: '1. Cupos por Pasarela y Nuevos Catálogos',
            badge: `${perfMetrics.totalMaxCardsRendered} máx`,
          },
          {
            id: 'runways',
            icon: '🏪',
            label: '2. Nuevas Pasarelas y Catálogos Exclusivos',
            badge: `${(config.customRunways || []).length} pasarelas`,
          },
          {
            id: 'sections',
            icon: '👁️',
            label: '3. Visibilidad de Secciones y Avisos',
            badge: '7 bloques',
          },
          {
            id: 'behavior',
            icon: '⚡',
            label: '4. Velocidad de Rotación y Prioridad',
            badge: `${config.heroRotationSeconds}s / ${config.runwayScrollSpeed}x`,
          },
          {
            id: 'extensible',
            icon: '🧩',
            label: '5. Más Configuraciones (Extensible)',
            badge: `${config.customSettings.length} reglas`,
          },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          )
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: CONTROL DE CANTIDAD DE PUBLICACIONES POR PASARELA              */}
      {/* ===================================================================== */}
      {activeSubTab === 'capacity' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              {
                key: 'maxHeroItems' as const,
                icon: '🏆',
                title: '1. Gran Vitrina Principal (Hero Runway)',
                subtitle:
                  'Publicaciones estelares que rotan en el recuadro superior de tamaño estático fijo.',
                min: 1,
                max: 15,
                recommended: 5,
                currentValue: config.maxHeroItems,
                availableInDb: inventoryStats.totalPublished,
                enabled: config.showHeroRunway,
                toggleKey: 'showHeroRunway' as const,
                accentColor: 'purple',
              },
              {
                key: 'maxServicesItems' as const,
                icon: '🛠️',
                title: '2. Pasarela de Servicios y Soluciones',
                subtitle:
                  'Cantidad máxima de servicios profesionales mostrados en el carrusel continuo.',
                min: 1,
                max: 40,
                recommended: 10,
                currentValue: config.maxServicesItems,
                availableInDb: inventoryStats.servicesCount,
                enabled: config.showServicesRunway,
                toggleKey: 'showServicesRunway' as const,
                accentColor: 'purple',
              },
              {
                key: 'maxArticlesItems' as const,
                icon: '📦',
                title: '3. Pasarela de Artículos Usados (Segunda Mano)',
                subtitle:
                  'Cantidad máxima de artículos usados y oportunidades en su carrusel dedicado.',
                min: 1,
                max: 50,
                recommended: 20,
                currentValue: config.maxArticlesItems,
                availableInDb: inventoryStats.articlesCount,
                enabled: config.showArticlesRunway,
                toggleKey: 'showArticlesRunway' as const,
                accentColor: 'amber',
              },
              {
                key: 'maxProductsItems' as const,
                icon: '🛍️',
                title: '4. Pasarela de Productos Nuevos',
                subtitle:
                  'Cantidad máxima de productos nuevos a estrenar en el carrusel de productos.',
                min: 1,
                max: 50,
                recommended: 20,
                currentValue: config.maxProductsItems,
                availableInDb: inventoryStats.productsCount,
                enabled: config.showProductsRunway,
                toggleKey: 'showProductsRunway' as const,
                accentColor: 'blue',
              },
              {
                key: 'maxMerchantsItems' as const,
                icon: '🏪',
                title: '5. Pasarela de Proveedores / Marcas y Comercios (Incluida en el Pago)',
                subtitle:
                  'Cantidad máxima de proveedores destacados en su pasarela independiente (incluida al pagar cualquier plan).',
                min: 1,
                max: 30,
                recommended: 10,
                currentValue: config.maxMerchantsItems,
                availableInDb: inventoryStats.uniqueSellers,
                enabled: config.showMerchantsRunway,
                toggleKey: 'showMerchantsRunway' as const,
                accentColor: 'indigo',
              },
            ].map((slot) => (
              <div
                key={slot.key}
                className={`rounded-2xl border p-5 transition-all ${
                  slot.enabled
                    ? 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs'
                    : 'border-dashed border-zinc-200 bg-zinc-50/70 opacity-75 dark:border-zinc-800 dark:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl dark:bg-zinc-800">
                      {slot.icon}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                        {slot.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {slot.subtitle}
                      </p>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={slot.enabled}
                      onChange={(e) => updateField(slot.toggleKey, e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      {slot.enabled ? 'Activa' : 'Oculta'}
                    </span>
                  </label>
                </div>

                {/* Controles numéricos y deslizador */}
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-zinc-500">
                        Cantidad máxima permitida:
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                          {slot.currentValue}
                        </span>
                        <span className="text-xs font-semibold text-zinc-500">
                          publicaciones (Disponibles hoy: {slot.availableInDb})
                        </span>
                      </div>
                    </div>

                    {/* Botones rápidos -5, -1, +1, +5 */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateField(slot.key, Math.max(slot.min, slot.currentValue - 5))
                        }
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateField(slot.key, Math.max(slot.min, slot.currentValue - 1))
                        }
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min={slot.min}
                        max={slot.max}
                        value={slot.currentValue}
                        onChange={(e) =>
                          updateField(
                            slot.key,
                            Math.min(slot.max, Math.max(slot.min, Number(e.target.value) || slot.min))
                          )
                        }
                        className="w-16 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-center text-xs font-extrabold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateField(slot.key, Math.min(slot.max, slot.currentValue + 1))
                        }
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateField(slot.key, Math.min(slot.max, slot.currentValue + 5))
                        }
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={slot.min}
                    max={slot.max}
                    value={slot.currentValue}
                    onChange={(e) => updateField(slot.key, Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />

                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Mínimo: {slot.min}</span>
                    <button
                      type="button"
                      onClick={() => updateField(slot.key, slot.recommended)}
                      className="text-purple-600 hover:underline font-semibold dark:text-purple-400 cursor-pointer"
                    >
                      Recomendado: {slot.recommended}
                    </button>
                    <span>Máximo: {slot.max}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Tarjeta 6: Límites Globales de Consulta de Base de Datos y Fotos por Tarjeta */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xl dark:bg-emerald-900/60">
                    🚀
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      6. Optimización de Consulta BD y Galería por Publicación
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      Controla el volumen máximo de registros descargados desde el servidor y las fotos procesadas por anuncio para acelerar la carga inicial.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-emerald-200/60 dark:border-emerald-900/40 space-y-4">
                  {/* Límite de consulta en servidor */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-zinc-700 dark:text-zinc-200">
                        Máximo de Publicaciones Consultadas en Servidor (BD):
                      </span>
                      <span className="font-black text-emerald-700 dark:text-emerald-300">
                        {config.maxTotalListingsFetched} registros
                      </span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={200}
                      step={5}
                      value={config.maxTotalListingsFetched}
                      onChange={(e) =>
                        updateField('maxTotalListingsFetched', Number(e.target.value))
                      }
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>15 (Carga ultraligera)</span>
                      <span>60 (Balanceado)</span>
                      <span>200 (Catálogo completo)</span>
                    </div>
                  </div>

                  {/* Máximo de fotos por publicación */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-zinc-700 dark:text-zinc-200">
                        Máximo de Fotos Cargadas por Publicación en Vitrina:
                      </span>
                      <span className="font-black text-emerald-700 dark:text-emerald-300">
                        {config.maxPhotosPerItem} fotos / anuncio
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={config.maxPhotosPerItem}
                      onChange={(e) => updateField('maxPhotosPerItem', Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>1 foto (Más rápido)</span>
                      <span>5 fotos (Estándar)</span>
                      <span>10 fotos (Galería extendida)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECCIÓN 7 / TAB PASARELAS: ADICIONAR Y ADMINISTRAR NUEVAS PASARELAS   */}
      {/* EN LA PÁGINA DE PUBLICIDAD Y SUS CATÁLOGOS EXCLUSIVOS                 */}
      {/* ===================================================================== */}
      {(activeSubTab === 'capacity' || activeSubTab === 'runways') && (
        <div className="rounded-2xl border-2 border-purple-200 bg-white p-6 shadow-xs dark:border-purple-900/60 dark:bg-zinc-900 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  ➕ Pasarelas de la Página de Publicidad + Catálogos Exclusivos
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  💰 Control de Costo de Campaña y Vendedores Habilitados
                </span>
              </div>
              <h3 className="mt-1.5 text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                Adicionar y Administrar Pasarelas en la Página de Publicidad y Nuevos Catálogos Exclusivos
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Crea nuevas pasarelas en la Página de Publicidad (por temporada o expansión de mercado). Cada nueva pasarela habilita su propio <strong>Catálogo Exclusivo</strong>, su <strong>lista de clasificación</strong> para artículos y campañas, su <strong>costo adicional de campaña ($ COP)</strong> y la <strong>habilitación de vendedores según el pago realizado</strong>.
              </p>
            </div>
          </div>

          {/* Lista de Pasarelas Adicionales Existentes en la Página de Publicidad */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(config.customRunways || []).map((customR) => {
              const assignedIds = Array.isArray(customR.assignedListingIds)
                ? customR.assignedListingIds
                : []
              const classifiedListings = listings.filter(
                (l) =>
                  assignedIds.includes(l.id) ||
                  (l.attrs as Record<string, any>)?.special_runway_id === customR.id
              )
              const availableListingsToAssign = listings.filter(
                (l) =>
                  l.status === 'published' &&
                  !classifiedListings.some((cl) => cl.id === l.id)
              )

              return (
                <div
                  key={customR.id}
                  className={`rounded-2xl border p-4 transition-all space-y-3.5 ${
                    customR.active
                      ? 'border-emerald-300 bg-emerald-50/30 dark:border-emerald-800/70 dark:bg-emerald-950/20'
                      : 'border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-2xs dark:bg-zinc-800">
                        {customR.icon}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                            {customR.title}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                              customR.reason === 'season'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {customR.reason === 'season'
                              ? '🎄 Por Temporada'
                              : customR.reason === 'market_expansion'
                              ? '🚀 Expansión de Mercado'
                              : '⭐ Especial'}
                          </span>
                          {customR.hasExclusiveCatalog !== false && (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-black uppercase text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                              ✨ Catálogo Exclusivo
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-zinc-500">{customR.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customR.active}
                          onChange={(e) =>
                            handleUpdateCustomRunway(customR.id, { active: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
                        />
                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                          {customR.active ? 'Activa en Publicidad' : 'Oculta'}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomRunway(customR.id)}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-red-100 hover:text-red-600 cursor-pointer"
                        title="Eliminar pasarela"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Controles de Cupo, Vigencia y Costo Adicional de Campaña ($ COP) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-200/70 dark:border-zinc-800 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 block">
                        Cupo Máx. en Pasarela:
                      </span>
                      <div className="mt-1 flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={customR.maxItems}
                          onChange={(e) =>
                            handleUpdateCustomRunway(customR.id, {
                              maxItems: Math.max(1, Math.min(50, Number(e.target.value) || 12)),
                            })
                          }
                          className="w-16 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs font-extrabold dark:border-zinc-700 dark:bg-zinc-800"
                        />
                        <span className="text-[11px] text-zinc-500">artículos</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 block">
                        Vigencia Independiente:
                      </span>
                      <div className="mt-1 flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={customR.defaultDurationDays}
                          onChange={(e) =>
                            handleUpdateCustomRunway(customR.id, {
                              defaultDurationDays: Math.max(
                                1,
                                Math.min(90, Number(e.target.value) || 7)
                              ),
                            })
                          }
                          className="w-16 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs font-extrabold dark:border-zinc-700 dark:bg-zinc-800"
                        />
                        <span className="text-[11px] text-zinc-500">días</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 block">
                        Costo Campaña Catálogo ($ COP):
                      </span>
                      <div className="mt-1 flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={customR.campaignCostCop ?? 15000}
                          onChange={(e) =>
                            handleUpdateCustomRunway(customR.id, {
                              campaignCostCop: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-24 rounded-lg border border-purple-300 bg-white px-2 py-1 text-xs font-extrabold text-purple-900 dark:border-purple-700 dark:bg-zinc-800 dark:text-purple-200"
                        />
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
                          COP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Catálogo Exclusivo y Habilitación de Vendedores según Pago */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200/70 dark:border-zinc-800 text-[11px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-purple-800 dark:text-purple-300">
                        <input
                          type="checkbox"
                          checked={customR.hasExclusiveCatalog !== false}
                          onChange={(e) =>
                            handleUpdateCustomRunway(customR.id, {
                              hasExclusiveCatalog: e.target.checked,
                            })
                          }
                          className="h-3.5 w-3.5 rounded border-purple-300 text-purple-600"
                        />
                        <span>Habilitar Catálogo Exclusivo</span>
                      </label>
                      {customR.hasExclusiveCatalog !== false && (
                        <Link
                          href={`/catalogo?runway=${encodeURIComponent(customR.id)}`}
                          className="rounded-lg bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-800 hover:bg-purple-200 dark:bg-purple-950/70 dark:text-purple-300"
                        >
                          👁️ Ver Catálogo Exclusivo ↗
                        </Link>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedRunwaySellersId(
                          expandedRunwaySellersId === customR.id ? null : customR.id
                        )
                      }
                      className="rounded-lg border border-purple-300 bg-white px-2.5 py-1 text-[10px] font-extrabold text-purple-800 hover:bg-purple-50 dark:border-purple-800 dark:bg-zinc-800 dark:text-purple-200 cursor-pointer"
                    >
                      👥 Vendedores Habilitados ({(customR.authorizedSellerIds || []).length})
                      {customR.allowAllPaidSellers !== false ? ' + Pagos Activos' : ''}
                    </button>
                  </div>

                  {/* Panel Desplegable: Vendedores Habilitados según Pago Realizado */}
                  {expandedRunwaySellersId === customR.id && (
                    <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 dark:border-purple-900/50 dark:bg-purple-950/20 space-y-2.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-extrabold text-purple-900 dark:text-purple-200">
                          🔐 Habilitación de Vendedores para esta Pasarela y Catálogo Exclusivo
                        </span>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                          <input
                            type="checkbox"
                            checked={customR.allowAllPaidSellers !== false}
                            onChange={(e) =>
                              handleUpdateCustomRunway(customR.id, {
                                allowAllPaidSellers: e.target.checked,
                              })
                            }
                            className="h-3.5 w-3.5 rounded border-emerald-400 text-emerald-600"
                          />
                          <span>Auto-habilitar vendedores con pago/saldo activo</span>
                        </label>
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        Selecciona los vendedores que clasifican para usar esta lista en la creación/edición de artículos y campañas según el pago de campaña ({formatPrice(customR.campaignCostCop ?? 15000)}).
                      </p>
                      <div className="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {sellers.map((s) => {
                          const isChecked = (customR.authorizedSellerIds || []).includes(
                            s.user_id
                          )
                          const acc = adAccounts.find((a) => a.user_id === s.user_id)
                          const hasBalanceOrPaid =
                            (acc && Number(acc.balance_cents) > 0) ||
                            adOrders.some(
                              (o) =>
                                o.seller_id === s.user_id &&
                                (o.payment_status === 'paid' ||
                                  o.status === 'live' ||
                                  o.status === 'approved')
                            )
                          return (
                            <label
                              key={s.user_id}
                              className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] cursor-pointer ${
                                isChecked
                                  ? 'border-purple-400 bg-purple-100/70 font-bold text-purple-950 dark:border-purple-700 dark:bg-purple-900/40 dark:text-purple-100'
                                  : 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() =>
                                    handleToggleRunwaySeller(customR.id, s.user_id)
                                  }
                                  className="h-3.5 w-3.5 rounded border-zinc-300 text-purple-600"
                                />
                                <span className="truncate">{s.business_name}</span>
                              </div>
                              {hasBalanceOrPaid && (
                                <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  💳 Pago/Saldo
                                </span>
                              )}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Clasificación Directa de Artículos en esta Pasarela / Catálogo Exclusivo */}
                  <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300">
                        🏷️ Artículos Clasificados en este Catálogo ({classifiedListings.length} / {customR.maxItems})
                      </span>
                    </div>

                    {classifiedListings.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {classifiedListings.map((item) => (
                          <span
                            key={item.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-white px-2 py-1 text-[11px] font-bold text-zinc-800 dark:border-purple-800/60 dark:bg-zinc-800 dark:text-zinc-200"
                          >
                            <span className="truncate max-w-[170px]">{item.title}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveListingFromRunway(customR.id, item.id)
                              }
                              className="text-zinc-400 hover:text-red-600 cursor-pointer"
                              title="Quitar de esta pasarela"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <select
                        value={assignListingSelection[customR.id] || ''}
                        onChange={(e) =>
                          setAssignListingSelection((prev) => ({
                            ...prev,
                            [customR.id]: e.target.value,
                          }))
                        }
                        className="flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        <option value="">
                          + Clasificar artículo publicado en &quot;{customR.title}&quot;...
                        </option>
                        {availableListingsToAssign.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.title} — {item.seller_profile?.business_name || 'Comercio'}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          handleAssignListingToRunway(
                            customR.id,
                            assignListingSelection[customR.id] || ''
                          )
                        }
                        disabled={!assignListingSelection[customR.id]}
                        className="rounded-lg bg-purple-600 px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-purple-500 disabled:opacity-40 cursor-pointer shrink-0"
                      >
                        Asignar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Formulario para Crear una Nueva Pasarela en la Página de Publicidad + Catálogo Exclusivo */}
          <form
            onSubmit={handleAddCustomRunway}
            className="rounded-2xl border border-dashed border-purple-300 bg-purple-50/40 p-4 dark:border-purple-800/60 dark:bg-purple-950/20 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-extrabold text-purple-900 dark:text-purple-200">
                ➕ Crear Nueva Pasarela en la Página de Publicidad y su Catálogo Exclusivo
              </div>
              <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                Habilita automáticamente la lista de clasificación en Artículos y Campañas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Título de la Nueva Pasarela / Catálogo Exclusivo *
                </label>
                <input
                  type="text"
                  required
                  value={newRunwayTitle}
                  onChange={(e) => setNewRunwayTitle(e.target.value)}
                  placeholder="Ej. Especial de Temporada Escolar / Expansión: Repuestos y Motos"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Motivo de Creación *
                </label>
                <select
                  value={newRunwayReason}
                  onChange={(e) => {
                    const val = e.target.value as DynamicRunwayReason
                    setNewRunwayReason(val)
                    setNewRunwayBadge(
                      val === 'season' ? '🎄 Temporada' : '🚀 Expansión de Mercado'
                    )
                    setNewRunwayIcon(val === 'season' ? '🎄' : '🚀')
                  }}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="season">📅 Por Temporada</option>
                  <option value="market_expansion">🚀 Por Expansión de Mercado</option>
                  <option value="special">⭐ Especial</option>
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
                    Días Vigencia
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

              <div className="sm:col-span-2">
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Subtítulo descriptivo
                </label>
                <input
                  type="text"
                  value={newRunwaySubtitle}
                  onChange={(e) => setNewRunwaySubtitle(e.target.value)}
                  placeholder="Breve descripción de lo que incluye esta pasarela y su catálogo exclusivo..."
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-bold text-purple-800 dark:text-purple-300 mb-1">
                  Costo de Campaña Nuevo Catálogo ($ COP) *
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={newRunwayCampaignCostCop}
                  onChange={(e) =>
                    setNewRunwayCampaignCostCop(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="w-full rounded-xl border border-purple-300 bg-white px-3 py-2 text-xs font-extrabold text-purple-900 dark:border-purple-700 dark:bg-zinc-800 dark:text-purple-100"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Filtro Base de Rubro
                </label>
                <select
                  value={newRunwayFilterType}
                  onChange={(e) => setNewRunwayFilterType(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="all">Todas las asignadas + clasificadas</option>
                  <option value="service">Servicios Profesionales</option>
                  <option value="article">Artículos Usados</option>
                  <option value="product">Productos Nuevos</option>
                  <option value="keyword">Por Palabra Clave</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex items-center">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-900 dark:text-purple-200">
                  <input
                    type="checkbox"
                    checked={newRunwayHasExclusiveCatalog}
                    onChange={(e) => setNewRunwayHasExclusiveCatalog(e.target.checked)}
                    className="h-4 w-4 rounded border-purple-300 text-purple-600"
                  />
                  <span>
                    ✨ Habilitar Catálogo Exclusivo propio para esta pasarela y agregarla a la lista de clasificación de vendedores habilitados
                  </span>
                </label>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  + Adicionar Pasarela y Catálogo
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: VISIBILIDAD DE SECCIONES Y AVISOS DE TEMPORADA                 */}
      {/* ===================================================================== */}
      {activeSubTab === 'sections' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Control de Secciones Visibles en la Página de Publicidad (Portada)
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Activa o desactiva bloques completos de la página de publicidad. Desactivar secciones secundarias permite una visualización aún más rápida y enfocada.
            </p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[
                {
                  key: 'showHeroRunway' as const,
                  icon: '🏆',
                  title: 'Gran Vitrina Principal (Hero Runway)',
                  desc: 'Recuadro superior estático con galería interactiva y ficha destacada.',
                },
                {
                  key: 'showServicesRunway' as const,
                  icon: '🛠️',
                  title: 'Pasarela de Servicios y Soluciones',
                  desc: 'Carrusel continuo de servicios profesionales, asesorías y oficios.',
                },
                {
                  key: 'showArticlesRunway' as const,
                  icon: '📦',
                  title: 'Pasarela de Artículos Usados',
                  desc: 'Carrusel continuo de artículos de segunda mano y oportunidades.',
                },
                {
                  key: 'showProductsRunway' as const,
                  icon: '🛍️',
                  title: 'Pasarela de Productos Nuevos',
                  desc: 'Carrusel continuo de productos nuevos de comercios locales.',
                },
                {
                  key: 'showMerchantsRunway' as const,
                  icon: '🏪',
                  title: 'Pasarela de Marcas y Comercios',
                  desc: 'Vitrina de vendedores verificados y negocios patrocinados.',
                },
                {
                  key: 'showCatalogQuickCards' as const,
                  icon: '🏷️',
                  title: 'Tarjetas de Acceso Rápido por Catálogo',
                  desc: 'Bloque de 3 tarjetas hacia Servicios, Artículos Usados y Productos Nuevos.',
                },
                {
                  key: 'showPromotionalBanner' as const,
                  icon: '🚀',
                  title: 'Banner Inferior para Anunciantes',
                  desc: 'Sección informativa invitando a los vendedores a impulsar sus campañas.',
                },
              ].map((sec) => {
                const isEnabled = config[sec.key]
                return (
                  <label
                    key={sec.key}
                    className={`flex items-start justify-between gap-4 rounded-xl border p-4 cursor-pointer transition-all ${
                      isEnabled
                        ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                        : 'border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{sec.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {sec.title}
                        </div>
                        <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                          {sec.desc}
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => updateField(sec.key, e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                )
              })}
            </div>
          </div>

          {/* Aviso o CintilloInformativo de Temporada en Página de Publicidad */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <span>📣</span>
                  <span>Cintillo Informativo / Aviso Especial en Página de Publicidad</span>
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Muestra un mensaje administrativo o anuncio de temporada en la parte superior de la página de publicidad.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.seasonalAnnouncementActive}
                  onChange={(e) => updateField('seasonalAnnouncementActive', e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {config.seasonalAnnouncementActive ? 'Aviso Activo' : 'Desactivado'}
                </span>
              </label>
            </div>

            <div>
              <input
                type="text"
                value={config.seasonalAnnouncementText}
                onChange={(e) => updateField('seasonalAnnouncementText', e.target.value)}
                placeholder="Ej. 🔥 Especial de Temporada: Todos los productos nuevos reciben 7 días de publicidad gratis inicial."
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: VELOCIDAD DE ROTACIÓN, ANIMACIÓN Y PRIORIZACIÓN                */}
      {/* ===================================================================== */}
      {activeSubTab === 'behavior' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Control de Rotación de Gran Vitrina y Pasarelas */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-5">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span>⏱️</span>
                <span>Tiempos de Rotación y Velocidad de Carruseles</span>
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Ajusta la cadencia con la que se desplazan las publicaciones en la Gran Vitrina y en las pasarelas continuas.
              </p>
            </div>

            {/* Rotación Gran Vitrina */}
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Rotación Automática en Gran Vitrina (Hero Runway)
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    El recuadro mantiene su altura fija invariable mientras desliza cada anuncio.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.heroAutoRotate}
                  onChange={(e) => updateField('heroAutoRotate', e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-purple-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Intervalo entre cada publicación:</span>
                  <span className="font-black text-purple-600 dark:text-purple-400">
                    {config.heroRotationSeconds} segundos
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={15}
                  value={config.heroRotationSeconds}
                  onChange={(e) => updateField('heroRotationSeconds', Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>2s (Rápido)</span>
                  <span>5s (Estándar)</span>
                  <span>15s (Lectura pausada)</span>
                </div>
              </div>
            </div>

            {/* Velocidad de Pasarelas Continuas */}
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Desplazamiento Continuo GPU en Pasarelas
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Movimiento horizontal fluido con pausa automática al pasar el cursor.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.runwayAutoScroll}
                  onChange={(e) => updateField('runwayAutoScroll', e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-purple-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Velocidad de desplazamiento continuo:</span>
                  <span className="font-black text-purple-600 dark:text-purple-400">
                    {config.runwayScrollSpeed} px/frame
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={1.5}
                  step={0.05}
                  value={config.runwayScrollSpeed}
                  onChange={(e) => updateField('runwayScrollSpeed', Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>0.20 (Suave)</span>
                  <span>0.65 (Recomendado)</span>
                  <span>1.50 (Dinámico)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reglas de Priorización y Criterios de Exhibición */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-5">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span>🎯</span>
                <span>Criterios de Selección y Prioridad de Publicaciones</span>
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Define qué tipo de publicaciones pueden ocupar los cupos configurados en la página de publicidad.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  id: 'all_with_priority' as const,
                  title: '1. Priorizar Campañas Pagadas + 7 Días Gratis + Respaldo Orgánico (Recomendado)',
                  desc: 'Muestra primero planes Combo ($25k), Gran Vitrina ($20k), Pasarela ($10k) y 7 días gratis; completa cupos con catálogo activo.',
                },
                {
                  id: 'only_campaigns_and_free_trial' as const,
                  title: '2. Solo Campañas Pagadas y Publicaciones en sus 7 Días Gratis Iniciales',
                  desc: 'Oculta publicaciones antiguas cuyo periodo gratuito de 7 días haya vencido y no tengan plan activo.',
                },
                {
                  id: 'only_paid_campaigns' as const,
                  title: '3. Modo Exclusivo: Únicamente Campañas Patrocinadas Pagadas',
                  desc: 'Muestra exclusivamente anuncios con orden publicitaria pagada activa (reduce al mínimo las publicaciones).',
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                    config.priorityMode === opt.id
                      ? 'border-purple-600 bg-purple-50/60 dark:border-purple-500 dark:bg-purple-950/30'
                      : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="priorityMode"
                    checked={config.priorityMode === opt.id}
                    onChange={() => updateField('priorityMode', opt.id)}
                    className="mt-1 h-4 w-4 text-purple-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {opt.title}
                    </div>
                    <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {opt.desc}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <label className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 cursor-pointer dark:border-zinc-800">
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  ✅ Priorizar Comercios Verificados en Desempates
                </div>
                <p className="text-[11px] text-zinc-500">
                  Otorga prelación visual a los vendedores con insignia verificada dentro del mismo nivel de plan.
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.prioritizeVerifiedSellers}
                onChange={(e) => updateField('prioritizeVerifiedSellers', e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-purple-600"
              />
            </label>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: ARQUITECTURA EXTENSIBLE PARA FUTURAS CONFIGURACIONES           */}
      {/* ===================================================================== */}
      {activeSubTab === 'extensible' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de parámetros modulares activos */}
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span>🧩</span>
                <span>Módulos y Reglas Administrativas Extensibles</span>
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Configuraciones modulares activas en la página de publicidad. Puedes ajustar sus valores o registrar nuevos parámetros a medida que crezca la plataforma.
              </p>
            </div>

            <div className="space-y-3">
              {config.customSettings.map((setting, idx) => (
                <div
                  key={setting.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {setting.label}
                      </span>
                      <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono text-purple-700 dark:bg-zinc-800 dark:text-purple-300">
                        {setting.key}
                      </code>
                    </div>
                    {setting.description && (
                      <p className="text-[11px] text-zinc-500">{setting.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {setting.type === 'boolean' ? (
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(setting.value)}
                          onChange={(e) => handleUpdateCustomSetting(idx, e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-300 text-purple-600"
                        />
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          {setting.value ? 'Activo' : 'Inactivo'}
                        </span>
                      </label>
                    ) : setting.type === 'number' ? (
                      <input
                        type="number"
                        value={Number(setting.value)}
                        onChange={(e) =>
                          handleUpdateCustomSetting(idx, Number(e.target.value) || 0)
                        }
                        className="w-24 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    ) : (
                      <input
                        type="text"
                        value={String(setting.value)}
                        onChange={(e) => handleUpdateCustomSetting(idx, e.target.value)}
                        className="w-44 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteCustomSetting(setting.key)}
                      title="Eliminar parámetro"
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario para agregar nuevas configuraciones en el futuro */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-5 dark:border-purple-900/50 dark:bg-purple-950/20 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span>➕</span>
                <span>Agregar Nueva Configuración</span>
              </h3>
              <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                ¿Necesitas controlar un nuevo parámetro o límite en el futuro? Agrégalo aquí y quedará almacenado en el perfil administrativo.
              </p>
            </div>

            <form onSubmit={handleAddCustomSetting} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre visible del ajuste *
                </label>
                <input
                  type="text"
                  required
                  value={newSettingLabel}
                  onChange={(e) => setNewSettingLabel(e.target.value)}
                  placeholder="Ej. Mostrar contador de visitas en tarjetas"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Clave técnica (ID) *
                </label>
                <input
                  type="text"
                  required
                  value={newSettingKey}
                  onChange={(e) => setNewSettingKey(e.target.value)}
                  placeholder="Ej. show_views_badge"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-mono text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tipo de dato
                  </label>
                  <select
                    value={newSettingType}
                    onChange={(e) => {
                      const t = e.target.value as 'boolean' | 'number' | 'text'
                      setNewSettingType(t)
                      setNewSettingValue(t === 'boolean' ? 'true' : t === 'number' ? '10' : '')
                    }}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="boolean">Interruptor (Sí/No)</option>
                    <option value="number">Cantidad Numérica</option>
                    <option value="text">Texto / Etiqueta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Valor inicial
                  </label>
                  {newSettingType === 'boolean' ? (
                    <select
                      value={newSettingValue}
                      onChange={(e) => setNewSettingValue(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="true">Activado (True)</option>
                      <option value="false">Desactivado (False)</option>
                    </select>
                  ) : (
                    <input
                      type={newSettingType === 'number' ? 'number' : 'text'}
                      value={newSettingValue}
                      onChange={(e) => setNewSettingValue(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Descripción u objetivo (Opcional)
                </label>
                <input
                  type="text"
                  value={newSettingDesc}
                  onChange={(e) => setNewSettingDesc(e.target.value)}
                  placeholder="Explica qué controla este parámetro..."
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition-colors cursor-pointer"
              >
                + Añadir a la Ventana Administrativa
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
