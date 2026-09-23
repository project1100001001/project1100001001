// app/catalogo/page.tsx
// Catálogo y Búsqueda de Productos y Servicios

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import CatalogFilters from '@/components/CatalogFilters'
import ListingCard from '@/components/ListingCard'
import type { Category, ListingWithRelations } from '@/lib/types'
import Link from 'next/link'

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
    <main className="flex-1 bg-zinc-50/50 pb-20 dark:bg-zinc-950">
      {/* Catalog Header */}
      <section className="border-b border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Catálogo del Marketplace
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Encuentra productos locales, servicios profesionales y artículos disponibles directamente de sus creadores.
              </p>
            </div>

            <Link
              href="/publicar"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors self-start md:self-auto"
            >
              <span>+ Publicar en el catálogo</span>
            </Link>
          </div>

          {/* Search & Filters Component */}
          <div className="mt-6">
            <Suspense fallback={<div className="h-28 rounded-xl bg-zinc-100 animate-pulse dark:bg-zinc-800" />}>
              <CatalogFilters
                categories={categories}
                cities={uniqueCities}
                currentFilters={{
                  q,
                  category: categorySlug,
                  type: typeFilter,
                  city: cityFilter,
                  minPrice,
                  maxPrice,
                  sort,
                }}
              />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {listings.length === 1
              ? '1 publicación encontrada'
              : `${listings.length} publicaciones encontradas`}
          </span>
        </div>

        {listings.length === 0 ? (
          <div className="my-12 rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-3xl dark:bg-zinc-800">
              🔍
            </div>
            <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              No se encontraron publicaciones
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
              {q || categorySlug || typeFilter || cityFilter || minPrice || maxPrice
                ? 'Prueba ajustando los filtros de búsqueda o eliminando términos específicos.'
                : 'Aún no hay publicaciones aprobadas en el catálogo. ¡Sé el primero en publicar tu producto o servicio!'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {(q || categorySlug || typeFilter || cityFilter || minPrice || maxPrice) && (
                <Link
                  href="/catalogo"
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Restablecer filtros
                </Link>
              )}
              <Link
                href="/publicar"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Publicar un anuncio ahora
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
