'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category, ListingStatus, ListingType, ListingWithRelations, PriceHistoryRecord, Sale, SaleStatus, Seller } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface InventoryManagerProps {
  initialListings: ListingWithRelations[]
  initialSales: Sale[]
  sellers: Seller[]
  categories?: Category[]
}

export default function InventoryManager({
  initialListings,
  initialSales,
  sellers,
  categories = [],
}: InventoryManagerProps) {
  const { t, locale } = useTranslation()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const editListingId = searchParams ? searchParams.get('edit') : null
  const urlTab = searchParams ? searchParams.get('tab') : null
  const urlType = searchParams ? searchParams.get('type') || searchParams.get('filter') : null

  // Selected seller filter (if user owns multiple)
  const [selectedSellerId, setSelectedSellerId] = useState<string>(
    sellers.length > 0 ? sellers[0].id : 'all'
  )

  // Main Tab state: 'inventory' | 'sales'
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales'>(() => {
    if (urlTab === 'sales') return 'sales'
    return 'inventory'
  })

  // Listings & Inventory state (estrictamente productos nuevos y usados)
  const [listings, setListings] = useState<ListingWithRelations[]>(initialListings.filter((l) => l.type !== 'service'))
  const [macroTypeScope, setMacroTypeScope] = useState<'all' | 'products' | 'articles'>(() => {
    if (urlType === 'article' || urlType === 'articles') return 'articles'
    if (urlType === 'product' || urlType === 'products') return 'products'
    return 'all'
  })

  useEffect(() => {
    if (urlTab === 'sales') {
      setActiveTab('sales')
    } else if (urlTab === 'inventory') {
      setActiveTab('inventory')
    }
  }, [urlTab])

  useEffect(() => {
    if (urlType === 'article' || urlType === 'articles') {
      setMacroTypeScope('articles')
    } else if (urlType === 'product' || urlType === 'products') {
      setMacroTypeScope('products')
    } else if (urlType === 'all') {
      setMacroTypeScope('all')
    }
  }, [urlType])

  const [subFilter, setSubFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'pending' | 'draft' | 'paused'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Quick listing preview modal state
  const [previewItem, setPreviewItem] = useState<ListingWithRelations | null>(null)
  const [previewMediaIndex, setPreviewMediaIndex] = useState<number>(0)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

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

  // Price History & Notes in Item Editor
  const [priceChangeNote, setPriceChangeNote] = useState<string>('')
  const [priceHistoryList, setPriceHistoryList] = useState<PriceHistoryRecord[]>([])
  const [showPriceHistoryInFullEdit, setShowPriceHistoryInFullEdit] = useState<boolean>(false)

  // Register New Inventory Item Modal
  const [newItemModalOpen, setNewItemModalOpen] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemType, setNewItemType] = useState<ListingType>('product')
  const [newItemCategoryId, setNewItemCategoryId] = useState('')
  const [newItemSellerId, setNewItemSellerId] = useState(sellers.length > 0 ? sellers[0].id : '')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemPriceUnit, setNewItemPriceUnit] = useState('unidad')
  const [newItemStock, setNewItemStock] = useState('10')
  const [newItemCity, setNewItemCity] = useState(sellers.length > 0 ? sellers[0].city || '' : '')
  const [newItemDescription, setNewItemDescription] = useState('')
  const [creatingItem, setCreatingItem] = useState(false)

  // Full Item Editing Modal (Modificar todo el artículo generado)
  const [editingFullListing, setEditingFullListing] = useState<ListingWithRelations | null>(null)
  const [fullTitle, setFullTitle] = useState('')
  const [fullType, setFullType] = useState<ListingType>('product')
  const [fullCategoryId, setFullCategoryId] = useState('')
  const [fullPrice, setFullPrice] = useState('')
  const [fullPriceUnit, setFullPriceUnit] = useState('unidad')
  const [fullStock, setFullStock] = useState('1')
  const [fullCity, setFullCity] = useState('')
  const [fullStatus, setFullStatus] = useState<ListingStatus>('published')
  const [fullDescription, setFullDescription] = useState('')
  const [fullCondition, setFullCondition] = useState('Nuevo')
  const [fullModality, setFullModality] = useState('Presencial')
  const [fullDeliveryMethod, setFullDeliveryMethod] = useState('Domicilio local')
  const [fullServiceDuration, setFullServiceDuration] = useState('45 min')
  const [fullMediaUrls, setFullMediaUrls] = useState<string[]>([])
  const [fullNewImageUrl, setFullNewImageUrl] = useState('')
  const [savingFullItem, setSavingFullItem] = useState(false)

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
      const matchDuration = l.attrs?.tiempo_estimado?.toLowerCase().includes(q) || l.attrs?.duracion?.toLowerCase().includes(q)
      if (!matchTitle && !matchCat && !matchCity && !matchDuration) return false
    }

    // En la ventana de inventario NO mezclar productos y servicios: excluir estrictamente servicios
    if (l.type === 'service') return false

    const isProduct = l.type === 'product'
    const isArticle = l.type === 'article'
    const currentStock = l.stock ?? 0

    // 1. Macro Filter: Productos (Nuevos) vs Artículos (Usados)
    if (macroTypeScope === 'products' && !isProduct) return false
    if (macroTypeScope === 'articles' && !isArticle) return false

    // 2. Status filter
    if (statusFilter === 'published' && l.status !== 'published') return false
    if (statusFilter === 'pending' && l.status !== 'submitted' && l.status !== 'pending_review') return false
    if (statusFilter === 'draft' && l.status !== 'draft') return false
    if (statusFilter === 'paused' && l.status !== 'paused' && l.status !== 'archived') return false

    // 3. Subfilter contextual según el modo seleccionado
    if (macroTypeScope === 'products' || macroTypeScope === 'articles') {
      if (subFilter === 'in_stock' && currentStock <= 0) return false
      if (subFilter === 'low_stock' && (currentStock > 3 || currentStock <= 0)) return false
      if (subFilter === 'out_of_stock' && currentStock > 0) return false
    } else {
      // macroTypeScope === 'all'
      if (subFilter === 'products' && !isProduct) return false
      if (subFilter === 'articles' && !isArticle) return false
      if (subFilter === 'low_stock' && (currentStock > 3 || currentStock === 0)) return false
      if (subFilter === 'out_of_stock' && currentStock > 0) return false
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

  // Publication Status Counts
  const publishedCount = listings.filter((l) => l.status === 'published').length
  const pendingCount = listings.filter((l) => l.status === 'submitted' || l.status === 'pending_review').length
  const draftCount = listings.filter((l) => l.status === 'draft').length
  const pausedCount = listings.filter((l) => l.status === 'paused' || l.status === 'archived').length

  // Summary Metrics segmented by Item Type
  const productItems = listings.filter((l) => l.type === 'product')
  const articleItems = listings.filter((l) => l.type === 'article')
  const serviceItems = listings.filter((l) => l.type === 'service')

  const totalProducts = productItems.length
  const totalArticles = articleItems.length
  const totalServices = serviceItems.length

  // Products metrics (Nuevos)
  const totalStockUnits = productItems.reduce((acc, l) => acc + (l.stock ?? 0), 0)
  const lowStockCount = productItems.filter((l) => (l.stock ?? 0) > 0 && (l.stock ?? 0) <= 3).length
  const outOfStockCount = productItems.filter((l) => (l.stock ?? 0) === 0).length
  const inStockCount = productItems.filter((l) => (l.stock ?? 0) > 3).length

  // Articles metrics (Usados)
  const totalArticleUnits = articleItems.reduce((acc, l) => acc + (l.stock ?? 0), 0)
  const lowArticleStockCount = articleItems.filter((l) => (l.stock ?? 0) > 0 && (l.stock ?? 0) <= 3).length
  const outOfArticleStockCount = articleItems.filter((l) => (l.stock ?? 0) === 0).length
  const inArticleStockCount = articleItems.filter((l) => (l.stock ?? 0) > 3).length

  // Services metrics (Execution times, response times, daily capacity)
  const totalServiceCapacity = serviceItems.reduce((acc, l) => acc + (l.stock ?? (Number(l.attrs?.capacidad_diaria) || 10)), 0)
  const sameDayServicesCount = serviceItems.filter((l) => {
    const lead = (l.attrs?.tiempo_entrega || l.attrs?.disponibilidad || '').toLowerCase()
    return lead.includes('mismo') || lead.includes('inmediat') || lead.includes('hoy')
  }).length
  const inPersonServicesCount = serviceItems.filter((l) => {
    const mod = (l.attrs?.modalidad || l.attrs?.modality || '').toLowerCase()
    return mod.includes('presencial')
  }).length
  const remoteServicesCount = serviceItems.filter((l) => {
    const mod = (l.attrs?.modalidad || l.attrs?.modality || '').toLowerCase()
    return mod.includes('virtual') || mod.includes('remoto') || mod.includes('domicilio')
  }).length
  const scheduledServicesCount = totalServices - sameDayServicesCount

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
  // Handlers: Quick Status Toggle for Listings
  // -------------------------------------------------------------
  const handleQuickStatusChange = async (item: ListingWithRelations, newStatus: ListingStatus) => {
    setUpdatingStatusId(item.id)
    try {
      const { error } = await supabase
        .from('listing')
        .update({ status: newStatus })
        .eq('id', item.id)

      if (error) throw error

      setListings((prev) =>
        prev.map((l) => (l.id === item.id ? { ...l, status: newStatus } : l))
      )
      const label = statusBadges[newStatus]?.label || newStatus
      setSuccessNotice(locale === 'en' ? `Status updated to ${label}` : `Estado de la publicación actualizado a "${label}".`)
    } catch (err: any) {
      console.error('Error al actualizar estado:', err)
      setErrorNotice(err.message || 'Error al actualizar el estado de la publicación.')
    } finally {
      setUpdatingStatusId(null)
    }
  }

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
      const { data, error } = await supabase
        .from('listing')
        .update({ stock: newStock })
        .eq('id', listing.id)
        .select('id, stock')

      if (error) {
        console.error('Error Supabase actualizando stock:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        throw new Error(
          error.message ||
          error.details ||
          'Error de permisos (RLS). Ejecuta el script sql/011_fix_listing_inventory_rls_policies.sql en Supabase.'
        )
      }

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
      const errDetail =
        err?.message ||
        err?.details ||
        (typeof err === 'object' ? JSON.stringify(err) : String(err)) ||
        'Error al actualizar el stock en la base de datos.'
      setErrorNotice(errDetail)
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

      const { data, error } = await supabase
        .from('listing')
        .update({
          stock: capNum,
          attrs: updatedAttrs,
        })
        .eq('id', editingService.id)
        .select('id, stock, attrs')

      if (error) {
        console.error('Error Supabase guardando tiempos de servicio:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        throw new Error(
          error.message ||
          error.details ||
          'Error de permisos (RLS). Ejecuta el script sql/011_fix_listing_inventory_rls_policies.sql en Supabase.'
        )
      }

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
      const errDetail =
        err?.message ||
        err?.details ||
        (typeof err === 'object' ? JSON.stringify(err) : String(err)) ||
        'Error al guardar tiempos de servicio.'
      setErrorNotice(errDetail)
    } finally {
      setSavingService(false)
    }
  }

  // -------------------------------------------------------------
  // Handlers: Master Price Configuration & History
  // -------------------------------------------------------------
  const handleOpenPriceModal = (item: ListingWithRelations) => {
    handleOpenFullEditModal(item)
    setShowPriceHistoryInFullEdit(true)
  }

  // -------------------------------------------------------------
  // Handlers: Register New Item in Inventory
  // -------------------------------------------------------------
  const handleOpenNewItemModal = () => {
    const targetSeller = sellers.find((s) => s.id === selectedSellerId) || sellers[0]
    setNewItemSellerId(targetSeller ? targetSeller.id : (sellers[0]?.id || ''))
    setNewItemCity(targetSeller?.city || '')
    setNewItemTitle('')
    setNewItemType('product')
    setNewItemPrice('')
    setNewItemPriceUnit('unidad')
    setNewItemStock('10')
    setNewItemDescription('')
    if (categories && categories.length > 0) {
      setNewItemCategoryId(categories[0].id)
    }
    setNewItemModalOpen(true)
  }

  const handleCreateInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemTitle.trim()) {
      setErrorNotice('El título del artículo es requerido.')
      return
    }
    if (!newItemSellerId) {
      setErrorNotice('Debes seleccionar un negocio para el artículo.')
      return
    }

    setCreatingItem(true)
    setSuccessNotice(null)
    setErrorNotice(null)

    try {
      const numericPrice = newItemPrice ? Math.max(0, parseInt(newItemPrice, 10)) : null
      const numericStock = newItemType === 'service' ? Math.max(1, parseInt(newItemStock, 10) || 10) : Math.max(0, parseInt(newItemStock, 10) || 0)
      const catId = newItemCategoryId || (categories && categories.length > 0 ? categories[0].id : null)

      if (!catId) {
        throw new Error('Debes seleccionar una categoría para el artículo.')
      }

      const attrsObj: Record<string, any> = {}
      if (newItemType === 'service') {
        attrsObj.tiempo_estimado = '45 min'
        attrsObj.disponibilidad = 'Mismo día'
        attrsObj.modalidad = 'Presencial'
        attrsObj.capacidad_diaria = numericStock
      } else if (newItemType === 'product') {
        attrsObj.condition = 'Nuevo'
        attrsObj.delivery_method = 'Domicilio local'
      } else if (newItemType === 'article') {
        attrsObj.condition = 'Usado - Buen estado'
        attrsObj.delivery_method = 'Domicilio local'
      }

      const { data, error } = await supabase
        .from('listing')
        .insert({
          seller_id: newItemSellerId,
          category_id: catId,
          type: newItemType,
          title: newItemTitle.trim(),
          description: newItemDescription.trim() || null,
          price: numericPrice,
          price_unit: newItemPriceUnit.trim() || (newItemType === 'service' ? 'servicio' : 'unidad'),
          stock: numericStock,
          city: newItemCity.trim() || null,
          status: 'draft',
          attrs: attrsObj,
        })
        .select(`
          *,
          category:category_id(*),
          seller:seller_id(*),
          listing_media(*)
        `)
        .single()

      if (error) {
        throw error
      }

      if (data) {
        setListings((prev) => [data as ListingWithRelations, ...prev])
      }

      setSuccessNotice(`¡Artículo "${newItemTitle}" registrado en tu inventario con precio maestro $${(numericPrice || 0).toLocaleString('es-CO')} COP!`)
      setNewItemModalOpen(false)
      setTimeout(() => setSuccessNotice(null), 4000)
    } catch (err: any) {
      console.error('Error creando artículo en inventario:', err)
      setErrorNotice(err?.message || 'Error al registrar el artículo en el inventario.')
    } finally {
      setCreatingItem(false)
    }
  }

  // -------------------------------------------------------------
  // Handlers: Edit Entire Item / Listing (Modificar todo el artículo)
  // -------------------------------------------------------------
  const handleOpenFullEditModal = (item: ListingWithRelations) => {
    setEditingFullListing(item)
    setFullTitle(item.title || '')
    setFullType(item.type)
    setFullCategoryId(item.category_id || (categories && categories.length > 0 ? categories[0].id : ''))
    setFullPrice(item.price !== null && item.price !== undefined ? String(item.price) : '')
    setFullPriceUnit(item.price_unit || (item.type === 'service' ? 'servicio' : 'unidad'))
    setFullStock(item.stock !== null && item.stock !== undefined ? String(item.stock) : '1')
    setFullCity(item.city || '')
    setFullStatus(item.status)
    setFullDescription(item.description || '')

    const attrs = item.attrs || {}
    setFullCondition(attrs.condition || 'Nuevo')
    setFullModality(attrs.modalidad || attrs.modality || 'Presencial')
    setFullDeliveryMethod(attrs.delivery_method || 'Domicilio local')
    setFullServiceDuration(attrs.tiempo_estimado || attrs.duracion || '45 min')

    setFullMediaUrls(item.listing_media ? item.listing_media.map((m) => m.url) : [])
    setFullNewImageUrl('')
    setPriceChangeNote('')
    setShowPriceHistoryInFullEdit(false)

    // Cargar historial de precios para este artículo
    let initialHistory: PriceHistoryRecord[] = []
    if (Array.isArray(attrs.price_history) && attrs.price_history.length > 0) {
      initialHistory = attrs.price_history
    } else if (item.price !== null && item.price !== undefined) {
      initialHistory = [
        {
          id: 'base-initial',
          listing_id: item.id,
          price: item.price,
          price_unit: item.price_unit || (item.type === 'service' ? 'servicio' : 'unidad'),
          changed_at: item.created_at || new Date().toISOString(),
          note: 'Precio inicial registrado en catálogo/inventario',
        },
      ]
    }
    setPriceHistoryList(initialHistory)

    // Consultar tabla relacional si existe en Supabase
    supabase
      .from('listing_price_history')
      .select('*')
      .eq('listing_id', item.id)
      .order('changed_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setPriceHistoryList(data as PriceHistoryRecord[])
        }
      })
      .catch(() => {})
  }

  // Auto open full edit modal if 'edit' query param is provided (e.g. from /mis-publicaciones)
  useEffect(() => {
    if (editListingId && listings.length > 0) {
      const match = listings.find((l) => l.id === editListingId)
      if (match && (!editingFullListing || editingFullListing.id !== editListingId)) {
        handleOpenFullEditModal(match)
      }
    }
  }, [editListingId, listings])

  const handleAddFullMediaUrl = () => {
    const trimmed = fullNewImageUrl.trim()
    if (!trimmed) return
    if (!fullMediaUrls.includes(trimmed)) {
      setFullMediaUrls([...fullMediaUrls, trimmed])
      setFullNewImageUrl('')
    }
  }

  const handleRemoveFullMediaUrl = (index: number) => {
    setFullMediaUrls(fullMediaUrls.filter((_, i) => i !== index))
  }

  const handleSaveFullItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFullListing) return
    if (!fullTitle.trim()) {
      setErrorNotice('El título del artículo es requerido.')
      return
    }

    setSavingFullItem(true)
    setSuccessNotice(null)
    setErrorNotice(null)

    try {
      const numericPrice = fullPrice ? Math.max(0, parseInt(fullPrice, 10)) : null
      const numericStock =
        fullType === 'service'
          ? parseInt(fullStock, 10) || null
          : Math.max(0, parseInt(fullStock, 10) || 0)

      const updatedAttrs: Record<string, any> = {
        ...(editingFullListing.attrs || {}),
      }

      if (fullType === 'product') {
        updatedAttrs.condition = 'Nuevo'
        updatedAttrs.delivery_method = fullDeliveryMethod
      } else if (fullType === 'article') {
        updatedAttrs.condition = fullCondition.includes('Usado') || fullCondition.includes('Reacondicionado') ? fullCondition : 'Usado - Buen estado'
        updatedAttrs.delivery_method = fullDeliveryMethod
      } else if (fullType === 'service') {
        updatedAttrs.modalidad = fullModality
        updatedAttrs.tiempo_estimado = fullServiceDuration
        updatedAttrs.duracion = fullServiceDuration
        updatedAttrs.capacidad_diaria = parseInt(fullStock, 10) || 10
      }

      // Registro de cambio de precio en historial si se modificó o se ingresó nota
      if (numericPrice !== editingFullListing.price || priceChangeNote.trim()) {
        const nowIso = new Date().toISOString()
        const unitVal = fullPriceUnit.trim() || (fullType === 'service' ? 'servicio' : 'unidad')
        const fullHistory = priceHistoryList.length > 0
          ? priceHistoryList
          : (Array.isArray(editingFullListing.attrs?.price_history) && editingFullListing.attrs.price_history.length > 0
              ? editingFullListing.attrs.price_history
              : (editingFullListing.price !== null
                  ? [{
                      id: 'base-initial',
                      listing_id: editingFullListing.id,
                      price: editingFullListing.price,
                      price_unit: editingFullListing.price_unit || unitVal,
                      changed_at: editingFullListing.created_at || nowIso,
                      note: 'Precio inicial registrado',
                    }]
                  : []))

        const customNote = priceChangeNote.trim() || (numericPrice !== editingFullListing.price ? 'Ajuste de precio desde edición del artículo' : 'Confirmación de tarifa')

        const newHistEntry: PriceHistoryRecord = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hist-${Date.now()}`,
          listing_id: editingFullListing.id,
          price: numericPrice ?? 0,
          price_unit: unitVal,
          changed_at: nowIso,
          note: customNote,
        }

        updatedAttrs.price_history = [newHistEntry, ...fullHistory]
        updatedAttrs.last_price_update = nowIso

        try {
          await supabase.from('listing_price_history').insert({
            listing_id: editingFullListing.id,
            price: numericPrice ?? 0,
            price_unit: unitVal,
            note: customNote,
            changed_at: nowIso,
          })
        } catch (e) {}
      }

      // 1. Actualizar public.listing
      const { data: updatedListing, error: updateError } = await supabase
        .from('listing')
        .update({
          title: fullTitle.trim(),
          type: fullType,
          category_id: fullCategoryId,
          price: numericPrice,
          price_unit: fullPriceUnit.trim() || (fullType === 'service' ? 'servicio' : 'unidad'),
          stock: numericStock,
          city: fullCity.trim() || null,
          status: fullStatus,
          description: fullDescription.trim() || null,
          attrs: updatedAttrs,
        })
        .eq('id', editingFullListing.id)
        .select(`
          *,
          category:category_id(*),
          seller:seller_id(*),
          listing_media(*)
        `)
        .single()

      if (updateError) {
        console.error('Error actualizando artículo completo:', updateError)
        throw new Error(
          updateError.message ||
          'Error al guardar los cambios del artículo. Verifica los permisos de Supabase.'
        )
      }

      // 2. Sincronizar fotos en listing_media
      await supabase.from('listing_media').delete().eq('listing_id', editingFullListing.id)

      let updatedMedia: any[] = []
      if (fullMediaUrls.length > 0) {
        const mediaToInsert = fullMediaUrls.map((url, idx) => ({
          listing_id: editingFullListing.id,
          url,
          kind: 'image',
          position: idx,
        }))

        const { data: insertedMedia, error: mediaError } = await supabase
          .from('listing_media')
          .insert(mediaToInsert)
          .select('*')

        if (mediaError) {
          console.warn('Aviso sincronizando fotos del artículo:', mediaError)
        } else if (insertedMedia) {
          updatedMedia = insertedMedia
        }
      }

      // 3. Actualizar estado local
      const freshListingRecord: ListingWithRelations = {
        ...(updatedListing as ListingWithRelations),
        listing_media: updatedMedia.length > 0 ? updatedMedia : updatedListing.listing_media || [],
      }

      setListings((prev) =>
        prev.map((l) => (l.id === editingFullListing.id ? freshListingRecord : l))
      )

      setSuccessNotice(`¡Artículo "${fullTitle}" actualizado completamente con éxito!`)
      setEditingFullListing(null)
      setTimeout(() => setSuccessNotice(null), 4000)
    } catch (err: any) {
      console.error('Error modificando artículo completo:', err)
      setErrorNotice(err?.message || 'Error al modificar el artículo.')
    } finally {
      setSavingFullItem(false)
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
        <div className="space-y-5">
          {/* 🏷️ FILTRO RÁPIDO POR ESTADO DE PUBLICACIÓN */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-2">
              {locale === 'en' ? 'Listing Status:' : 'Estado de Publicación:'}
            </span>
            {[
              { id: 'all', label: locale === 'en' ? 'All' : 'Todos', count: listings.length, color: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' },
              { id: 'published', label: locale === 'en' ? '✓ En Catálogo' : '✓ En Catálogo', count: publishedCount, color: 'bg-emerald-600 text-white' },
              { id: 'pending', label: locale === 'en' ? '⏳ En Revisión' : '⏳ En Revisión', count: pendingCount, color: 'bg-amber-600 text-white' },
              { id: 'draft', label: locale === 'en' ? '📦 Borradores' : '📦 Borradores', count: draftCount, color: 'bg-blue-600 text-white' },
              { id: 'paused', label: locale === 'en' ? '⏸️ Pausados' : '⏸️ Pausados', count: pausedCount, color: 'bg-zinc-600 text-white' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id as any)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  statusFilter === st.id
                    ? `${st.color} shadow-xs font-black scale-102`
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
              >
                <span>{st.label}</span>
                <span className="rounded-full bg-black/15 dark:bg-white/20 px-1.5 py-0.2 text-[10px] font-extrabold">
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {/* 🌟 FILTRO MACRO GENERAL: PRODUCTOS NUEVOS VS ARTÍCULOS USADOS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setMacroTypeScope('all')
                  setSubFilter('all')
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                  macroTypeScope === 'all'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <span>🌐</span>
                <span>{locale === 'en' ? 'All Products' : 'Todos los Productos'}</span>
                <span className="rounded-full bg-zinc-200/80 dark:bg-zinc-700 px-1.5 py-0.2 text-[10px] font-bold">
                  {totalProducts + totalArticles}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMacroTypeScope('products')
                  setSubFilter('all')
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                  macroTypeScope === 'products'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400'
                }`}
              >
                <span>🛍️</span>
                <span>{t.inventory.macroScopeProducts || 'Productos (Nuevos)'}</span>
                <span className="rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 px-1.5 py-0.2 text-[10px] font-bold">
                  {totalProducts}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMacroTypeScope('articles')
                  setSubFilter('all')
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                  macroTypeScope === 'articles'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400'
                }`}
              >
                <span>📦</span>
                <span>{t.inventory.macroScopeArticles || 'Artículos (Usados)'}</span>
                <span className="rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-1.5 py-0.2 text-[10px] font-bold">
                  {totalArticles}
                </span>
              </button>
            </div>

            {/* Etiqueta descriptiva contextual */}
            <div className="flex items-center gap-2 px-2 text-xs">
              {macroTypeScope === 'products' && (
                <span className="flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-400">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Control de bodega, unidades nuevas en stock y reposición</span>
                </span>
              )}
              {macroTypeScope === 'articles' && (
                <span className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Control de artículos usados, segunda mano y piezas únicas</span>
                </span>
              )}
              {macroTypeScope === 'all' && (
                <span className="flex items-center gap-1.5 font-semibold text-zinc-600 dark:text-zinc-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Control de existencias físicas para productos nuevos y de segunda mano</span>
                </span>
              )}
            </div>
          </div>

          {/* 📊 TARJETAS DE RESUMEN RÁPIDO CONTEXTUALES */}
          {macroTypeScope === 'products' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-xs dark:border-blue-900/60 dark:bg-zinc-900">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  🛍️ {t.inventory.macroScopeProducts}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
                    {totalProducts}
                  </span>
                  <span className="text-xs text-blue-600/80">nuevos en catálogo</span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  🔢 {t.inventory.totalUnitsInStock}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                    {totalStockUnits}
                  </span>
                  <span className="text-xs text-zinc-400">en bodega</span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  ⚠️ {t.inventory.lowStock}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {lowStockCount}
                  </span>
                  <span className="text-xs text-amber-600/80">≤ 3 unidades</span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  🚫 {t.inventory.outOfStock}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-red-600 dark:text-red-400">
                    {outOfStockCount}
                  </span>
                  <span className="text-xs text-red-600/80">reposición</span>
                </div>
              </div>
            </div>
          )}

          {macroTypeScope === 'articles' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-xs dark:border-amber-900/60 dark:bg-zinc-900">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                  📦 {t.inventory.macroScopeArticles}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-300">
                    {totalArticles}
                  </span>
                  <span className="text-xs text-amber-600/80">usados en catálogo</span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  🔢 {t.inventory.totalUnitsInStock}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                    {totalArticleUnits}
                  </span>
                  <span className="text-xs text-zinc-400">disponibles</span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  ⚠️ {t.inventory.lowStock}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {lowArticleStockCount}
                  </span>
                  <span className="text-xs text-amber-600/80">≤ 3 unidades</span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  🚫 {t.inventory.outOfStock}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-red-600 dark:text-red-400">
                    {outOfArticleStockCount}
                  </span>
                  <span className="text-xs text-red-600/80">agotados</span>
                </div>
              </div>
            </div>
          )}

          {macroTypeScope === 'all' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  {locale === 'en' ? 'Total Products' : 'Total Productos'}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                    {listings.length}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {totalProducts} nuevos / {totalArticles} usados
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  📦 {t.inventory.totalUnitsInStock}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {totalStockUnits}
                  </span>
                  <span className="text-xs text-blue-600/80">en bodega</span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  🛍️ {locale === 'en' ? 'New Products' : 'Productos Nuevos'}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {totalProducts}
                  </span>
                  <span className="text-xs text-emerald-600/80">a estrenar</span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  ⚠️ {locale === 'en' ? 'Stock Alerts' : 'Alertas Stock'}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {lowStockCount + outOfStockCount}
                  </span>
                  <span className="text-xs text-amber-600/80">{lowStockCount} bajos / {outOfStockCount} agotados</span>
                </div>
              </div>
            </div>
          )}

          {/* 🔍 SUBFILTROS ESPECÍFICOS Y BUSCADOR */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-1.5">
              {macroTypeScope === 'products' && (
                <>
                  {[
                    { id: 'all', label: t.inventory.allFilter, count: totalProducts },
                    { id: 'in_stock', label: `${t.inventory.inStock} (>3)`, count: inStockCount },
                    { id: 'low_stock', label: `${t.inventory.lowStock} (≤3)`, count: lowStockCount },
                    { id: 'out_of_stock', label: t.inventory.outOfStock, count: outOfStockCount },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSubFilter(f.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        subFilter === f.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.2 text-[10px]">
                        {f.count}
                      </span>
                    </button>
                  ))}
                </>
              )}

              {macroTypeScope === 'articles' && (
                <>
                  {[
                    { id: 'all', label: t.inventory.allFilter, count: totalArticles },
                    { id: 'in_stock', label: `${t.inventory.inStock} (>3)`, count: inArticleStockCount },
                    { id: 'low_stock', label: `${t.inventory.lowStock} (≤3)`, count: lowArticleStockCount },
                    { id: 'out_of_stock', label: t.inventory.outOfStock, count: outOfArticleStockCount },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSubFilter(f.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        subFilter === f.id
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.2 text-[10px]">
                        {f.count}
                      </span>
                    </button>
                  ))}
                </>
              )}

              {macroTypeScope === 'all' && (
                <>
                  {[
                    { id: 'all', label: t.inventory.allFilter, count: listings.length },
                    { id: 'products', label: t.inventory.productsFilter, count: totalProducts },
                    { id: 'articles', label: t.inventory.articlesFilter, count: totalArticles },
                    { id: 'low_stock', label: t.inventory.lowStockFilter, count: lowStockCount + lowArticleStockCount },
                    { id: 'out_of_stock', label: t.inventory.outOfStockFilter, count: outOfStockCount + outOfArticleStockCount },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSubFilter(f.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        subFilter === f.id
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
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-60">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    macroTypeScope === 'services'
                      ? (locale === 'en' ? 'Search service, lead time...' : 'Buscar servicio, duración...')
                      : macroTypeScope === 'articles'
                      ? (locale === 'en' ? 'Search used article, status...' : 'Buscar artículo usado, estado...')
                      : macroTypeScope === 'products'
                      ? (locale === 'en' ? 'Search new product, code...' : 'Buscar producto nuevo, código...')
                      : (locale === 'en' ? 'Search items...' : 'Buscar publicaciones, código...')
                  }
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <button
                type="button"
                onClick={handleOpenNewItemModal}
                className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>➕</span>
                <span>{t.inventory.addNewItem}</span>
              </button>
            </div>
          </div>

          {/* Listado / Tabla de Artículos con Ajustes */}
          {filteredListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-4xl">
                {macroTypeScope === 'services' ? '🛠️' : macroTypeScope === 'articles' ? '📦' : '🛍️'}
              </span>
              <p className="mt-3 text-sm text-zinc-500">
                {macroTypeScope === 'services'
                  ? (locale === 'en' ? 'No services found matching the active filters.' : 'No se encontraron servicios con los filtros activos.')
                  : macroTypeScope === 'articles'
                  ? (locale === 'en' ? 'No used articles found matching the active filters.' : 'No se encontraron artículos usados con los filtros activos.')
                  : macroTypeScope === 'products'
                  ? (locale === 'en' ? 'No new products found matching the active filters.' : 'No se encontraron productos nuevos con los filtros activos.')
                  : t.inventory.noItems}
              </p>
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
                const serviceMod = item.attrs?.modalidad || item.attrs?.modality || 'Presencial'
                const serviceCap = item.stock ?? item.attrs?.capacidad_diaria ?? 10
                const serviceNotes = item.attrs?.notas_servicio || ''

                // Atributos para productos
                const condition = item.attrs?.condition || 'Nuevo'
                const deliveryMethod = item.attrs?.delivery_method || 'Entrega estándar / Envío'

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-xs transition-all dark:bg-zinc-900 ${
                      isService
                        ? 'border-purple-200/70 dark:border-purple-950/70 hover:border-purple-300'
                        : rawStock === 0
                        ? 'border-red-200 dark:border-red-950/60 bg-red-50/10'
                        : rawStock <= 3
                        ? 'border-amber-200 dark:border-amber-950/60'
                        : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Columna Izquierda: Imagen y Datos del Artículo */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 group">
                          <Link
                            href={`/catalogo/${item.id}`}
                            className="block h-full w-full relative"
                            title={locale === 'en' ? 'Click to view ad in catalog' : 'Clic para ver anuncio en catálogo'}
                          >
                            {coverImage ? (
                              <Image
                                src={coverImage}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                {isService ? '🛠️' : item.type === 'article' ? '📦' : '🛍️'}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                              👁️
                            </div>
                          </Link>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                isService
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                  : item.type === 'article'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {isService
                                ? '🛠️ Servicio'
                                : item.type === 'article'
                                ? '📦 Artículo (Usado)'
                                : '🛍️ Producto (Nuevo)'}
                            </span>
                            {item.category && (
                              <span className="text-[11px] text-zinc-400">
                                • {item.category.name}
                              </span>
                            )}
                            <span className="text-[11px] text-zinc-400">
                              • {item.city}
                            </span>
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                statusBadges[item.status]?.color || 'bg-zinc-100 text-zinc-600'
                              }`}
                            >
                              {statusBadges[item.status]?.label || item.status}
                            </span>
                          </div>

                          <div className="mt-1 flex items-baseline gap-1.5">
                            <Link
                              href={`/catalogo/${item.id}`}
                              className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate"
                              title={locale === 'en' ? 'Click to view public ad' : 'Clic para ver anuncio en el catálogo'}
                            >
                              {item.title}
                            </Link>
                            <span className="text-[10px] text-zinc-400 font-semibold shrink-0">↗</span>
                          </div>

                          {/* 🌟 CARACTERÍSTICAS ESPECÍFICAS SEGÚN TIPO */}
                          {isService ? (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80">
                                <span>⏱️</span>
                                <span>{t.inventory.executionDuration}: <strong>{serviceTime}</strong></span>
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
                                <span>⚡</span>
                                <span>{t.inventory.responseTimeLead}: <strong>{serviceLead}</strong></span>
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
                                <span>👥</span>
                                <span>{serviceCap} {locale === 'en' ? 'daily slots' : 'cupos/día'}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                <span>📍</span>
                                <span>{serviceMod}</span>
                              </span>
                              {serviceNotes && (
                                <p className="w-full text-[11px] text-zinc-500 italic mt-0.5">
                                  📝 {serviceNotes}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
                                <span>🏷️</span>
                                <span>{t.inventory.conditionLabel}: <strong>{condition}</strong></span>
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
                                <span>🚚</span>
                                <span>{t.inventory.deliveryMethodLabel}: <strong>{deliveryMethod}</strong></span>
                              </span>
                            </div>
                          )}

                          {/* Control y Visualización de Precio Maestro & Acciones de Publicación */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <div className="flex items-baseline gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                              <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                                🔒 Precio Maestro:
                              </span>
                              <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300">
                                ${Number(item.price || 0).toLocaleString('es-CO')} COP
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                / {item.price_unit || (isService ? 'servicio' : 'unidad')}
                              </span>
                            </div>

                            {/* 👁️ Ver Anuncio en 1 Clic */}
                            <Link
                              href={`/catalogo/${item.id}`}
                              className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900 transition-colors flex items-center gap-1 shadow-2xs shrink-0"
                              title={locale === 'en' ? 'Open ad in catalog' : 'Ver anuncio en el catálogo público'}
                            >
                              <span>👁️</span>
                              <span>{t.myListings.viewBtn || 'Ver Anuncio'}</span>
                              <span className="text-[10px]">↗</span>
                            </Link>

                            {/* 🔍 Vista Rápida Modal */}
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewItem(item)
                                setPreviewMediaIndex(0)
                              }}
                              className="rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-[11px] font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1 shadow-2xs shrink-0"
                              title={locale === 'en' ? 'Quick preview modal' : 'Vista rápida del anuncio sin salir de esta ventana'}
                            >
                              <span>🔍</span>
                              <span>{locale === 'en' ? 'Quick View' : 'Vista Rápida'}</span>
                            </button>

                            {/* 🚀 Promocionar (si está publicado) */}
                            {item.status === 'published' && (
                              <Link
                                href={`/promocionar?listing_id=${item.id}`}
                                className="rounded-lg bg-purple-600 hover:bg-purple-500 px-2.5 py-1 text-[11px] font-bold text-white transition-colors flex items-center gap-1 shadow-2xs shrink-0"
                                title={locale === 'en' ? 'Promote this listing' : 'Destacar este anuncio en campañas publicitarias'}
                              >
                                <span>🚀</span>
                                <span>{t.myListings.promoteBtn || 'Promocionar'}</span>
                              </Link>
                            )}

                            {/* 🛠️ Editar Artículo Completo */}
                            <button
                              type="button"
                              onClick={() => handleOpenFullEditModal(item)}
                              className="rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-800 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900 transition-colors flex items-center gap-1.5 shadow-2xs"
                              title="Modificar precio, existencias, fotos, especificaciones e historial del artículo"
                            >
                              <span>🛠️</span>
                              <span>{t.inventory.editItem}</span>
                              {Array.isArray(item.attrs?.price_history) && item.attrs.price_history.length > 1 && (
                                <span
                                  className="ml-0.5 rounded-full bg-purple-200/80 dark:bg-purple-800 px-1.5 py-0.2 text-[9px] font-extrabold text-purple-900 dark:text-purple-100"
                                  title={`${item.attrs.price_history.length} revisiones de precio registradas`}
                                >
                                  {item.attrs.price_history.length} rev.
                                </span>
                              )}
                            </button>

                            {/* Selector Rápido de Estado del Anuncio */}
                            <div className="flex items-center gap-1 shrink-0">
                              <select
                                value={item.status}
                                disabled={updatingStatusId === item.id}
                                onChange={(e) => handleQuickStatusChange(item, e.target.value as ListingStatus)}
                                className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
                                  item.status === 'published'
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : item.status === 'draft'
                                    ? 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                    : item.status === 'paused'
                                    ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}
                                title="Cambiar estado del anuncio rápidamente"
                              >
                                <option value="published">✓ En Catálogo</option>
                                <option value="draft">📦 Borrador</option>
                                <option value="paused">⏸️ Pausado</option>
                                <option value="submitted">⏳ En Revisión</option>
                                <option value="archived">📁 Archivado</option>
                              </select>
                              {updatingStatusId === item.id && (
                                <span className="text-[10px] animate-spin">⏳</span>
                              )}
                            </div>
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
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleOpenServiceModal(item)}
                              className="rounded-xl border border-purple-300 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-800 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:bg-purple-900 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                              title="Configurar duración, tiempo de respuesta y cupos diarios"
                            >
                              <span>⚙️</span>
                              <span>{t.inventory.editServiceTimes || 'Configurar Tiempos & Cupos'}</span>
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


      {/* MODAL 4: REGISTRAR NUEVO ARTÍCULO EN INVENTARIO */}
      {newItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 my-8">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">📦</span>
                <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-50">
                  {t.inventory.newItemTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNewItemModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-zinc-500">
              Registra un producto o servicio directamente en tu inventario con su precio base y existencias antes de publicarlo como anuncio.
            </p>

            <form onSubmit={handleCreateInventoryItem} className="mt-4 space-y-4">
              {/* Negocio emisor si hay más de 1 */}
              {sellers.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Negocio Propietario *
                  </label>
                  <select
                    value={newItemSellerId}
                    onChange={(e) => {
                      setNewItemSellerId(e.target.value)
                      const s = sellers.find((item) => item.id === e.target.value)
                      if (s?.city) setNewItemCity(s.city)
                    }}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.business_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tipo */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Tipo de Artículo *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'product', label: '🛍️ Producto (Nuevo)', unit: 'unidad' },
                    { id: 'article', label: '📦 Artículo (Usado)', unit: 'unidad' },
                  ].map((tOption) => (
                    <button
                      key={tOption.id}
                      type="button"
                      onClick={() => {
                        setNewItemType(tOption.id as ListingType)
                        setNewItemPriceUnit(tOption.unit)
                      }}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${
                        newItemType === tOption.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {tOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Título del Artículo *
                </label>
                <input
                  type="text"
                  required
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="Ej. Croissant de Almendras / Cambio de Aceite Sintético"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Categoría */}
              {categories && categories.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Categoría *
                  </label>
                  <select
                    value={newItemCategoryId}
                    onChange={(e) => setNewItemCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Precio y Unidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Precio Maestro ($ COP) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="Ej. 25000"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Unidad de Cobro
                  </label>
                  <input
                    type="text"
                    value={newItemPriceUnit}
                    onChange={(e) => setNewItemPriceUnit(e.target.value)}
                    placeholder="unidad, porción, hora..."
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Stock inicial o cupos diarios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    {newItemType === 'service' ? 'Cupos Diarios' : 'Stock Inicial'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    placeholder="10"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Ciudad de Ubicación
                  </label>
                  <input
                    type="text"
                    value={newItemCity}
                    onChange={(e) => setNewItemCity(e.target.value)}
                    placeholder="Ej. Bogotá"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Descripción breve */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  placeholder="Detalles del producto o servicio para el inventario..."
                  className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Acciones */}
              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={creatingItem}
                  onClick={() => setNewItemModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={creatingItem}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {creatingItem ? 'Registrando...' : 'Guardar en Inventario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 5: MODIFICAR ARTÍCULO COMPLETO DE INVENTARIO */}
      {editingFullListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold text-lg dark:bg-purple-950 dark:text-purple-300">
                  🛠️
                </span>
                <div>
                  <h3 className="font-black text-base text-zinc-900 dark:text-zinc-50">
                    {t.inventory.editItemModalTitle}
                  </h3>
                  <span className="text-[11px] text-zinc-400">
                    ID: {editingFullListing.id.slice(0, 8)}... • Sincronización en tiempo real
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingFullListing(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
              Modifica cualquier aspecto de este artículo generado (título, precio, existencias, fotos, estado y especificaciones). Los cambios se reflejarán tanto en el inventario como en el catálogo público.
            </p>

            <form onSubmit={handleSaveFullItem} className="mt-5 space-y-5">
              {/* Bloque 1: Título y Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Título del Artículo *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullTitle}
                    onChange={(e) => setFullTitle(e.target.value)}
                    placeholder="Ej. Croissant de Almendras / Cambio de Aceite Sintético"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Tipo de Publicación
                  </label>
                  {fullType === 'product' && (
                    <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs font-bold text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                      <span>🛍️</span>
                      <span>Producto (Nuevo)</span>
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider bg-blue-200/60 dark:bg-blue-900/60 px-1.5 py-0.5 rounded text-blue-900 dark:text-blue-200">
                        Fijo / Clasificado
                      </span>
                    </div>
                  )}
                  {fullType === 'article' && (
                    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs font-bold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                      <span>📦</span>
                      <span>Artículo (Usado)</span>
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-200">
                        Fijo / Clasificado
                      </span>
                    </div>
                  )}
                  {fullType === 'service' && (
                    <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50/80 px-3 py-2 text-xs font-bold text-purple-800 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300">
                      <span>🛠️</span>
                      <span>Servicio</span>
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider bg-purple-200/60 dark:bg-purple-900/60 px-1.5 py-0.5 rounded text-purple-900 dark:text-purple-200">
                        Fijo / Clasificado
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bloque 2: Categoría y Estado del Artículo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories && categories.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                      Categoría
                    </label>
                    <select
                      value={fullCategoryId}
                      onChange={(e) => setFullCategoryId(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Estado en el Marketplace
                  </label>
                  <select
                    value={fullStatus}
                    onChange={(e) => setFullStatus(e.target.value as ListingStatus)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="published">✓ Publicado (En Catálogo Público)</option>
                    <option value="draft">📦 Borrador (Solo en Inventario)</option>
                    <option value="submitted">⏳ En Revisión (Moderación)</option>
                    <option value="paused">⏸️ Pausado (Oculto temporalmente)</option>
                    <option value="archived">📁 Archivado</option>
                  </select>
                </div>
              </div>

              {/* Bloque 3: Precio Maestro, Unidad, Stock, Ciudad e Historial de Precios */}
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 dark:bg-zinc-800/40 dark:border-zinc-800 space-y-3.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                      Precio ($ COP) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={fullPrice}
                      onChange={(e) => setFullPrice(e.target.value)}
                      placeholder="Ej. 35000"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-black text-emerald-600 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                      Unidad Cobro
                    </label>
                    <input
                      type="text"
                      value={fullPriceUnit}
                      onChange={(e) => setFullPriceUnit(e.target.value)}
                      placeholder="unidad, kg, hora..."
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                      {fullType === 'service' ? 'Cupos/Día' : 'Stock'} *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={fullStock}
                      onChange={(e) => setFullStock(e.target.value)}
                      placeholder="10"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-black text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={fullCity}
                      onChange={(e) => setFullCity(e.target.value)}
                      placeholder="Ej. Bogotá"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                {/* Subsección: Modificar Precio e Historial (Trasladado dentro de Modificar Artículo) */}
                <div className="pt-3 border-t border-zinc-200/70 dark:border-zinc-700/70">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📜</span>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                          {t.inventory.priceHistoryTitle}
                        </h4>
                        <p className="text-[10px] text-zinc-500">
                          {t.inventory.priceHistorySubtitle}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPriceHistoryInFullEdit(!showPriceHistoryInFullEdit)}
                      className="rounded-lg border border-purple-200 bg-purple-50/70 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <span>{showPriceHistoryInFullEdit ? '▲ Ocultar Historial' : '▼ Ver Historial de Precios'}</span>
                      <span className="rounded-full bg-purple-200 dark:bg-purple-800 px-1.5 py-0.2 text-[9px] font-extrabold text-purple-900 dark:text-purple-100">
                        {priceHistoryList.length}
                      </span>
                    </button>
                  </div>

                  {/* Input opcional para motivo/nota si se modifica el precio */}
                  <div className="mb-2.5">
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                      {t.inventory.priceHistoryNoteLabel}
                    </label>
                    <input
                      type="text"
                      value={priceChangeNote}
                      onChange={(e) => setPriceChangeNote(e.target.value)}
                      placeholder={t.inventory.priceHistoryNotePlaceholder}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  {/* Lista de precios históricos desplegable */}
                  {showPriceHistoryInFullEdit && (
                    <div className="max-h-52 overflow-y-auto space-y-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/60 p-2.5 mt-2">
                      {priceHistoryList.length === 0 ? (
                        <div className="py-4 text-center text-xs text-zinc-500">
                          {t.inventory.priceHistoryEmpty}
                        </div>
                      ) : (
                        priceHistoryList.map((hist, idx) => {
                          const isCurrent = idx === 0
                          const prevHist = idx < priceHistoryList.length - 1 ? priceHistoryList[idx + 1] : null
                          const diff = prevHist ? hist.price - prevHist.price : 0
                          const diffPct = prevHist && prevHist.price > 0 ? ((diff / prevHist.price) * 100).toFixed(1) : null

                          return (
                            <div
                              key={hist.id || `${hist.changed_at}-${idx}`}
                              className={`rounded-lg border p-2.5 transition-all text-xs ${
                                isCurrent
                                  ? 'border-emerald-300 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                                  : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/40'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-zinc-900 dark:text-zinc-50 text-xs">
                                      $ {hist.price.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')} COP
                                    </span>
                                    <span className="text-[11px] text-zinc-500">
                                      / {hist.price_unit || 'unidad'}
                                    </span>
                                    {isCurrent ? (
                                      <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 px-1.5 py-0.2 text-[9px] font-bold">
                                        ● {t.inventory.priceHistoryCurrentBadge}
                                      </span>
                                    ) : (
                                      <span className="rounded-full bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 px-1.5 py-0.2 text-[9px] font-medium">
                                        {t.inventory.priceHistoryPreviousBadge}
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                                    {prevHist ? (
                                      diff > 0 ? (
                                        <span className="font-bold text-amber-600 dark:text-amber-400">
                                          🔺 +${diff.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')} (+{diffPct}%)
                                        </span>
                                      ) : diff < 0 ? (
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                          🔻 -${Math.abs(diff).toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')} ({diffPct}%)
                                        </span>
                                      ) : (
                                        <span className="text-zinc-500 font-medium">
                                          🏷️ Sin variación
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-zinc-500 font-medium">
                                        🏷️ Tarifa base inicial
                                      </span>
                                    )}

                                    <span className="text-zinc-400">•</span>

                                    <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
                                      <span>📅</span>
                                      <span>
                                        {new Date(hist.changed_at).toLocaleString(
                                          locale === 'en' ? 'en-US' : 'es-CO',
                                          {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          }
                                        )}
                                      </span>
                                    </span>
                                  </div>

                                  {hist.note && (
                                    <p className="mt-1 text-[10px] italic text-zinc-600 dark:text-zinc-300">
                                      💬 &quot;{hist.note}&quot;
                                    </p>
                                  )}
                                </div>

                                {!isCurrent && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFullPrice(String(hist.price))
                                      if (hist.price_unit) setFullPriceUnit(hist.price_unit)
                                      setPriceChangeNote(`Reaplicación de tarifa de ${new Date(hist.changed_at).toLocaleDateString()}`)
                                    }}
                                    className="shrink-0 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-zinc-700 transition-colors"
                                    title="Cargar esta tarifa anterior en el precio del artículo"
                                  >
                                    ↺ {t.inventory.priceHistoryRestore}
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bloque 4: Atributos según Tipo */}
              {fullType === 'service' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                      ⏱️ Tiempo / Duración Estimada
                    </label>
                    <input
                      type="text"
                      value={fullServiceDuration}
                      onChange={(e) => setFullServiceDuration(e.target.value)}
                      placeholder="Ej. 45 min / 2 horas"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                      Modalidad de Atención
                    </label>
                    <select
                      value={fullModality}
                      onChange={(e) => setFullModality(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="Presencial">Presencial en local / consultorio</option>
                      <option value="A domicilio">A domicilio / en sitio</option>
                      <option value="Virtual / Remoto">Virtual / Remoto por videollamada</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fullType === 'product' && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                        Condición del Producto
                      </label>
                      <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs font-semibold text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                        <span>✨</span>
                        <span>Nuevo (A estrenar / De fábrica)</span>
                      </div>
                    </div>
                  )}

                  {fullType === 'article' && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                        Estado de Conservación (Artículo Usado)
                      </label>
                      <select
                        value={fullCondition}
                        onChange={(e) => setFullCondition(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      >
                        <option value="Usado - Como nuevo">Usado - Como nuevo</option>
                        <option value="Usado - Buen estado">Usado - Buen estado</option>
                        <option value="Usado - Aceptable">Usado - Aceptable</option>
                        <option value="Reacondicionado">Reacondicionado / Restaurado</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                      Método de Entrega
                    </label>
                    <select
                      value={fullDeliveryMethod}
                      onChange={(e) => setFullDeliveryMethod(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="Domicilio local">Domicilio local</option>
                      <option value="Envío nacional">Envío nacional</option>
                      <option value="Retiro en punto de venta">Retiro en punto de venta</option>
                      <option value="A convenir">A convenir</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Bloque 5: Descripción */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Descripción Detallada
                </label>
                <textarea
                  rows={3}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Detalles, materiales, modo de uso o especificaciones..."
                  className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Bloque 6: Fotos e Imágenes */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Fotos e Imágenes ({fullMediaUrls.length})
                </label>

                {fullMediaUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mb-2.5 p-3 rounded-2xl bg-zinc-50 border border-zinc-200 dark:bg-zinc-800/40 dark:border-zinc-800">
                    {fullMediaUrls.map((url, idx) => (
                      <div key={idx} className="relative group h-16 w-16 rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFullMediaUrl(idx)}
                          className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Eliminar foto"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={fullNewImageUrl}
                    onChange={(e) => setFullNewImageUrl(e.target.value)}
                    placeholder="Pegar URL de foto (ej. https://images.unsplash.com/...)"
                    className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddFullMediaUrl}
                    className="rounded-xl border border-zinc-300 bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-colors shrink-0"
                  >
                    + Añadir Foto
                  </button>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={savingFullItem}
                  onClick={() => setEditingFullListing(null)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={savingFullItem}
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <span>{savingFullItem ? 'Guardando cambios...' : 'Guardar Cambios del Artículo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: VISTA RÁPIDA INTERACTIVA DE PUBLICACIÓN */}
      {/* ============================================================= */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-h-[92vh] overflow-y-auto">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{previewItem.type === 'service' ? '⏱️' : '📦'}</span>
                <div>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                    {locale === 'en' ? 'Quick Listing Preview' : 'Vista Previa de la Publicación'}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    ID: <code className="font-mono text-zinc-400">{previewItem.id.slice(0, 8)}...</code> • {previewItem.category?.name || 'Categoría'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-black uppercase tracking-wider ${
                    statusBadges[previewItem.status]?.color || 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {statusBadges[previewItem.status]?.label || previewItem.status}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenido en dos columnas */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna Izquierda: Galería de Fotos y Negocio */}
              <div className="space-y-3">
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  {previewItem.listing_media && previewItem.listing_media.length > 0 ? (
                    <Image
                      src={previewItem.listing_media[previewMediaIndex]?.url || previewItem.listing_media[0].url}
                      alt={previewItem.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">
                      {previewItem.type === 'service' ? '🛠️' : previewItem.type === 'article' ? '📦' : '🛍️'}
                    </div>
                  )}
                </div>

                {/* Tira de miniaturas si tiene más de 1 imagen */}
                {previewItem.listing_media && previewItem.listing_media.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {previewItem.listing_media.map((med, idx) => (
                      <button
                        key={med.id || idx}
                        type="button"
                        onClick={() => setPreviewMediaIndex(idx)}
                        className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                          previewMediaIndex === idx
                            ? 'border-emerald-600 scale-105'
                            : 'border-zinc-200 dark:border-zinc-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image src={med.url} alt="" fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Ficha del Negocio / Vendedor */}
                {previewItem.seller && (
                  <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-3.5 border border-zinc-200/80 dark:border-zinc-700/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        🏪 {previewItem.seller.business_name}
                      </span>
                      {previewItem.seller.verified && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          ✓ Verificado
                        </span>
                      )}
                    </div>
                    {previewItem.seller.whatsapp_phone && (
                      <p className="text-zinc-500 text-[11px]">
                        WhatsApp: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{previewItem.seller.whatsapp_phone}</span>
                      </p>
                    )}
                    {previewItem.seller.city && (
                      <p className="text-zinc-500 text-[11px]">
                        Ubicación: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{previewItem.seller.city}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Columna Derecha: Datos de la Publicación */}
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                    {previewItem.title}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      ${Number(previewItem.price || 0).toLocaleString('es-CO')} COP
                    </span>
                    <span className="text-zinc-500 font-semibold">
                      / {previewItem.price_unit || (previewItem.type === 'service' ? 'servicio' : 'unidad')}
                    </span>
                  </div>
                </div>

                {/* Descripción */}
                <div className="space-y-1">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300 block">
                    {locale === 'en' ? 'Description' : 'Descripción'}
                  </span>
                  <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 p-3 text-zinc-600 dark:text-zinc-400 leading-relaxed text-xs max-h-36 overflow-y-auto">
                    {previewItem.description || (locale === 'en' ? 'No description registered.' : 'Sin descripción registrada.')}
                  </div>
                </div>

                {/* Atributos Específicos según Tipo */}
                <div className="space-y-2">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300 block">
                    {previewItem.type === 'service' ? 'Detalles del Servicio' : 'Especificaciones de Inventario'}
                  </span>
                  {previewItem.type === 'service' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-2.5">
                        <span className="text-[10px] text-zinc-400 block">Duración Estimada</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {previewItem.attrs?.tiempo_estimado || previewItem.attrs?.duracion || '45 min'}
                        </span>
                      </div>
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-2.5">
                        <span className="text-[10px] text-zinc-400 block">Tiempo de Respuesta</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {previewItem.attrs?.tiempo_entrega || previewItem.attrs?.disponibilidad || 'Mismo día'}
                        </span>
                      </div>
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-2.5">
                        <span className="text-[10px] text-zinc-400 block">Cupos Diarios</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {previewItem.stock ?? previewItem.attrs?.capacidad_diaria ?? 10}
                        </span>
                      </div>
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-2.5">
                        <span className="text-[10px] text-zinc-400 block">Modalidad</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {previewItem.attrs?.modalidad || 'Presencial'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-2.5">
                        <span className="text-[10px] text-zinc-400 block">Stock en Bodega</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {previewItem.stock ?? 0} unidades
                        </span>
                      </div>
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-2.5">
                        <span className="text-[10px] text-zinc-400 block">Condición</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {previewItem.attrs?.condition || 'Nuevo'}
                        </span>
                      </div>
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-2.5 col-span-2">
                        <span className="text-[10px] text-zinc-400 block">Método de Entrega</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {previewItem.attrs?.delivery_method || 'Entrega estándar / Envío'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Barra de Acciones del Modal */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Link
                  href={`/catalogo/${previewItem.id}`}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors flex items-center gap-1.5"
                >
                  <span>👁️</span>
                  <span>{locale === 'en' ? 'Open in Public Catalog' : 'Abrir en Catálogo Público'}</span>
                  <span>↗</span>
                </Link>

                {previewItem.status === 'published' && (
                  <Link
                    href={`/promocionar?listing_id=${previewItem.id}`}
                    className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition-colors flex items-center gap-1.5"
                  >
                    <span>🚀</span>
                    <span>{t.myListings.promoteBtn || 'Promocionar Anuncio'}</span>
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const itemToEdit = previewItem
                    setPreviewItem(null)
                    handleOpenFullEditModal(itemToEdit)
                  }}
                  className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                >
                  <span>🛠️</span>
                  <span>{locale === 'en' ? 'Edit Listing' : 'Editar Publicación'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="rounded-xl bg-zinc-200 dark:bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  {t.common.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
