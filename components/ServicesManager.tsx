'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Category, ListingStatus, ListingWithRelations, Seller } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'
import { buildInitialFreeAdAttrs } from '@/lib/adPolicies'

interface ServicesManagerProps {
  initialListings: ListingWithRelations[]
  sellers: Seller[]
  categories?: Category[]
}

export default function ServicesManager({
  initialListings,
  sellers,
  categories = [],
}: ServicesManagerProps) {
  const { t, locale } = useTranslation()
  const supabase = createClient()

  // Selected seller filter (if user owns multiple)
  const [selectedSellerId, setSelectedSellerId] = useState<string>(
    sellers.length > 0 ? sellers[0].id : 'all'
  )

  // Services list state (filtrado exclusivamente a servicios)
  const [services, setServices] = useState<ListingWithRelations[]>(
    initialListings.filter((item) => item.type === 'service')
  )

  // Filtros específicos de Servicios
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'pending' | 'draft' | 'paused'>('all')
  const [modalityFilter, setModalityFilter] = useState<string>('all')
  const [rateFilter, setRateFilter] = useState<'all' | 'fixed' | 'quote'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Quick preview modal state
  const [previewItem, setPreviewItem] = useState<ListingWithRelations | null>(null)
  const [previewMediaIndex, setPreviewMediaIndex] = useState<number>(0)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  // Service Times & Modality Quick Edit Modal
  const [editingService, setEditingService] = useState<ListingWithRelations | null>(null)
  const [serviceDuration, setServiceDuration] = useState('45 min')
  const [serviceLeadTime, setServiceLeadTime] = useState('24 a 48 horas')
  const [serviceCapacity, setServiceCapacity] = useState('10')
  const [serviceModality, setServiceModality] = useState('Presencial')
  const [serviceNotes, setServiceNotes] = useState('')
  const [savingService, setSavingService] = useState(false)

  // Feedback notifications
  const [successNotice, setSuccessNotice] = useState<string | null>(null)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)

  const showSuccess = (msg: string) => {
    setSuccessNotice(msg)
    setTimeout(() => setSuccessNotice(null), 4000)
  }

  const showError = (msg: string) => {
    setErrorNotice(msg)
    setTimeout(() => setErrorNotice(null), 5000)
  }

  // Status badge definitions
  const statusBadges: Record<string, { label: string; color: string }> = {
    draft: { label: t.common.draft || 'Borrador', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
    submitted: { label: t.common.inReview || 'En Revisión', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    pending_review: { label: t.common.inReview || 'En Revisión', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    published: { label: t.common.approved || 'En Catálogo', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
    rejected: { label: t.common.rejected || 'Rechazado', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
    paused: { label: locale === 'en' ? 'Paused' : 'Pausado', color: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200' },
    archived: { label: locale === 'en' ? 'Archived' : 'Archivado', color: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200' },
  }

  // Quick Status Change
  const handleQuickStatusChange = async (item: ListingWithRelations, newStatus: ListingStatus) => {
    setUpdatingStatusId(item.id)
    try {
      const updatedAttrs = newStatus === 'published' ? buildInitialFreeAdAttrs(item.attrs) : item.attrs
      const { error } = await supabase
        .from('listing')
        .update({
          status: newStatus,
          published_at: newStatus === 'published' ? (item.published_at || new Date().toISOString()) : item.published_at,
          attrs: updatedAttrs,
        })
        .eq('id', item.id)

      if (error) throw error

      setServices((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, status: newStatus, attrs: updatedAttrs } : s))
      )
      showSuccess(`Estado de "${item.title}" actualizado a: ${newStatus}`)
    } catch (err: any) {
      showError(err.message || 'Error al actualizar estado del servicio')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  // Open Service Modality & Times Modal
  const handleOpenServiceModal = (item: ListingWithRelations) => {
    setEditingService(item)
    const attrs = item.attrs || {}
    setServiceDuration(attrs.duracion || attrs.tiempo_estimado || '45 min')
    setServiceLeadTime(attrs.lead_time || attrs.tiempo_entrega || attrs.disponibilidad || '24 a 48 horas')
    setServiceCapacity(String(attrs.capacidad_diaria || 10))
    setServiceModality(attrs.modalidad || attrs.modality || 'Presencial')
    setServiceNotes(attrs.notas_servicio || '')
  }

  // Save Service Modality & Times
  const handleSaveServiceTimes = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingService) return
    setSavingService(true)

    try {
      const updatedAttrs = {
        ...(editingService.attrs || {}),
        duracion: serviceDuration.trim(),
        tiempo_estimado: serviceDuration.trim(),
        lead_time: serviceLeadTime.trim(),
        tiempo_entrega: serviceLeadTime.trim(),
        disponibilidad: serviceLeadTime.trim(),
        capacidad_diaria: parseInt(serviceCapacity, 10) || 10,
        modalidad: serviceModality,
        modality: serviceModality,
        notas_servicio: serviceNotes.trim(),
      }

      const { error } = await supabase
        .from('listing')
        .update({ attrs: updatedAttrs })
        .eq('id', editingService.id)

      if (error) throw error

      setServices((prev) =>
        prev.map((s) => (s.id === editingService.id ? { ...s, attrs: updatedAttrs } : s))
      )

      showSuccess('Modalidad, tiempos y condiciones del servicio actualizados exitosamente.')
      setEditingService(null)
    } catch (err: any) {
      showError(err.message || 'Error al actualizar condiciones del servicio.')
    } finally {
      setSavingService(false)
    }
  }

  // Filtered Services logic
  const filteredServices = services.filter((s) => {
    // Seller filter
    if (selectedSellerId !== 'all' && s.seller_id !== selectedSellerId) {
      return false
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchTitle = s.title?.toLowerCase().includes(q)
      const matchCat = s.category?.name?.toLowerCase().includes(q)
      const matchCity = s.city?.toLowerCase().includes(q)
      const matchDesc = s.description?.toLowerCase().includes(q)
      if (!matchTitle && !matchCat && !matchCity && !matchDesc) return false
    }

    // Status filter
    if (statusFilter === 'published' && s.status !== 'published') return false
    if (statusFilter === 'pending' && s.status !== 'submitted' && s.status !== 'pending_review') return false
    if (statusFilter === 'draft' && s.status !== 'draft') return false
    if (statusFilter === 'paused' && s.status !== 'paused' && s.status !== 'archived') return false

    // Modality filter
    const itemMod = (s.attrs?.modalidad || s.attrs?.modality || '').toLowerCase()
    if (modalityFilter !== 'all') {
      if (modalityFilter === 'Presencial' && !itemMod.includes('presencial')) return false
      if (modalityFilter === 'A domicilio' && !itemMod.includes('domicilio')) return false
      if (modalityFilter === 'Virtual / Remoto' && !(itemMod.includes('virtual') || itemMod.includes('remoto'))) return false
      if (modalityFilter === 'Mixta' && !itemMod.includes('mixt')) return false
    }

    // Rate filter
    if (rateFilter === 'fixed' && (s.price === null || s.price === undefined)) return false
    if (rateFilter === 'quote' && s.price !== null && s.price !== undefined) return false

    return true
  })

  // Estadísticas rápidas específicas de Servicios
  const totalServices = services.length
  const totalPublished = services.filter((s) => s.status === 'published').length
  const totalPending = services.filter((s) => s.status === 'submitted' || s.status === 'pending_review' || s.status === 'draft').length
  const totalVirtual = services.filter((s) => {
    const mod = (s.attrs?.modalidad || s.attrs?.modality || '').toLowerCase()
    return mod.includes('virtual') || mod.includes('remoto')
  }).length
  const totalInPerson = services.filter((s) => {
    const mod = (s.attrs?.modalidad || s.attrs?.modality || '').toLowerCase()
    return mod.includes('presencial') || mod.includes('domicilio')
  }).length

  return (
    <div className="space-y-6">
      {/* 🌟 ENCABEZADO INDEPENDIENTE DE SERVICIOS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl sm:text-3xl">🛠️</span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {locale === 'en' ? 'Professional Services Management' : 'Gestión de Servicios Profesionales'}
            </h1>
            <span className="rounded-full bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 tracking-wider">
              Ventana Exclusiva
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl">
            {locale === 'en'
              ? 'Manage your professional services, appointment modalities, response times, and rates. Strictly isolated from physical inventory.'
              : 'Administra tus ofertas de servicios, modalidades de atención (presencial/virtual), tiempos de respuesta y tarifas. Sin temas de inventario físico ni stock.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <Link
            href="/publicar?type=service"
            className="rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition-colors flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>{locale === 'en' ? 'Post New Service' : 'Publicar Nuevo Servicio'}</span>
          </Link>
        </div>
      </div>

      {/* FEEDBACK TOASTS */}
      {successNotice && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-3.5 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-2xs">
          <span>✓ {successNotice}</span>
          <button type="button" onClick={() => setSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400">
            ✕
          </button>
        </div>
      )}

      {errorNotice && (
        <div className="rounded-xl bg-red-50 border border-red-300 p-3.5 text-xs font-semibold text-red-900 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200 flex items-center justify-between shadow-2xs">
          <span>⚠️ {errorNotice}</span>
          <button type="button" onClick={() => setErrorNotice(null)} className="text-red-700 hover:text-red-900 dark:text-red-400">
            ✕
          </button>
        </div>
      )}

      {/* 📊 TARJETAS DE MÉTRICAS EXCLUSIVAS DE SERVICIOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 shadow-2xs dark:border-purple-950/60 dark:bg-purple-950/20">
          <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider block">
            Total Servicios
          </span>
          <div className="mt-2 text-2xl font-black text-purple-700 dark:text-purple-400">
            {totalServices}
          </div>
          <span className="text-[11px] text-purple-600/80 dark:text-purple-400/80">en tu catálogo</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs dark:border-emerald-950/60 dark:bg-emerald-950/20">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
            En Catálogo (Activos)
          </span>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {totalPublished}
          </div>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">visibles a clientes</span>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-2xs dark:border-blue-950/60 dark:bg-blue-950/20">
          <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider block">
            Virtuales / Remotos
          </span>
          <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
            {totalVirtual}
          </div>
          <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80">atención en línea</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-2xs dark:border-amber-950/60 dark:bg-amber-950/20">
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
            Presenciales / Domicilio
          </span>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {totalInPerson}
          </div>
          <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80">{totalPending} en revisión/borrador</span>
        </div>
      </div>

      {/* 🔍 BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Búsqueda por texto */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar servicio por título, categoría, ciudad o descripción..."
              className="w-full rounded-xl border border-zinc-300 pl-8 pr-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Filtro por negocio emisor */}
          {sellers.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500">Negocio:</span>
              <select
                value={selectedSellerId}
                onChange={(e) => setSelectedSellerId(e.target.value)}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <option value="all">🏢 Todos mis negocios</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.business_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Botones de Filtro Rápido */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {/* Por Estado */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'published', label: '✓ En Catálogo' },
              { id: 'pending', label: '⏳ En Revisión' },
              { id: 'draft', label: '📦 Borradores' },
              { id: 'paused', label: '⏸️ Pausados' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st.id
                    ? 'bg-white dark:bg-zinc-900 text-purple-700 dark:text-purple-300 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Por Modalidad */}
          <select
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            className="rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <option value="all">📍 Todas las modalidades</option>
            <option value="Presencial">Presencial (en sede)</option>
            <option value="A domicilio">A domicilio (visita)</option>
            <option value="Virtual / Remoto">Virtual / Remoto (online)</option>
            <option value="Mixta">Modalidad Mixta</option>
          </select>

          {/* Por Tipo de Tarifa */}
          <select
            value={rateFilter}
            onChange={(e) => setRateFilter(e.target.value as any)}
            className="rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <option value="all">💲 Todas las tarifas</option>
            <option value="fixed">Tarifa fija establecida</option>
            <option value="quote">Cotización a solicitud</option>
          </select>
        </div>
      </div>

      {/* 📋 LISTADO DE SERVICIOS */}
      {filteredServices.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-5xl block mb-3">🛠️</span>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            No se encontraron servicios con los filtros actuales
          </h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            {services.length === 0
              ? 'Aún no has registrado ningún servicio profesional en tu catálogo.'
              : 'Prueba cambiando los filtros de modalidad, estado o el término de búsqueda.'}
          </p>
          <div className="mt-5">
            <Link
              href="/publicar?type=service"
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition-colors"
            >
              <span>➕ Publicar mi primer servicio</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredServices.map((service) => {
            const coverImage = service.listing_media && service.listing_media.length > 0 ? service.listing_media[0].url : null
            const serviceTime = service.attrs?.tiempo_estimado || service.attrs?.duracion || '45 min'
            const serviceLead = service.attrs?.lead_time || service.attrs?.tiempo_entrega || service.attrs?.disponibilidad || '24 a 48 horas'
            const serviceMod = service.attrs?.modalidad || service.attrs?.modality || 'Presencial'
            const serviceCap = service.attrs?.capacidad_diaria || 10
            const serviceNotes = service.attrs?.notas_servicio || ''

            return (
              <div
                key={service.id}
                className="rounded-2xl border border-purple-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-purple-400 dark:border-purple-900/60 dark:bg-zinc-900 dark:hover:border-purple-700"
              >
                {/* 1. FILA SUPERIOR: Metadata (Servicio Profesional, Categoría, Ciudad) y Tarifa destacada */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-800 dark:bg-purple-950 dark:text-purple-300 uppercase tracking-wider">
                      <span>🛠️</span>
                      <span>Servicio Profesional</span>
                    </span>
                    {service.category && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                        <span>•</span>
                        <span>📁 {service.category.name}</span>
                      </span>
                    )}
                    {service.city && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                        <span>•</span>
                        <span>📍 {service.city}</span>
                      </span>
                    )}
                  </div>

                  {/* Tarifa destacada en la cabecera */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Tarifa:
                    </span>
                    {service.price !== null && service.price !== undefined ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-base sm:text-lg font-black text-purple-700 dark:text-purple-300">
                          ${Number(service.price).toLocaleString('es-CO')} COP
                        </span>
                        <span className="text-[11px] font-bold text-zinc-500">
                          / {service.price_unit || 'servicio'}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                        <span>💬</span>
                        <span>Cotización a convenir</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. CUERPO PRINCIPAL: Portada + Título + Criterios de Prestación */}
                <div className="flex items-start gap-3.5 sm:gap-4 pt-3.5 min-w-0">
                  {/* Imagen / Portada con zoom y acceso al anuncio */}
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80 group shadow-2xs">
                    <Link
                      href={`/catalogo/${service.id}`}
                      className="block h-full w-full relative"
                      title="Ver anuncio en catálogo público"
                    >
                      {coverImage ? (
                        <Image
                          src={coverImage}
                          alt={service.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                          🛠️
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                        👁️ Ver
                      </div>
                    </Link>
                  </div>

                  {/* Información Central del Servicio */}
                  <div className="min-w-0 flex-1">
                    {/* Título del Servicio */}
                    <div className="flex items-baseline gap-2">
                      <Link
                        href={`/catalogo/${service.id}`}
                        className="font-black text-base sm:text-lg text-zinc-900 dark:text-zinc-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors line-clamp-1"
                        title="Clic para ver anuncio en catálogo público"
                      >
                        {service.title}
                      </Link>
                      <span className="text-xs text-zinc-400 font-bold shrink-0">↗</span>
                    </div>

                    {/* Criterios Clave del Servicio */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                      {/* Modalidad */}
                      <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <span>📍</span>
                        <span>Modalidad: <strong className="font-extrabold">{serviceMod}</strong></span>
                      </span>

                      {/* Tiempo de respuesta */}
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <span>⚡</span>
                        <span>Respuesta: <strong className="font-extrabold">{serviceLead}</strong></span>
                      </span>

                      {/* Duración */}
                      <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        <span>⏱️</span>
                        <span>Duración: <strong className="font-bold">{serviceTime}</strong></span>
                      </span>

                      {/* Capacidad */}
                      <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        <span>👥</span>
                        <span>Capacidad: <strong className="font-bold">{serviceCap} cupos/día</strong></span>
                      </span>
                    </div>

                    {/* Instrucciones / Notas si existen */}
                    {serviceNotes && (
                      <div className="mt-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 px-2.5 py-1 text-[11px] text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50 flex items-start gap-1.5">
                        <span className="shrink-0">📝</span>
                        <span className="italic line-clamp-1">{serviceNotes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. BARRA INFERIOR DE BOTONES Y ACCIONES: Claramente organizada */}
                <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2.5">
                  {/* Grupo Izquierdo: Selector de Estado + Ver Anuncio + Vista Rápida */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Selector Rápido de Estado */}
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">
                        Estado:
                      </label>
                      <select
                        value={service.status}
                        disabled={updatingStatusId === service.id}
                        onChange={(e) => handleQuickStatusChange(service, e.target.value as ListingStatus)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          service.status === 'published'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : service.status === 'draft'
                            ? 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                            : service.status === 'paused'
                            ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                        title="Cambiar estado del servicio"
                      >
                        <option value="published">🟢 En Catálogo</option>
                        <option value="draft">⚪ Borrador</option>
                        <option value="paused">🟠 Pausado</option>
                        <option value="submitted">🟡 En Revisión</option>
                        <option value="archived">📁 Archivado</option>
                      </select>
                    </div>

                    <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />

                    {/* Ver Anuncio en Catálogo */}
                    <Link
                      href={`/catalogo/${service.id}`}
                      className="rounded-lg border border-purple-200 bg-purple-50/60 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900 transition-colors flex items-center gap-1 shadow-2xs"
                      title="Abrir anuncio en catálogo público"
                    >
                      <span>👁️</span>
                      <span>Ver Anuncio</span>
                      <span className="text-[10px]">↗</span>
                    </Link>

                    {/* Vista Rápida Modal */}
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewItem(service)
                        setPreviewMediaIndex(0)
                      }}
                      className="rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1 shadow-2xs"
                      title="Vista previa rápida sin salir de esta ventana"
                    >
                      <span>🔍</span>
                      <span>Vista Rápida</span>
                    </button>
                  </div>

                  {/* Grupo Derecho: Condiciones + Editar + Promocionar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Ajustar Modalidad y Tiempos */}
                    <button
                      type="button"
                      onClick={() => handleOpenServiceModal(service)}
                      className="rounded-lg border border-purple-300 bg-purple-100/70 text-purple-900 px-3 py-1 text-xs font-bold hover:bg-purple-200 dark:border-purple-700 dark:bg-purple-950/80 dark:text-purple-200 dark:hover:bg-purple-900 transition-colors flex items-center gap-1.5 shadow-2xs"
                      title="Configurar modalidades de atención, plazos de respuesta, duración y cupos"
                    >
                      <span>⚙️</span>
                      <span>Condiciones y Tiempos</span>
                    </button>

                    {/* Editar Formulario Completo */}
                    <Link
                      href={`/publicar?type=service&edit_id=${service.id}`}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 shadow-2xs"
                      title="Editar servicio en formulario completo (fotos, descripción, tarifa)"
                    >
                      <span>✏️</span>
                      <span>Editar Servicio</span>
                    </Link>

                    {/* Promocionar si está publicado */}
                    {service.status === 'published' && (
                      <Link
                        href={`/promocionar?listing_id=${service.id}`}
                        className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-3 py-1 text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-xs hover:shadow-sm"
                        title="Crear campaña publicitaria para destacar este servicio"
                      >
                        <span>🚀</span>
                        <span>Promocionar</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 🌟 MODAL: CONFIGURAR MODALIDAD Y TIEMPOS DE SERVICIO */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 my-8">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-50">
                  Condiciones y Tiempos del Servicio
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-zinc-500">
              Ajusta la modalidad de atención, plazos de respuesta y cupos para <strong>&quot;{editingService.title}&quot;</strong>.
            </p>

            <form onSubmit={handleSaveServiceTimes} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Modalidad de Atención *
                </label>
                <select
                  value={serviceModality}
                  onChange={(e) => setServiceModality(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 font-semibold focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="Presencial">Presencial (en sede / consultorio)</option>
                  <option value="A domicilio">A domicilio (visita directa al cliente)</option>
                  <option value="Virtual / Remoto">Virtual / Remoto (en línea por videollamada)</option>
                  <option value="Mixta">Mixta (Presencial y Virtual)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Plazo de Respuesta / Realización *
                  </label>
                  <select
                    value={serviceLeadTime}
                    onChange={(e) => setServiceLeadTime(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 font-semibold focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="Inmediato / Mismo día">Inmediato / Mismo día</option>
                    <option value="24 a 48 horas">24 a 48 horas</option>
                    <option value="3 a 5 días hábiles">3 a 5 días hábiles</option>
                    <option value="A convenir con el cliente">A convenir con el cliente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Duración Estimada de Sesión
                  </label>
                  <input
                    type="text"
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(e.target.value)}
                    placeholder="Ej. 45 min, 2 horas, 1 sesión"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Capacidad de Atención Diaria (Cupos)
                </label>
                <input
                  type="number"
                  min="1"
                  value={serviceCapacity}
                  onChange={(e) => setServiceCapacity(e.target.value)}
                  placeholder="10"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Instrucciones o Notas para el Cliente (opcional)
                </label>
                <textarea
                  rows={2}
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="Ej. Llevar documentos, estar 10 minutos antes, agendar con 24h de anticipación..."
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {savingService ? 'Guardando...' : 'Guardar Condiciones'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 MODAL: VISTA RÁPIDA DE SERVICIO */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 my-8">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛠️</span>
                <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-50 truncate max-w-xs">
                  {previewItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {/* Galería */}
            <div className="mt-4">
              {previewItem.listing_media && previewItem.listing_media.length > 0 ? (
                <div>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <Image
                      src={previewItem.listing_media[previewMediaIndex]?.url || previewItem.listing_media[0].url}
                      alt={previewItem.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {previewItem.listing_media.length > 1 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                      {previewItem.listing_media.map((m, idx) => (
                        <button
                          key={m.id || idx}
                          type="button"
                          onClick={() => setPreviewMediaIndex(idx)}
                          className={`relative h-12 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                            previewMediaIndex === idx ? 'border-purple-600 ring-2 ring-purple-600/30' : 'border-zinc-200 dark:border-zinc-700 opacity-60'
                          }`}
                        >
                          <Image src={m.url} alt="" fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video w-full rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-4xl border border-purple-200 dark:border-purple-800">
                  🛠️
                </div>
              )}
            </div>

            {/* Datos detallados del servicio */}
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Tarifa del Servicio:</span>
                <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                  {previewItem.price !== null && previewItem.price !== undefined
                    ? `$${Number(previewItem.price).toLocaleString('es-CO')} COP / ${previewItem.price_unit || 'servicio'}`
                    : 'Cotización a solicitud'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Modalidad de Atención:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {previewItem.attrs?.modalidad || previewItem.attrs?.modality || 'Presencial'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Tiempo de Respuesta:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {previewItem.attrs?.lead_time || previewItem.attrs?.tiempo_entrega || '24 a 48 horas'}
                </span>
              </div>

              {previewItem.description && (
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500 font-medium block mb-1">Descripción:</span>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed max-h-28 overflow-y-auto">
                    {previewItem.description}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Link
                href={`/catalogo/${previewItem.id}`}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Abrir en Catálogo Público ↗
              </Link>
              <Link
                href={`/publicar?type=service&edit_id=${previewItem.id}`}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition-colors shadow-xs"
              >
                Editar Servicio
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
