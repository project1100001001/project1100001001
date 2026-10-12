'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category, ListingType, ListingWithRelations, Seller } from '@/lib/types'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

interface ListingFormProps {
  categories: Category[]
  existingListing?: any
}

export default function ListingForm({ categories }: ListingFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialInventoryParam = searchParams ? searchParams.get('inventory_id') || '' : ''
  const initialTypeParam = searchParams ? (searchParams.get('type') as ListingType) || '' : ''
  const initialEditIdParam = searchParams ? searchParams.get('edit_id') || searchParams.get('edit') || '' : ''
  const supabase = createClient()
  const { t, locale } = useTranslation()

  // Auth & Seller state
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [sellers, setSellers] = useState<Seller[]>([])
  const [selectedSellerId, setSelectedSellerId] = useState<string>('')

  // Inventory Integration state (prioridad módulo de inventario)
  const [inventoryListings, setInventoryListings] = useState<ListingWithRelations[]>([])
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>(initialInventoryParam || initialEditIdParam)
  const [inventoryItemData, setInventoryItemData] = useState<ListingWithRelations | null>(null)
  const [inventoryPriceConfirmed, setInventoryPriceConfirmed] = useState<boolean>(true)
  const [matchedInventorySuggestion, setMatchedInventorySuggestion] = useState<ListingWithRelations | null>(null)
  
  // New seller registration state (if user has no seller profile yet)
  const [showSellerSetup, setShowSellerSetup] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [businessCity, setBusinessCity] = useState('')
  const [businessWhatsapp, setBusinessWhatsapp] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [creatingSeller, setCreatingSeller] = useState(false)
  const [sellerError, setSellerError] = useState<string | null>(null)

  // Listing Form fields
  const [type, setType] = useState<ListingType>(() => {
    if (initialTypeParam === 'product' || initialTypeParam === 'article' || initialTypeParam === 'service') {
      return initialTypeParam
    }
    return 'product'
  })
  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priceType, setPriceType] = useState<'fixed' | 'quote'>('fixed')
  const [price, setPrice] = useState<string>('')
  const [priceUnit, setPriceUnit] = useState(() => (initialTypeParam === 'service' ? 'servicio' : 'unidad'))
  const [city, setCity] = useState('')
  const [stock, setStock] = useState<string>('1')

  // Dynamic attributes (attrs jsonb)
  const [condition, setCondition] = useState(() => (initialTypeParam === 'article' ? 'Usado - Buen estado' : 'Nuevo'))
  const [modality, setModality] = useState('Presencial')
  const [deliveryMethod, setDeliveryMethod] = useState('Domicilio local')
  const [customAttrs, setCustomAttrs] = useState<{ key: string; value: string }[]>([])
  const [newAttrKey, setNewAttrKey] = useState('')
  const [newAttrVal, setNewAttrVal] = useState('')

  // Media (listing_media)
  const [listingId, setListingId] = useState<string>(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0
          const v = c === 'x' ? r : (r & 0x3) | 0x8
          return v.toString(16)
        })
  )
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  // Status & Submit
  const isLockedType = Boolean(selectedInventoryId || initialInventoryParam || initialEditIdParam)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<{ id: string; status: string } | null>(null)

  // Load user and sellers
  useEffect(() => {
    async function initUserAndSeller() {
      setLoadingAuth(true)
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (user) {
        // Fetch seller records owned by user
        const { data: sellerData, error } = await supabase
          .from('seller')
          .select('*')
          .eq('owner_user_id', user.id)

        if (!error && sellerData && sellerData.length > 0) {
          setSellers(sellerData as Seller[])
          setSelectedSellerId(sellerData[0].id)
          setCity(sellerData[0].city || '')
          setShowSellerSetup(false)
        } else {
          // El usuario no tiene perfil de vendedor aún, mostrar formulario de configuración
          setShowSellerSetup(true)
        }
      }
      setLoadingAuth(false)
    }

    initUserAndSeller()
  }, [supabase])

  // Cargar inventario del vendedor seleccionado para sincronización prioritaria
  useEffect(() => {
    async function loadSellerInventory() {
      if (!selectedSellerId) return
      setLoadingInventory(true)
      try {
        const { data, error } = await supabase
          .from('listing')
          .select(`
            *,
            category:category_id(*),
            listing_media(*)
          `)
          .eq('seller_id', selectedSellerId)
          .order('created_at', { ascending: false })

        if (!error && data) {
          const inv = data as ListingWithRelations[]
          setInventoryListings(inv)

          const targetId = selectedInventoryId || initialInventoryParam || initialEditIdParam
          if (targetId) {
            const found = inv.find((item) => item.id === targetId)
            if (found) {
              applyInventoryItem(found)
            }
          }
        }
      } catch (err: any) {
        console.warn('Error cargando inventario en formulario:', err)
      } finally {
        setLoadingInventory(false)
      }
    }

    loadSellerInventory()
  }, [selectedSellerId, supabase, initialInventoryParam, initialEditIdParam])

  const applyInventoryItem = (item: ListingWithRelations) => {
    setSelectedInventoryId(item.id)
    setInventoryItemData(item)
    setListingId(item.id)
    setTitle(item.title || '')
    setType(item.type)
    if (item.category_id) {
      setCategoryId(item.category_id)
    }
    setPrice(item.price !== null && item.price !== undefined ? String(item.price) : '')
    setPriceUnit(item.price_unit || (item.type === 'service' ? 'servicio' : 'unidad'))
    setPriceType(item.price !== null ? 'fixed' : 'quote')
    setStock(item.stock !== null && item.stock !== undefined ? String(item.stock) : '1')
    setCity(item.city || '')
    setDescription(item.description || '')
    setInventoryPriceConfirmed(true)

    // Medios
    if (item.listing_media && item.listing_media.length > 0) {
      setMediaUrls(item.listing_media.map((m) => m.url))
    }

    // Atributos dinámicos
    if (item.type === 'product') {
      setCondition('Nuevo')
    } else if (item.type === 'article') {
      setCondition(item.attrs?.condition || 'Usado - Buen estado')
    }
    if (item.attrs) {
      if (item.attrs.modality || item.attrs.modalidad) setModality(item.attrs.modality || item.attrs.modalidad)
      if (item.attrs.delivery_method) setDeliveryMethod(item.attrs.delivery_method)
    }
  }

  const handleSelectInventoryItem = (id: string) => {
    if (!id || id === 'new') {
      setSelectedInventoryId('')
      setInventoryItemData(null)
      setInventoryPriceConfirmed(false)
      return
    }
    const found = inventoryListings.find((item) => item.id === id)
    if (found) {
      applyInventoryItem(found)
    }
  }

  // Detección de artículo existente en inventario mientras el vendedor escribe el título
  useEffect(() => {
    if (selectedInventoryId) {
      setMatchedInventorySuggestion(null)
      return
    }
    const clean = title.trim().toLowerCase()
    if (clean.length >= 3 && inventoryListings.length > 0) {
      const match = inventoryListings.find(
        (inv) => inv.title && inv.title.toLowerCase().includes(clean)
      )
      setMatchedInventorySuggestion(match || null)
    } else {
      setMatchedInventorySuggestion(null)
    }
  }, [title, selectedInventoryId, inventoryListings])

  // Select initial category matching type
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      const matching = categories.find(
        (c) => c.applies_to === 'both' || c.applies_to === (type === 'article' ? 'product' : type)
      )
      if (matching) {
        setCategoryId(matching.id)
      } else {
        setCategoryId(categories[0].id)
      }
    }
  }, [type, categories, categoryId])

  // Filter categories by selected listing type
  const filteredCategories = categories.filter((cat) => {
    if (cat.applies_to === 'both') return true
    if (type === 'product' || type === 'article') return cat.applies_to === 'product'
    if (type === 'service') return cat.applies_to === 'service'
    return true
  })

  // Create Seller Profile
  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    setCreatingSeller(true)
    setSellerError(null)

    try {
      const { data, error } = await supabase
        .from('seller')
        .insert({
          owner_user_id: currentUser.id,
          business_name: businessName,
          city: businessCity,
          whatsapp: businessWhatsapp,
          phone: businessPhone || businessWhatsapp,
          business_type: type === 'service' ? 'Servicios' : 'Comercio',
        })
        .select()
        .single()

      if (error) throw error

      setSellers([data as Seller])
      setSelectedSellerId(data.id)
      if (data.city) setCity(data.city)
      setShowSellerSetup(false)
    } catch (err: any) {
      setSellerError(err.message || 'Error al crear el perfil de vendedor')
    } finally {
      setCreatingSeller(false)
    }
  }

  // Handle adding image URL
  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim()
    if (!trimmed) return
    if (!mediaUrls.includes(trimmed)) {
      setMediaUrls([...mediaUrls, trimmed])
      setNewImageUrl('')
    }
  }

  // Handle image file upload to Supabase Storage if available
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (!currentUser) return

    setUploadingImage(true)
    setErrorMsg(null)

    try {
      const uploaded: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const filePath = `${currentUser.id}/${listingId}/${cleanFileName}`

        const { data, error } = await supabase.storage
          .from('listings')
          .upload(filePath, file, { upsert: true })

        if (error) {
          // If storage bucket isn't set up yet, fallback message
          console.warn('Storage upload note:', error.message)
          throw new Error(
            `El bucket de almacenamiento 'listings' de Supabase aún no está listo o configurado públicamente (${error.message}). Puedes ingresar la URL directa de la foto abajo.`
          )
        }

        const { data: urlData } = supabase.storage
          .from('listings')
          .getPublicUrl(data.path)

        if (urlData?.publicUrl) {
          uploaded.push(urlData.publicUrl)
        }
      }

      setMediaUrls([...mediaUrls, ...uploaded])
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setUploadingImage(false)
      // reset file input
      e.target.value = ''
    }
  }

  const handleRemoveMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index))
  }

  const handleAddCustomAttr = () => {
    if (!newAttrKey.trim() || !newAttrVal.trim()) return
    setCustomAttrs([...customAttrs, { key: newAttrKey.trim(), value: newAttrVal.trim() }])
    setNewAttrKey('')
    setNewAttrVal('')
  }

  const handleRemoveCustomAttr = (index: number) => {
    setCustomAttrs(customAttrs.filter((_, i) => i !== index))
  }

  // Submit Listing
  const handleSubmitListing = async (targetStatus: 'draft' | 'submitted') => {
    setErrorMsg(null)

    if (!currentUser) {
      setErrorMsg('Debes iniciar sesión para publicar.')
      return
    }

    if (!selectedSellerId) {
      setErrorMsg('Debes tener un perfil de vendedor seleccionado para publicar.')
      return
    }

    if (!title.trim()) {
      setErrorMsg('El título de la publicación es obligatorio.')
      return
    }

    if (!categoryId) {
      setErrorMsg('Debes seleccionar una categoría.')
      return
    }

    setSubmitting(true)

    try {
      // Build attrs jsonb
      const attrsObj: Record<string, any> = {}
      if (type === 'product') {
        attrsObj.condition = 'Nuevo'
        attrsObj.delivery_method = deliveryMethod
      } else if (type === 'service') {
        attrsObj.modality = modality
      } else if (type === 'article') {
        attrsObj.condition = condition.includes('Usado') || condition.includes('Reacondicionado') ? condition : 'Usado - Buen estado'
        attrsObj.delivery_method = deliveryMethod
      }

      customAttrs.forEach((attr) => {
        attrsObj[attr.key] = attr.value
      })

      const numericPrice = priceType === 'fixed' && price ? parseInt(price, 10) : null
      const numericStock = type === 'service' ? null : stock ? parseInt(stock, 10) : null

      let listingData: any = null

      if (selectedInventoryId) {
        // Actualizar artículo existente de inventario y confirmar publicación
        const { data: updatedData, error: updateError } = await supabase
          .from('listing')
          .update({
            category_id: categoryId,
            type,
            title: title.trim(),
            description: description.trim() || null,
            price: numericPrice,
            price_unit: priceType === 'fixed' ? priceUnit : null,
            city: city.trim() || null,
            status: targetStatus,
            stock: numericStock,
            attrs: attrsObj,
          })
          .eq('id', selectedInventoryId)
          .select()
          .single()

        if (updateError) throw updateError
        listingData = updatedData

        // Reemplazar fotos si hay urls
        if (mediaUrls.length > 0 && listingData?.id) {
          await supabase.from('listing_media').delete().eq('listing_id', listingData.id)
          const mediaToInsert = mediaUrls.map((url, idx) => ({
            listing_id: listingData.id,
            url,
            kind: 'image',
            position: idx,
          }))
          await supabase.from('listing_media').insert(mediaToInsert)
        }
      } else {
        // 1. Insert into public.listing (se añade de inmediato al inventario maestro)
        const { data: insertedData, error: listingError } = await supabase
          .from('listing')
          .insert({
            id: listingId,
            seller_id: selectedSellerId,
            category_id: categoryId,
            type,
            title: title.trim(),
            description: description.trim() || null,
            price: numericPrice,
            price_unit: priceType === 'fixed' ? priceUnit : null,
            city: city.trim() || null,
            status: targetStatus,
            stock: numericStock,
            attrs: attrsObj,
          })
          .select()
          .single()

        if (listingError) throw listingError
        listingData = insertedData

        // 2. Insert media items if any
        if (mediaUrls.length > 0 && listingData?.id) {
          const mediaToInsert = mediaUrls.map((url, idx) => ({
            listing_id: listingData.id,
            url,
            kind: 'image',
            position: idx,
          }))

          const { error: mediaError } = await supabase
            .from('listing_media')
            .insert(mediaToInsert)

          if (mediaError) {
            console.error('Error guardando fotos:', mediaError)
          }
        }
      }

      setSuccessInfo({ id: listingData.id, status: targetStatus })
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la publicación')
    } finally {
      setSubmitting(false)
    }
  }

  // If loading auth state
  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex items-center gap-3 text-zinc-500">
          <svg className="animate-spin h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Verificando sesión...</span>
        </div>
      </div>
    )
  }

  // If user is not authenticated
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto my-12 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Inicia sesión para publicar
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Para publicar productos o servicios y asociarlos a tu negocio, necesitas estar autenticado.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/login?redirectTo=/publicar"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/catalogo"
            className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            Ver catálogo primero
          </Link>
        </div>
      </div>
    )
  }

  // If user needs to create seller profile first
  if (showSellerSetup) {
    return (
      <div className="max-w-xl mx-auto my-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Crea tu perfil de negocio o vendedor
            </h2>
            <p className="text-xs text-zinc-500">
              Es necesario registrar los datos de contacto de tu negocio para que los compradores puedan encontrarte.
            </p>
          </div>
        </div>

        {sellerError && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {sellerError}
          </div>
        )}

        <form onSubmit={handleCreateSeller} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nombre de tu Negocio / Emprendimiento / Marca *
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ej. Arepas La Esquina / Consultorías TIC"
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Ciudad base
              </label>
              <input
                type="text"
                value={businessCity}
                onChange={(e) => setBusinessCity(e.target.value)}
                placeholder="Ej. Bogotá, Medellín, Cali..."
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                WhatsApp de contacto *
              </label>
              <input
                type="text"
                required
                value={businessWhatsapp}
                onChange={(e) => setBusinessWhatsapp(e.target.value)}
                placeholder="Ej. 573001234567"
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Teléfono alternativo (opcional)
            </label>
            <input
              type="text"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              placeholder="Ej. 6012345678"
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <button
            type="submit"
            disabled={creatingSeller}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            {creatingSeller ? 'Guardando negocio...' : 'Guardar negocio y continuar'}
          </button>
        </form>
      </div>
    )
  }

  // If successfully published/drafted
  if (successInfo) {
    return (
      <div className="max-w-xl mx-auto my-12 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {successInfo.status === 'submitted'
            ? '¡Publicación enviada para revisión!'
            : '¡Borrador guardado exitosamente!'}
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {successInfo.status === 'submitted'
            ? 'Tu anuncio está en estado "En revisión" (submitted). Cuando sea aprobado por el equipo de moderación, aparecerá en el catálogo público.'
            : 'Tu publicación ha quedado en borrador. Podrás editarla y publicarla cuando desees desde tu panel.'}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href={`/catalogo/${successInfo.id}`}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            Ver vista previa del anuncio
          </Link>
          <Link
            href="/mis-publicaciones"
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900 transition-colors"
          >
            📦 Mis Publicaciones & Inventario
          </Link>
          <button
            onClick={() => {
              setSuccessInfo(null)
              setListingId(
                typeof crypto !== 'undefined' && crypto.randomUUID
                  ? crypto.randomUUID()
                  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                      const r = (Math.random() * 16) | 0
                      const v = c === 'x' ? r : (r & 0x3) | 0x8
                      return v.toString(16)
                    })
              )
              setTitle('')
              setDescription('')
              setPrice('')
              setMediaUrls([])
              setCustomAttrs([])
            }}
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400"
          >
            Publicar otro anuncio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {locale === 'en' ? 'Post a New Listing' : 'Publicar nuevo anuncio'}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {locale === 'en'
            ? 'Complete your product, service, or item details for the marketplace catalog.'
            : 'Completa la información de tu producto, servicio o artículo para el catálogo del marketplace.'}
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900">
          {errorMsg}
        </div>
      )}

      {/* Seller selector banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 font-semibold text-xs dark:bg-emerald-500/20 dark:text-emerald-400">
            🏢
          </span>
          <div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">
              Negocio / Vendedor emisor
            </span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {sellers.find((s) => s.id === selectedSellerId)?.business_name || 'Negocio'}
            </span>
          </div>
        </div>

        {sellers.length > 1 && (
          <select
            value={selectedSellerId}
            onChange={(e) => setSelectedSellerId(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.business_name} ({s.city || 'Sin ciudad'})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Sincronización con Inventario Maestro (Prioridad de Inventario) */}
      <div className="mb-6 rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white p-5 shadow-xs dark:from-emerald-950/40 dark:via-zinc-900 dark:to-zinc-900 dark:border-emerald-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-xs">
              📦
            </span>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span>Vincular con Artículo de tu Inventario Maestro</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 uppercase tracking-wider">
                  Prioridad Inventario
                </span>
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                El precio y existencias provienen de tu inventario. Selecciona un artículo existente para importar su información:
              </p>
            </div>
          </div>

          <Link
            href="/mis-publicaciones"
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Publicaciones & Inventario</span>
            <span>↗</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div className="sm:col-span-2">
            <select
              value={selectedInventoryId}
              onChange={(e) => handleSelectInventoryItem(e.target.value)}
              className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-emerald-800 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">➕ Crear nuevo artículo independiente (se integrará al inventario)</option>
              {inventoryListings.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  📦 {inv.title} — ${Number(inv.price || 0).toLocaleString('es-CO')} COP / {inv.price_unit || (inv.type === 'service' ? 'servicio' : 'unidad')} ({inv.type === 'service' ? 'Servicio' : `${inv.stock ?? 0} disponibles`})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            {selectedInventoryId && inventoryItemData ? (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-100/90 px-3 py-2 text-xs font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                <span className="truncate">✓ Precio: ${Number(inventoryItemData.price || 0).toLocaleString('es-CO')} COP</span>
                <button
                  type="button"
                  onClick={() => handleSelectInventoryItem('new')}
                  className="text-emerald-900 dark:text-emerald-300 hover:text-red-600 dark:hover:text-red-400 text-[11px] underline"
                >
                  Desvincular
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-zinc-500 block">
                {loadingInventory ? 'Cargando inventario...' : `${inventoryListings.length} artículos en tu inventario`}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-8 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* 1. Tipo de Publicación */}
        <div>
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            1. ¿Qué deseas publicar?
          </label>
          
          {isLockedType ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4.5 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-xs">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {locale === 'en' ? 'Listing Classification' : 'Clasificación de la Publicación'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-bold dark:bg-emerald-950 dark:text-emerald-300">
                  🔒 {locale === 'en' ? 'Type Defined & Locked' : 'Tipo Clasificado / Fijo'}
                </span>
              </div>
              <div className="flex items-center gap-3.5">
                <span className="text-3xl">
                  {type === 'service' ? '🛠️' : type === 'article' ? '📦' : '🛍️'}
                </span>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                    {type === 'service'
                      ? (locale === 'en' ? '🛠️ Professional Service' : '🛠️ Servicio Profesional')
                      : type === 'article'
                      ? (locale === 'en' ? '📦 Article (Used / Pre-owned)' : '📦 Artículo (Usado / Segunda mano)')
                      : (locale === 'en' ? '🛍️ Product (New / Brand new)' : '🛍️ Producto (Nuevo / A estrenar)')}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {type === 'service'
                      ? (locale === 'en' ? 'Classified as service offering. Delivery time and capacity apply.' : 'Clasificado como servicio. Aplican tiempos de respuesta y cupos.')
                      : type === 'article'
                      ? (locale === 'en' ? 'Classified strictly as used item. State of conservation applies.' : 'Clasificado exclusivamente para cosas usadas. Requiere especificar estado de conservación.')
                      : (locale === 'en' ? 'Classified strictly as new product. Brand new condition applies.' : 'Clasificado exclusivamente para cosas nuevas. La condición está fijada a Nuevo.')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('product')
                  setCondition('Nuevo')
                  setPriceUnit('unidad')
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  type === 'product'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 ring-2 ring-blue-600'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="text-2xl">🛍️</span>
                <span className="font-bold text-sm">Producto (Nuevo)</span>
                <span className="text-xs text-zinc-500">Únicamente cosas nuevas a estrenar, alimentos o inventario de fábrica</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('article')
                  setCondition('Usado - Buen estado')
                  setPriceUnit('unidad')
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  type === 'article'
                    ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 ring-2 ring-amber-600'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="text-2xl">📦</span>
                <span className="font-bold text-sm">Artículo (Usado)</span>
                <span className="text-xs text-zinc-500">Únicamente cosas usadas, segunda mano, antigüedades o de ocasión</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('service')
                  setPriceUnit('servicio')
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  type === 'service'
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-300 ring-2 ring-purple-600'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="text-2xl">🛠️</span>
                <span className="font-bold text-sm">Servicio</span>
                <span className="text-xs text-zinc-500">Hogar, belleza, clases, oficios, mantenimiento y asesorías profesionales</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. Categoría y Título */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="sm:col-span-1">
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Categoría *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Título del anuncio *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Torta de chocolate artesanal 1kg / Clases de inglés online personalizadas"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            {matchedInventorySuggestion && (
              <div className="mt-2 rounded-xl border border-emerald-300 bg-emerald-50 p-2.5 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span>💡</span>
                  <span className="truncate">
                    Encontrado en tu inventario: <strong>&quot;{matchedInventorySuggestion.title}&quot;</strong> (${Number(matchedInventorySuggestion.price || 0).toLocaleString('es-CO')} COP).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => applyInventoryItem(matchedInventorySuggestion)}
                  className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-emerald-500 transition-colors"
                >
                  Importar y Confirmar Precio
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Ciudad y Ubicación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Ciudad de cobertura / ubicación
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej. Bogotá, Medellín, Cali, Envigado..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {type !== 'service' && (
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                Stock / Cantidad disponible
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="1"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          )}
        </div>

        {/* 4. Precio y Modalidad de Cobro */}
        <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              4. Precio y Modalidad de Cobro
            </label>
            {selectedInventoryId && inventoryItemData && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
                <span>🔒</span>
                <span>Precio Maestro de Inventario</span>
              </span>
            )}
          </div>

          {/* Tarjeta de Confirmación de Información de Inventario */}
          {selectedInventoryId && inventoryItemData && (
            <div className="mb-5 rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white p-4 sm:p-5 dark:border-emerald-700 dark:bg-zinc-900 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs dark:bg-zinc-900 dark:border-emerald-900">
                <div>
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    📦 Tarifa Configurada en Inventario
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      ${Number(inventoryItemData.price || 0).toLocaleString('es-CO')} COP
                    </span>
                    <span className="text-xs font-bold text-zinc-400">
                      / {inventoryItemData.price_unit || (type === 'service' ? 'servicio' : 'unidad')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInventoryPriceConfirmed(!inventoryPriceConfirmed)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-2 shadow-2xs ${
                    inventoryPriceConfirmed
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  <span>{inventoryPriceConfirmed ? '✓ Confirmado desde Inventario' : 'Confirmar Precio de Inventario'}</span>
                </button>
              </div>

              <div className="mt-3 flex items-start gap-2 text-xs text-emerald-900 dark:text-emerald-300">
                <span>ℹ️</span>
                <p className="leading-relaxed">
                  <strong>Prioridad del módulo de inventario:</strong> Este anuncio busca y adopta directamente la tarifa ya configurada en el inventario. Solo requieres confirmar los datos para publicar tu anuncio.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="radio"
                name="priceType"
                checked={priceType === 'fixed'}
                onChange={() => setPriceType('fixed')}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
              />
              Precio fijo / establecido
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="radio"
                name="priceType"
                checked={priceType === 'quote'}
                onChange={() => setPriceType('quote')}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
              />
              Cotización a solicitud / A convenir
            </label>
          </div>

          {priceType === 'fixed' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Monto en COP ($) {selectedInventoryId && <span className="text-emerald-600 font-bold">(Sincronizado)</span>}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ej. 35000"
                    className="w-full rounded-lg border border-zinc-300 pl-8 pr-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Unidad de cobro (price_unit)
                </label>
                <input
                  type="text"
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
                  placeholder="Ej. unidad, hora, servicio, kg, sesión, día"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          {selectedInventoryId && inventoryItemData && price !== String(inventoryItemData.price || '') && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900">
              ⚠️ <strong>Sincronización:</strong> Modificaste el precio respecto al valor de inventario (${Number(inventoryItemData.price || 0).toLocaleString('es-CO')} COP). Al publicar el anuncio, este nuevo valor actualizará también el Inventario Maestro.
            </p>
          )}
        </div>

        {/* 5. Descripción */}
        <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Descripción detallada
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe las características principales, ingredientes o materiales, tiempos de entrega, experiencia o lo que el cliente debe saber..."
            className="w-full rounded-lg border border-zinc-300 p-3 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {/* 6. Atributos Específicos (attrs jsonb) */}
        <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Atributos y características técnicas
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {type === 'product' && (
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Condición del Producto
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 text-sm font-semibold text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                  <span>✨</span>
                  <span>Nuevo (A estrenar / De fábrica)</span>
                  <span className="ml-auto text-[10px] font-normal uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Exclusivo Nuevo
                  </span>
                </div>
              </div>
            )}

            {type === 'article' && (
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Estado de Conservación (Artículo Usado) *
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 font-medium"
                >
                  <option value="Usado - Como nuevo">Usado - Como nuevo (Excelente estado)</option>
                  <option value="Usado - Buen estado">Usado - Buen estado (Funcional con detalles mínimos)</option>
                  <option value="Usado - Aceptable">Usado - Aceptable (Signos visibles de uso)</option>
                  <option value="Reacondicionado">Reacondicionado / Restaurado</option>
                </select>
              </div>
            )}

            {(type === 'product' || type === 'article') && (
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Método de entrega
                </label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="Domicilio local">Domicilio local</option>
                  <option value="Envío nacional">Envío nacional</option>
                  <option value="Retiro en punto de venta">Retiro en punto de venta</option>
                  <option value="Acordar con el vendedor">Acordar con el vendedor</option>
                </select>
              </div>
            )}

            {type === 'service' && (
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Modalidad de atención
                </label>
                <select
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="Presencial">Presencial (en sede)</option>
                  <option value="A domicilio">A domicilio</option>
                  <option value="Virtual / Remoto">Virtual / Remoto</option>
                  <option value="Mixta">Mixta</option>
                </select>
              </div>
            )}
          </div>

          {/* Additional dynamic key-values */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
              Agregar características adicionales (opcional):
            </span>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                value={newAttrKey}
                onChange={(e) => setNewAttrKey(e.target.value)}
                placeholder="Nombre (ej. Garantía, Marca, Horario)"
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                type="text"
                value={newAttrVal}
                onChange={(e) => setNewAttrVal(e.target.value)}
                placeholder="Valor (ej. 6 meses, Lenovo, 8am a 6pm)"
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={handleAddCustomAttr}
                className="rounded-lg bg-zinc-200 px-4 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200"
              >
                + Añadir
              </button>
            </div>

            {customAttrs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customAttrs.map((attr, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs border border-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                  >
                    <strong>{attr.key}:</strong> {attr.value}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomAttr(idx)}
                      className="text-red-500 hover:text-red-700 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 7. Fotos e Imágenes (listing_media) */}
        <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Fotos e imágenes
          </label>
          <p className="text-xs text-zinc-500 mb-4">
            Añade fotos para que tu anuncio destaque. Puedes subir imágenes directamente o ingresar enlaces directos a fotos.
          </p>

          {/* File uploader + URL input */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{uploadingImage ? 'Subiendo archivo...' : 'Subir desde equipo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>

              <div className="flex-1 flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="O pega una URL directa de imagen (https://...)"
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="rounded-lg bg-zinc-100 border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                >
                  Agregar URL
                </button>
              </div>
            </div>

            {/* Photos Preview Grid */}
            {mediaUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {mediaUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-zinc-200 aspect-video bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                          Principal
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(idx)}
                        className="rounded-full bg-red-600 text-white p-1 text-xs hover:bg-red-700"
                        title="Eliminar foto"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 8. Botones de Acción y Políticas */}
        <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 mb-6">
            <div className="flex gap-3">
              <span className="text-amber-600 text-lg">ℹ️</span>
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <strong>Flujo de publicación y moderación:</strong>
                <p className="mt-0.5">
                  Al presionar <em>&quot;Publicar para revisión&quot;</em>, el anuncio se guardará con estado <code>submitted</code> para que pase por el panel de moderación antes de quedar visible a compradores en el catálogo público.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitListing('draft')}
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {submitting
                ? t.common.loading
                : (locale === 'en' ? 'Save as draft' : 'Guardar como borrador')}
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitListing('submitted')}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{t.common.loading}</span>
                </>
              ) : (
                <span>{locale === 'en' ? 'Publish for review' : 'Publicar para revisión'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
