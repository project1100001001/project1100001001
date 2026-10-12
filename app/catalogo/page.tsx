// app/catalogo/page.tsx
// Catálogo y Búsqueda de Productos y Servicios

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
  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const categorySlug = typeof params.category === 'string' ? params.category.trim() : ''
  const typeFilter = typeof params.type === 'string' ? params.type.trim() : ''
  const cityFilter = typeof params.city === 'string' ? params.city.trim() : ''
  const minPrice = typeof params.minPrice === 'string' ? params.minPrice.trim() : ''
  const maxPrice = typeof params.maxPrice === 'string' ? params.maxPrice.trim() : ''
  const sort = typeof params.sort === 'string' ? params.sort.trim() : 'newest'

  const supabase = await createClient()

  // 1. Obtener categorías para los filtros
  const { data: categoriesData } = await supabase
    .from('category')
    .select('*')
    .order('name', { ascending: true })

  const categories = (categoriesData as Category[]) || []

  // 2. Construir la consulta de listings con joins
  let query = supabase
    .from('listing')
    .select(`
      *,
      category:category_id(*),
      seller:seller_id(*),
      listing_media(*)
    `)

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

  // Filtro por tipo (product, service, article)
  if (typeFilter && ['product', 'service', 'article'].includes(typeFilter)) {
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

  const listings = (listingsData as ListingWithRelations[]) || []

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
      }}
      listings={listings}
    />
  )
}
