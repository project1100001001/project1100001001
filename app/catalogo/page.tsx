// app/catalogo/page.tsx
// Catálogo y Búsqueda de Productos y Servicios

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CatalogClientView from '@/components/CatalogClientView'
import type { Category, ListingWithRelations } from '@/lib/types'

export const metadata = {
  title: 'Catálogo de Productos y Servicios | Marketplace',
  description: 'Explora ofertas de negocios locales y emprendedores en alimentos, servicios, artículos y más.',
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CatalogoPage({ searchParams }: PageProps) {
  const params = await searchParams
  const rawType = typeof params.type === 'string' ? params.type.trim() : ''

  // Si no se especifica tipo o viene el antiguo 'products', redirigir a su ventana correspondiente
  if (!rawType || rawType === 'products') {
    const nextParams = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (typeof v === 'string') nextParams.set(k, v)
    })
    nextParams.set('type', rawType === 'products' ? 'product' : 'service')
    redirect(`/catalogo?${nextParams.toString()}`)
  }

  const typeFilter = rawType

  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const categorySlug = typeof params.category === 'string' ? params.category.trim() : ''
  const cityFilter = typeof params.city === 'string' ? params.city.trim() : ''
  const minPrice = typeof params.minPrice === 'string' ? params.minPrice.trim() : ''
  const maxPrice = typeof params.maxPrice === 'string' ? params.maxPrice.trim() : ''
  const sort = typeof params.sort === 'string' ? params.sort.trim() : 'newest'
  const modalityFilter = typeof params.modality === 'string' ? params.modality.trim() : ''
  const leadTimeFilter = typeof params.leadTime === 'string' ? params.leadTime.trim() : ''
  const conditionFilter = typeof params.condition === 'string' ? params.condition.trim() : ''
  const deliveryFilter = typeof params.delivery === 'string' ? params.delivery.trim() : ''
  const subTypeFilter = typeof params.subType === 'string' ? params.subType.trim() : ''

  const supabase = await createClient()

  // 1. Obtener categorías para los filtros
  const { data: categoriesData } = await supabase
    .from('category')
    .select('*')
    .order('name', { ascending: true })

  const categories = (categoriesData as Category[]) || []

  // 2. Construir la consulta de listings con joins (solo anuncios activos/publicados para el catálogo público)
  let query = supabase
    .from('listing')
    .select(`
      *,
      category:category_id(*),
      seller:seller_id(*),
      listing_media(*)
    `)
    .eq('status', 'published')

  // Filtro de búsqueda por texto (título y descripción)
  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  }

  // Filtro por categoría (slug o id)
  if (categorySlug) {
    const matchedCategory = categories.find(
      (c) => c.slug === categorySlug || c.id === categorySlug
    )
    if (matchedCategory) {
      query = query.eq('category_id', matchedCategory.id)
    }
  }

  // Filtro por tipo estricto (service | article | product)
  if (['product', 'service', 'article'].includes(typeFilter)) {
    query = query.eq('type', typeFilter)
  }

  // Filtro por vendedor
  const sellerFilter = typeof params.seller === 'string' ? params.seller.trim() : ''
  if (sellerFilter) {
    query = query.eq('seller_id', sellerFilter)
  }

  // Filtro por ciudad
  if (cityFilter) {
    query = query.ilike('city', `%${cityFilter}%`)
  }

  // Filtro por rango de precio
  if (minPrice && !isNaN(Number(minPrice))) {
    query = query.gte('price', parseInt(minPrice, 10))
  }
  if (maxPrice && !isNaN(Number(maxPrice))) {
    query = query.lte('price', parseInt(maxPrice, 10))
  }

  // Ordenamiento
  if (sort === 'price_asc') {
    query = query.order('price', { ascending: true, nullsFirst: false })
  } else if (sort === 'price_desc') {
    query = query.order('price', { ascending: false, nullsFirst: false })
  } else {
    // Por defecto: más recientes primero
    query = query.order('created_at', { ascending: false })
  }

  const { data: listingsData, error } = await query

  if (error) {
    console.error('Error cargando listings:', error.message)
  }

  let listings = (listingsData as ListingWithRelations[]) || []

  // Filtros específicos para Servicios
  if (typeFilter === 'service') {
    if (modalityFilter) {
      const mod = modalityFilter.toLowerCase()
      listings = listings.filter((l) => {
        const val = (l.attrs?.modalidad || l.attrs?.modality || '').toLowerCase()
        return val.includes(mod)
      })
    }
    if (leadTimeFilter) {
      const lt = leadTimeFilter.toLowerCase()
      listings = listings.filter((l) => {
        const val = (l.attrs?.tiempo_entrega || l.attrs?.disponibilidad || '').toLowerCase()
        return val.includes(lt)
      })
    }
  }

  // Filtros específicos para Productos Nuevos y Artículos Usados (Despacho / Entrega)
  if (deliveryFilter && (typeFilter === 'product' || typeFilter === 'article')) {
    const del = deliveryFilter.toLowerCase()
    listings = listings.filter((l) => {
      const val = (l.attrs?.delivery_method || '').toLowerCase()
      return val.includes(del)
    })
  }

  // Obtener lista de ciudades disponibles a partir de los listings o default
  const defaultCities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga', 'Cartagena']
  const listingCities = listings
    .map((l) => l.city)
    .filter((c): c is string => Boolean(c))
  const uniqueCities = Array.from(new Set([...defaultCities, ...listingCities])).sort()

  return (
    <CatalogClientView
      categories={categories}
      uniqueCities={uniqueCities}
      currentFilters={{
        q,
        category: categorySlug,
        type: typeFilter,
        city: cityFilter,
        minPrice,
        maxPrice,
        sort,
        seller: sellerFilter,
        modality: modalityFilter,
        leadTime: leadTimeFilter,
        condition: conditionFilter,
        delivery: deliveryFilter,
        subType: subTypeFilter,
      }}
      listings={listings}
    />
  )
}
