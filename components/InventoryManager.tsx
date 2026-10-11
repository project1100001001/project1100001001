'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ListingWithRelations, Sale, SaleStatus, Seller } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface InventoryManagerProps {
  initialListings: ListingWithRelations[]
  initialSales: Sale[]
  sellers: Seller[]
}

export default function InventoryManager({
  initialListings,
  initialSales,
  sellers,
}: InventoryManagerProps) {
  const { t, locale } = useTranslation()
  const supabase = createClient()

  // Selected seller filter (if user owns multiple)
  const [selectedSellerId, setSelectedSellerId] = useState<string>(
    sellers.length > 0 ? sellers[0].id : 'all'
  )

  // Main Tab state: 'inventory' | 'sales'
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales'>('inventory')

  // Listings & Inventory state
  const [listings, setListings] = useState<ListingWithRelations[]>(initialListings)
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'products' | 'services' | 'low_stock' | 'out_of_stock'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Inline editing state for product stock
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({})
  const [savingStockId, setSavingStockId] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)

  // Service Times Configuration Modal
  const [editingService, setEditingService] = useState<ListingWithRelations | null>(null)
  const [serviceDuration, setServiceDuration] = useState('45 min')
  const [serviceLeadTime, setServiceLeadTime] = useState('Mismo día')
  const [serviceCapacity, setServiceCapacity] = useState('10')
  const [serviceModality, setServiceModality] = useState('Presencial')
  const [serviceNotes, setServiceNotes] = useState('')
  const [savingService, setSavingService] = useState(false)

  // Sales State
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [salesFilter, setSalesFilter] = useState<'all' | 'completed' | 'in_progress' | 'pending' | 'cancelled'>('all')
  const [updatingSaleId, setUpdatingSaleId] = useState<string | null>(null)

  // Manual Sale Modal
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [saleListingId, setSaleListingId] = useState<string>('')
  const [saleQuantity, setSaleQuantity] = useState<number>(1)
  const [saleBuyerName, setSaleBuyerName] = useState('')
  const [saleBuyerPhone, setSaleBuyerPhone] = useState('')
  const [saleServiceDuration, setSaleServiceDuration] = useState('')
  const [saleScheduledFor, setSaleScheduledFor] = useState('')
  const [saleNotes, setSaleNotes] = useState('')
  const [saleStatus, setSaleStatus] = useState<SaleStatus>('completed')
  const [recordingSale, setRecordingSale] = useState(false)

  // -------------------------------------------------------------
  // Filtered Listings
  // -------------------------------------------------------------
  const filteredListings = listings.filter((l) => {
    // Seller filter
    if (selectedSellerId !== 'all' && l.seller_id !== selectedSellerId) return false

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = l.title?.toLowerCase().includes(q)
      const matchCat = l.category?.name?.toLowerCase().includes(q)
      const matchCity = l.city?.toLowerCase().includes(q)
      if (!matchTitle && !matchCat && !matchCity) return false
    }

    // Tab subfilter
    const isService = l.type === 'service'
    const isProduct = l.type === 'product' || l.type === 'article'
    const currentStock = l.stock ?? 0

    if (inventoryFilter === 'products' && !isProduct) return false
    if (inventoryFilter === 'services' && !isService) return false
    if (inventoryFilter === 'low_stock') {
      if (isProduct && (currentStock > 3 || currentStock === 0)) return false
      if (isService && currentStock > 3) return false
    }
    if (inventoryFilter === 'out_of_stock') {
      if (currentStock > 0) return false
    }

    return true
  })

  // -------------------------------------------------------------
  // Filtered Sales
  // -------------------------------------------------------------
  const filteredSales = sales.filter((s) => {
    if (selectedSellerId !== 'all' && s.seller_id !== selectedSellerId) return false
    if (salesFilter !== 'all' && s.status !== salesFilter) return false
    return true
  })

  // Summary Metrics
  const totalProducts = listings.filter((l) => l.type === 'product' || l.type === 'article').length
  const totalServices = listings.filter((l) => l.type === 'service').length
  const lowStockCount = listings.filter((l) => (l.stock ?? 0) > 0 && (l.stock ?? 0) <= 3).length
  const outOfStockCount = listings.filter((l) => (l.stock ?? 0) === 0).length

  const totalSalesRevenue = sales
    .filter((s) => s.status !== 'cancelled')
    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0)
  const totalUnitsSold = sales
    .filter((s) => s.status !== 'cancelled' && (s.type === 'product' || s.type === 'article'))
    .reduce((sum, s) => sum + Number(s.quantity || 1), 0)
  const totalServicesDone = sales
    .filter((s) => s.status !== 'cancelled' && s.type === 'service')
    .length

  // -------------------------------------------------------------
  // Handlers: Product Stock Adjustments
  // -------------------------------------------------------------
  const handleStockChange = (listingId: string, newStock: number) => {
    setStockEdits((prev) => ({
      ...prev,
      [listingId]: Math.max(0, newStock),
    }))
  }

  const handleSaveStock = async (listing: ListingWithRelations) => {
    const newStock = stockEdits[listing.id] !== undefined ? stockEdits[listing.id] : (listing.stock ?? 0)
    setSavingStockId(listing.id)
    setSuccessNotice(null)
    setErrorNotice(null)

    try {
      const { error } = await supabase
        .from('listing')
        .update({ stock: newStock })
        .eq('id', listing.id)

      if (error) throw error

      setListings((prev) =>
        prev.map((l) => (l.id === listing.id ? { ...l, stock: newStock } : l))
      )
      // Limpiar edición
      setStockEdits((prev) => {
        const next = { ...prev }
        delete next[listing.id]
        return next
      })

      setSuccessNotice(`Stock actualizado para "${listing.title}" a ${newStock} unidades.`)
      setTimeout(() => setSuccessNotice(null), 4000)
    } catch (err: any) {
      console.error('Error actualizando stock:', err)
      setErrorNotice(err.message || 'Error al actualizar el stock en la base de datos.')
    } finally {
      setSavingStockId(null)
    }
  }

  const handleStepStock = async (listing: ListingWithRelations, delta: number) => {
    const current = stockEdits[listing.id] !== undefined ? stockEdits[listing.id] : (listing.stock ?? 0)
    const nextVal = Math.max(0, current + delta)
    handleStockChange(listing.id, nextVal)
  }

  // -------------------------------------------------------------
  // Handlers: Service Times Modal & Save
  // -------------------------------------------------------------
  const handleOpenServiceModal = (listing: ListingWithRelations) => {
    setEditingService(listing)
    const attrs = listing.attrs || {}
    setServiceDuration(attrs.tiempo_estimado || attrs.duracion || '45 min')
    setServiceLeadTime(attrs.tiempo_entrega || attrs.disponibilidad || 'Mismo día')
    setServiceCapacity(String(listing.stock ?? attrs.capacidad_diaria ?? 10))
    setServiceModality(attrs.modalidad || 'Presencial')
    setServiceNotes(attrs.notas_servicio || '')
  }

  const handleSaveServiceTimes = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingService) return

    setSavingService(true)
    setSuccessNotice(null)
    setErrorNotice(null)

    try {
      const capNum = Math.max(0, parseInt(serviceCapacity, 10) || 0)
      const updatedAttrs = {
        ...(editingService.attrs || {}),
        tiempo_estimado: serviceDuration,
        duracion: serviceDuration,
        tiempo_entrega: serviceLeadTime,
        disponibilidad: serviceLeadTime,
        capacidad_diaria: capNum,
        modalidad: serviceModality,
        notas_servicio: serviceNotes,
      }

      const { error } = await supabase
        .from('listing')
        .update({
          stock: capNum,
          attrs: updatedAttrs,
        })
        .eq('id', editingService.id)

      if (error) throw error

      setListings((prev) =>
        prev.map((l) =>
          l.id === editingService.id
            ? { ...l, stock: capNum, attrs: updatedAttrs }
            : l
        )
      )

      setSuccessNotice(`Tiempos de servicio actualizados para "${editingService.title}".`)
      setTimeout(() => setSuccessNotice(null), 4000)
      setEditingService(null)
    } catch (err: any) {
      console.error('Error guardando tiempos de servicio:', err)
      setErrorNotice(err.message || 'Error al guardar tiempos de servicio.')
    } finally {
      setSavingService(false)
    }
  }

  // -------------------------------------------------------------
  // Handlers: Record Manual Sale & Decrement Inventory
  // -------------------------------------------------------------
  const handleOpenSaleModal = () => {
    const defaultList = filteredListings[0] || listings[0]
    setSaleListingId(defaultList ? defaultList.id : '')
    setSaleQuantity(1)
    setSaleBuyerName('')
    setSaleBuyerPhone('')
    setSaleServiceDuration(
      defaultList?.type === 'service'
        ? defaultList.attrs?.tiempo_estimado || '45 min'
        : ''
    )
    setSaleScheduledFor('')
    setSaleNotes('')
    setSaleStatus('completed')
    setSaleModalOpen(true)
  }

  const handleConfirmRecordSale = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetListing = listings.find((l) => l.id === saleListingId)
    if (!targetListing) return

    setRecordingSale(true)
    setSuccessNotice(null)
    setErrorNotice(null)

    try {
      const unitPrice = targetListing.price || 0
      const totalAmount = unitPrice * saleQuantity

      const newSaleRecord: Partial<Sale> = {
        seller_id: targetListing.seller_id,
        listing_id: targetListing.id,
        buyer_name: saleBuyerName.trim() || 'Cliente Directo',
        buyer_phone: saleBuyerPhone.trim() || null,
        quantity: saleQuantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        type: targetListing.type,
        status: saleStatus,
        service_duration: targetListing.type === 'service' ? saleServiceDuration : null,
        service_scheduled_for: saleScheduledFor ? new Date(saleScheduledFor).toISOString() : null,
        notes: saleNotes.trim() || null,
      }

      const { data: insertedSale, error: saleError } = await supabase
        .from('sale')
        .insert([newSaleRecord])
        .select('*, listing:listing_id(*, listing_media(*), category:category_id(*))')
        .single()

      if (saleError) throw saleError

      // Descontar inventario de producto automáticamente
      if (targetListing.type === 'product' || targetListing.type === 'article') {
        const currentStock = targetListing.stock ?? 0
        const updatedStock = Math.max(0, currentStock - saleQuantity)

        await supabase
          .from('listing')
          .update({ stock: updatedStock })
          .eq('id', targetListing.id)

        setListings((prev) =>
          prev.map((l) => (l.id === targetListing.id ? { ...l, stock: updatedStock } : l))
        )
      }

      if (insertedSale) {
        setSales((prev) => [insertedSale as Sale, ...prev])
      }

      setSuccessNotice(
        `Venta registrada exitosamente para "${targetListing.title}". Inventario descontado.`
      )
      setTimeout(() => setSuccessNotice(null), 5000)
      setSaleModalOpen(false)
    } catch (err: any) {
      console.error('Error registrando venta:', err)
      setErrorNotice(err.message || 'Error registrando la venta en la base de datos.')
    } finally {
      setRecordingSale(false)
    }
  }

  // Update Sale Status
  const handleUpdateSaleStatus = async (saleId: string, newStatus: SaleStatus) => {
    setUpdatingSaleId(saleId)
    try {
      const { error } = await supabase
        .from('sale')
        .update({ status: newStatus })
        .eq('id', saleId)

      if (error) throw error

      setSales((prev) =>
        prev.map((s) => (s.id === saleId ? { ...s, status: newStatus } : s))
      )
    } catch (err: any) {
      console.error('Error actualizando estado de venta:', err)
      setErrorNotice(err.message || 'No se pudo actualizar el estado de la venta.')
    } finally {
      setUpdatingSaleId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Superior y Selector de Comercio */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <span>📦</span>
            <span>{t.inventory.title}</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
            {t.inventory.subtitle}
          </p>
        </div>

        {/* Filtro de Negocio si el vendedor tiene múltiples perfiles */}
        {sellers.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-500">
              {locale === 'en' ? 'Store:' : 'Negocio:'}
            </label>
            <select
              value={selectedSellerId}
              onChange={(e) => setSelectedSellerId(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="all">{locale === 'en' ? 'All My Stores' : 'Todos mis comercios'}</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.business_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Alertas de Notificación */}
      {successNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {errorNotice && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorNotice(null)}
            className="text-red-700 hover:text-red-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Pestañas Principales: Inventario vs Ventas */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
            activeTab === 'inventory'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <span>📦</span>
          <span>{t.inventory.tabInventory}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {listings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
            activeTab === 'sales'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <span>🛍️</span>
          <span>{t.inventory.tabSales}</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-black">
            {sales.length}
          </span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* SECCIÓN 1: CONTROL DE INVENTARIO Y STOCK */}
      {/* ============================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Tarjetas de Resumen Rápido */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                {locale === 'en' ? 'Total Items' : 'Total Artículos'}
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                  {listings.length}
                </span>
                <span className="text-xs text-zinc-400">
                  {totalProducts} prod / {totalServices} serv
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                {locale === 'en' ? 'Active Products' : 'Productos Activos'}
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {totalProducts}
                </span>
                <span className="text-xs text-blue-600/80">📦 catálogo</span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                {t.inventory.lowStock}
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {lowStockCount}
                </span>
                <span className="text-xs text-amber-600/80">⚠️ ≤ 3 unidades</span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                {t.inventory.outOfStock}
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-red-600 dark:text-red-400">
                  {outOfStockCount}
                </span>
                <span className="text-xs text-red-600/80">🚫 reposición</span>
              </div>
            </div>
          </div>

          {/* Filtros y Buscador */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: t.inventory.allFilter, count: listings.length },
                { id: 'products', label: t.inventory.productsFilter, count: totalProducts },
                { id: 'services', label: t.inventory.servicesFilter, count: totalServices },
                { id: 'low_stock', label: t.inventory.lowStockFilter, count: lowStockCount },
                { id: 'out_of_stock', label: t.inventory.outOfStockFilter, count: outOfStockCount },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setInventoryFilter(f.id as any)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    inventoryFilter === f.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.2 text-[10px]">
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'en' ? 'Search items...' : 'Buscar artículos...'}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Listado / Tabla de Artículos con Ajustes */}
          {filteredListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-4xl">📦</span>
              <p className="mt-3 text-sm text-zinc-500">{t.inventory.noItems}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredListings.map((item) => {
                const isService = item.type === 'service'
                const rawStock = item.stock ?? 0
                const editedStock = stockEdits[item.id] !== undefined ? stockEdits[item.id] : rawStock
                const isDirty = stockEdits[item.id] !== undefined && stockEdits[item.id] !== rawStock
                const isSaving = savingStockId === item.id

                // Imagen de portada
                const coverImage = item.listing_media && item.listing_media.length > 0 ? item.listing_media[0].url : null

                // Duración y tiempos para servicios
                const serviceTime = item.attrs?.tiempo_estimado || item.attrs?.duracion || '45 min'
                const serviceLead = item.attrs?.tiempo_entrega || item.attrs?.disponibilidad || 'Mismo día'
                const serviceMod = item.attrs?.modalidad || 'Presencial'

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-xs transition-all dark:bg-zinc-900 ${
                      rawStock === 0 && !isService
                        ? 'border-red-200 dark:border-red-950/60 bg-red-50/10'
                        : rawStock <= 3 && !isService
                        ? 'border-amber-200 dark:border-amber-950/60'
                        : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Columna Izquierda: Imagen y Datos del Artículo */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                          {coverImage ? (
                            <Image
                              src={coverImage}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">
                              {isService ? '⏱️' : '📦'}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                isService
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {isService ? '⏱️ Servicio' : '📦 Producto'}
                            </span>
                            {item.category && (
                              <span className="text-[11px] text-zinc-400">
                                • {item.category.name}
                              </span>
                            )}
                            <span className="text-[11px] text-zinc-400">
                              • {item.city}
                            </span>
                          </div>

                          <h3 className="mt-1 font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                            {item.title}
                          </h3>

                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                              ${Number(item.price || 0).toLocaleString('es-CO')} COP
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              / {item.price_unit || (isService ? 'servicio' : 'unidad')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Columna Derecha: Controles según Producto o Servicio */}
                      <div className="shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* CASO A: ES PRODUCTO -> CONTROL DE STOCK */}
                        {!isService ? (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            {/* Badge de Estado del Stock */}
                            <div className="flex items-center gap-2">
                              {rawStock === 0 ? (
                                <span className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-1">
                                  <span>🚫</span>
                                  <span>{t.inventory.outOfStock}</span>
                                </span>
                              ) : rawStock <= 3 ? (
                                <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center gap-1">
                                  <span>⚠️</span>
                                  <span>{t.inventory.lowStock}: {rawStock}</span>
                                </span>
                              ) : (
                                <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                                  <span>✓</span>
                                  <span>{t.inventory.inStock}: {rawStock}</span>
                                </span>
                              )}
                            </div>

                            {/* Stepper y Ajuste Rápido de Cantidad */}
                            <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                              <button
                                type="button"
                                onClick={() => handleStepStock(item, -1)}
                                className="h-7 w-7 rounded-lg bg-white font-black text-sm text-zinc-700 shadow-xs hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-colors"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={editedStock}
                                onChange={(e) =>
                                  handleStockChange(item.id, parseInt(e.target.value, 10) || 0)
                                }
                                className="h-7 w-14 rounded-lg bg-white px-1 text-center font-black text-xs text-zinc-900 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
                              />
                              <button
                                type="button"
                                onClick={() => handleStepStock(item, 1)}
                                className="h-7 w-7 rounded-lg bg-white font-black text-sm text-zinc-700 shadow-xs hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-colors"
                              >
                                +
                              </button>
                            </div>

                            {/* Botón Guardar si fue modificado */}
                            {isDirty && (
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleSaveStock(item)}
                                className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 disabled:opacity-50 transition-colors animate-pulse"
                              >
                                {isSaving ? 'Guardando...' : `Guardar (${editedStock})`}
                              </button>
                            )}
                          </div>
                        ) : (
                          /* CASO B: ES SERVICIO -> CONTROL DE TIEMPOS Y CUPOS */
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="rounded-lg bg-purple-50 px-2 py-1 text-[11px] font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                                <span>⏱️</span>
                                <span>{serviceTime}</span>
                              </span>
                              <span className="rounded-lg bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                📅 {serviceLead}
                              </span>
                              <span className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                👥 {rawStock} cupos/día
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenServiceModal(item)}
                              className="rounded-xl border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:bg-purple-900 transition-colors"
                            >
                              ⚙️ Configurar Tiempos
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* SECCIÓN 2: VENTAS REALIZADAS */}
      {/* ============================================================= */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Métricas de Ventas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs dark:border-emerald-950/60 dark:bg-emerald-950/20">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                {t.inventory.totalSales}
              </span>
              <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">
                ${totalSalesRevenue.toLocaleString('es-CO')}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                {t.inventory.unitsSold}
              </span>
              <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
                {totalUnitsSold} unids
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                {t.inventory.servicesCompleted}
              </span>
              <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
                {totalServicesDone} citas
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                {locale === 'en' ? 'Total Orders' : 'Total Pedidos'}
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                  {sales.length}
                </span>
                <span className="text-xs text-zinc-400">registros</span>
              </div>
            </div>
          </div>

          {/* Barra de Acciones: Filtros y Botón Registrar Venta Manual */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: t.common.allCategories || 'Todas', count: sales.length },
                { id: 'completed', label: t.inventory.saleCompleted, count: sales.filter((s) => s.status === 'completed').length },
                { id: 'in_progress', label: t.inventory.saleInProgress, count: sales.filter((s) => s.status === 'in_progress').length },
                { id: 'cancelled', label: t.inventory.saleCancelled, count: sales.filter((s) => s.status === 'cancelled').length },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSalesFilter(f.id as any)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    salesFilter === f.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.2 text-[10px]">
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleOpenSaleModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
            >
              <span>➕</span>
              <span>{t.inventory.recordSaleBtn}</span>
            </button>
          </div>

          {/* Listado / Tabla de Ventas Realizadas */}
          {filteredSales.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-4xl">🛍️</span>
              <p className="mt-3 text-sm text-zinc-500">{t.inventory.noSales}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <tr>
                      <th className="py-3 px-4 font-semibold">{locale === 'en' ? 'Product / Service' : 'Producto o Servicio'}</th>
                      <th className="py-3 px-4 font-semibold">{t.inventory.buyerName}</th>
                      <th className="py-3 px-4 font-semibold">{t.inventory.saleQuantity}</th>
                      <th className="py-3 px-4 font-semibold">{t.inventory.saleTotal}</th>
                      <th className="py-3 px-4 font-semibold">{t.inventory.saleStatus}</th>
                      <th className="py-3 px-4 font-semibold">{t.inventory.saleDate}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredSales.map((sale) => {
                      const isService = sale.type === 'service'
                      const isUpdating = updatingSaleId === sale.id

                      const statusColors: Record<SaleStatus, string> = {
                        completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
                        in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
                        pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
                        cancelled: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
                      }

                      return (
                        <tr key={sale.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className="text-base shrink-0">
                                {isService ? '⏱️' : '📦'}
                              </span>
                              <div className="min-w-0">
                                <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate max-w-xs">
                                  {sale.listing?.title || 'Artículo de catálogo'}
                                </span>
                                {isService && sale.service_duration && (
                                  <span className="text-[10px] text-purple-600 dark:text-purple-400 block">
                                    Duración: {sale.service_duration}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div>
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                                {sale.buyer_name || 'Cliente anónimo'}
                              </span>
                              {sale.buyer_phone && (
                                <a
                                  href={`https://wa.me/57${sale.buyer_phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-emerald-600 hover:underline dark:text-emerald-400 flex items-center gap-1"
                                >
                                  <span>💬</span>
                                  <span>{sale.buyer_phone}</span>
                                </a>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-zinc-800 dark:text-zinc-200">
                            {sale.quantity} {isService ? 'servicio' : 'uds'}
                          </td>

                          <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                            ${Number(sale.total_amount).toLocaleString('es-CO')} COP
                          </td>

                          <td className="py-3.5 px-4">
                            <select
                              value={sale.status}
                              disabled={isUpdating}
                              onChange={(e) =>
                                handleUpdateSaleStatus(sale.id, e.target.value as SaleStatus)
                              }
                              className={`rounded-lg px-2 py-1 text-[11px] font-bold border-0 focus:ring-1 focus:ring-emerald-500 ${
                                statusColors[sale.status]
                              }`}
                            >
                              <option value="completed">✓ {t.inventory.saleCompleted}</option>
                              <option value="in_progress">⏳ {t.inventory.saleInProgress}</option>
                              <option value="pending">⚠️ {t.inventory.salePending}</option>
                              <option value="cancelled">✕ {t.inventory.saleCancelled}</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 text-[11px] text-zinc-500">
                            {new Date(sale.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
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

      {/* ============================================================= */}
      {/* MODAL: AJUSTE DE TIEMPOS Y CUPOS DE SERVICIO */}
      {/* ============================================================= */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span>⚙️</span>
                <span>{t.inventory.editServiceTimes}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-zinc-500">
              Configura los tiempos de atención, entrega y capacidad operativa para:{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">{editingService.title}</strong>
            </p>

            <form onSubmit={handleSaveServiceTimes} className="mt-5 space-y-4">
              {/* Duración estimada */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  ⏱️ {t.inventory.serviceDuration} *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                  {['15 min', '30 min', '45 min', '1 hora', '2 horas', 'Medio día', '1 día'].map(
                    (dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setServiceDuration(dur)}
                        className={`rounded-lg py-1 px-2 text-xs font-semibold border transition-colors ${
                          serviceDuration === dur
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {dur}
                      </button>
                    )
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(e.target.value)}
                  placeholder="Ej. 45 minutos o 1 hora y 30 min"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Tiempo de respuesta / entrega */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  📅 {t.inventory.leadTime} *
                </label>
                <select
                  value={serviceLeadTime}
                  onChange={(e) => setServiceLeadTime(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="Inmediato">Inmediato / En el momento</option>
                  <option value="Mismo día">Mismo día</option>
                  <option value="24 a 48 horas">24 a 48 horas</option>
                  <option value="3 a 5 días hábiles">3 a 5 días hábiles</option>
                  <option value="Bajo agendamiento previo">Bajo agendamiento previo</option>
                </select>
              </div>

              {/* Capacidad / Cupos por día */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    👥 {t.inventory.slotsPerDay} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={serviceCapacity}
                    onChange={(e) => setServiceCapacity(e.target.value)}
                    placeholder="10"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 font-bold"
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">
                    Citas o turnos que puedes atender diariamente
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    📍 {t.inventory.modality}
                  </label>
                  <select
                    value={serviceModality}
                    onChange={(e) => setServiceModality(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="Presencial en Taller/Local">{t.inventory.inPerson}</option>
                    <option value="A domicilio">{t.inventory.homeDelivery}</option>
                    <option value="Virtual / Remoto">{t.inventory.remote}</option>
                  </select>
                </div>
              </div>

              {/* Notas de servicio */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  📝 Condiciones o Notas del Servicio
                </label>
                <input
                  type="text"
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="Ej. Requiere traer el vehículo frío o agendar con 2 horas de anticipación"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Acciones */}
              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={savingService}
                  onClick={() => setEditingService(null)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-500 disabled:opacity-50 transition-colors"
                >
                  {savingService ? 'Guardando...' : t.inventory.saveServiceTimes}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: REGISTRAR VENTA MANUAL (PRODUCTO O SERVICIO) */}
      {/* ============================================================= */}
      {saleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span>🛍️</span>
                <span>{t.inventory.manualSaleTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSaleModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRecordSale} className="mt-4 space-y-4">
              {/* Selección del Artículo */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  {t.inventory.selectListing} *
                </label>
                <select
                  required
                  value={saleListingId}
                  onChange={(e) => {
                    setSaleListingId(e.target.value)
                    const found = listings.find((l) => l.id === e.target.value)
                    if (found?.type === 'service') {
                      setSaleServiceDuration(found.attrs?.tiempo_estimado || '45 min')
                    }
                  }}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {listings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.type === 'service' ? '⏱️ [Servicio]' : '📦 [Producto]'}{' '}
                      {l.title} — ${Number(l.price || 0).toLocaleString('es-CO')}
                      {l.type === 'product' ? ` (Stock: ${l.stock ?? 0})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad y Precio */}
              {(() => {
                const target = listings.find((l) => l.id === saleListingId)
                const isService = target?.type === 'service'
                const unitPrice = target?.price || 0
                const total = unitPrice * saleQuantity

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                          {isService ? 'Turnos / Cupos' : t.inventory.saleQuantity} *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={!isService ? target?.stock ?? 999 : 999}
                          required
                          value={saleQuantity}
                          onChange={(e) => setSaleQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                        {!isService && (
                          <span className="text-[10px] text-zinc-400 mt-0.5 block">
                            Stock disponible: {target?.stock ?? 0} (se descontará automáticamente)
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                          {t.inventory.saleTotal}
                        </label>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                          ${total.toLocaleString('es-CO')} COP
                        </div>
                      </div>
                    </div>

                    {/* Si es servicio, duración y fecha agendada */}
                    {isService && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                            ⏱️ Duración del Servicio
                          </label>
                          <input
                            type="text"
                            value={saleServiceDuration}
                            onChange={(e) => setSaleServiceDuration(e.target.value)}
                            placeholder="Ej. 45 min"
                            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                            📅 Fecha / Hora Agendada
                          </label>
                          <input
                            type="datetime-local"
                            value={saleScheduledFor}
                            onChange={(e) => setSaleScheduledFor(e.target.value)}
                            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}

              {/* Datos del Comprador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    {t.inventory.buyerName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={saleBuyerName}
                    onChange={(e) => setSaleBuyerName(e.target.value)}
                    placeholder="Ej. Andrés Pérez"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    {t.inventory.buyerPhone}
                  </label>
                  <input
                    type="tel"
                    value={saleBuyerPhone}
                    onChange={(e) => setSaleBuyerPhone(e.target.value)}
                    placeholder="Ej. 3101234567"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Estado de la Venta */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  {t.inventory.saleStatus}
                </label>
                <select
                  value={saleStatus}
                  onChange={(e) => setSaleStatus(e.target.value as SaleStatus)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="completed">✓ {t.inventory.saleCompleted} (Entregada / Pagada)</option>
                  <option value="in_progress">⏳ {t.inventory.saleInProgress} (En preparación o agendada)</option>
                  <option value="pending">⚠️ {t.inventory.salePending} (Pendiente de pago / confirmación)</option>
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  {t.inventory.notes}
                </label>
                <input
                  type="text"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  placeholder="Ej. Venta por WhatsApp con entrega en punto de venta"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Acciones */}
              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={recordingSale}
                  onClick={() => setSaleModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={recordingSale}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {recordingSale ? 'Registrando...' : 'Confirmar y Descontar Inventario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
