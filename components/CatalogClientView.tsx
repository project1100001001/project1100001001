'use client'

import React, { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import CatalogFilters from '@/components/CatalogFilters'
import ListingCard from '@/components/ListingCard'
import type { Category, ListingWithRelations } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface CatalogClientViewProps {
  categories: Category[]
  uniqueCities: string[]
  currentFilters: {
    q: string
    category: string
    type: string
    city: string
    minPrice: string
    maxPrice: string
    sort: string
    seller?: string
    modality?: string
    leadTime?: string
    condition?: string
    delivery?: string
    subType?: string
  }
  listings: ListingWithRelations[]
}

export default function CatalogClientView({
  categories,
  uniqueCities,
  currentFilters,
  listings,
}: CatalogClientViewProps) {
  const { t, locale } = useTranslation()
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [visibleLimit, setVisibleLimit] = useState<number>(10)

  useEffect(() => {
    setVisibleLimit(itemsPerPage === 0 ? listings.length : Math.max(10, itemsPerPage))
  }, [itemsPerPage, listings.length, currentFilters.type, currentFilters.category, currentFilters.q])

  const visibleListings =
    itemsPerPage === 0 ? listings : listings.slice(0, Math.max(10, visibleLimit))

  const handleChangeItemsPerPage = (newCount: number) => {
    setItemsPerPage(newCount)
    setVisibleLimit(newCount === 0 ? listings.length : Math.max(10, newCount))
  }

  const hasActiveFilters = Boolean(
    currentFilters.q ||
      currentFilters.category ||
      currentFilters.type ||
      currentFilters.city ||
      currentFilters.minPrice ||
      currentFilters.maxPrice ||
      currentFilters.modality ||
      currentFilters.leadTime ||
      currentFilters.condition ||
      currentFilters.delivery ||
      currentFilters.subType
  )

  const isServiceScope = currentFilters.type === 'service'
  const isArticleScope = currentFilters.type === 'article'
  const isProductScope = currentFilters.type === 'product'

  const catalogTitle = isServiceScope
    ? (locale === 'en' ? '🛠️ Professional Services Catalog' : '🛠️ Catálogo de Servicios Profesionales')
    : isArticleScope
    ? (locale === 'en' ? '📦 Used Articles Catalog' : '📦 Catálogo de Artículos Usados')
    : (locale === 'en' ? '✨ New Products Catalog' : '✨ Catálogo de Productos Nuevos')

  const catalogSubtitle = isServiceScope
    ? (locale === 'en'
        ? 'Specialized services, direct quotes and on-site or remote assistance modalities.'
        : 'Servicios especializados, cotizaciones a solicitud y modalidades de atención presencial o virtual.')
    : isArticleScope
    ? (locale === 'en'
        ? 'Pre-owned items, second-hand opportunities and deals from local sellers.'
        : 'Artículos de segunda mano, liquidaciones y oportunidades únicas de comercios locales.')
    : (locale === 'en'
        ? 'Brand-new factory items with merchant warranty and fast delivery.'
        : 'Productos nuevos a estrenar con garantía de fábrica y disponibilidad de comercios locales.')

  return (
    <main className="flex-1 bg-zinc-50/50 pb-20 dark:bg-zinc-950">
      {/* Catalog Header */}
      <section className="border-b border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {catalogTitle}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {catalogSubtitle}
            </p>
          </div>

          {/* Search & Filters Component */}
          <div className="mt-6">
            <Suspense fallback={<div className="h-28 rounded-xl bg-zinc-100 animate-pulse dark:bg-zinc-800" />}>
              <CatalogFilters
                categories={categories}
                cities={uniqueCities}
                currentFilters={currentFilters}
              />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {currentFilters.seller && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-purple-50 p-4 text-xs font-semibold text-purple-900 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
            <div className="flex items-center gap-2">
              <span>🏪</span>
              <span>Mostrando ofertas del comercio seleccionado en el Directorio</span>
            </div>
            <Link
              href={`/catalogo?type=${currentFilters.type || 'service'}`}
              className="rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs text-white hover:bg-purple-500 font-bold transition-colors shadow-xs"
            >
              {isServiceScope
                ? (locale === 'en' ? 'View all services' : 'Ver todos los servicios')
                : isArticleScope
                ? (locale === 'en' ? 'View all used articles' : 'Ver todos los artículos usados')
                : (locale === 'en' ? 'View all new products' : 'Ver todos los productos nuevos')}
            </Link>
          </div>
        )}

        {/* Barra superior de resultados con Selector de Cantidad de Ítems y Modo de Visualización (Lista vs Cuadrícula) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {listings.length === 0
                ? `0 ${t.catalog.resultsCount}`
                : locale === 'en'
                ? `Showing ${visibleListings.length} of ${listings.length} ${listings.length === 1 ? t.catalog.singleResult : t.catalog.resultsCount}`
                : `Mostrando ${visibleListings.length} de ${listings.length} ${listings.length === 1 ? t.catalog.singleResult : t.catalog.resultsCount}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Selector de Cantidad de Ítems a Cargar (Mínimo 10 inicialmente) */}
            <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 px-2.5 py-1 shadow-2xs">
              <label
                htmlFor="catalog-items-per-page"
                className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 whitespace-nowrap"
              >
                {locale === 'en' ? 'Load:' : 'Cargar:'}
              </label>
              <select
                id="catalog-items-per-page"
                value={itemsPerPage}
                onChange={(e) => handleChangeItemsPerPage(Number(e.target.value))}
                className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:border-emerald-500 focus:outline-none cursor-pointer shadow-2xs"
                title={
                  locale === 'en'
                    ? 'Select number of items to load (minimum 10 initially)'
                    : 'Seleccionar cantidad de ítems a cargar (mínimo 10 inicialmente)'
                }
              >
                <option value={10}>10 ítems</option>
                <option value={15}>15 ítems</option>
                <option value={20}>20 ítems</option>
                <option value={30}>30 ítems</option>
                <option value={50}>50 ítems</option>
                <option value={0}>{locale === 'en' ? `All (${listings.length})` : `Todos (${listings.length})`}</option>
              </select>
            </div>

            {/* Selector de Modo de Visualización (Lista predeterminada) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-emerald-700 shadow-xs dark:bg-zinc-900 dark:text-emerald-400 ring-1 ring-zinc-200 dark:ring-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
                title="Modo de visualización en lista con imagen compacta"
              >
                <span>☰</span>
                <span>Lista</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-emerald-700 shadow-xs dark:bg-zinc-900 dark:text-emerald-400 ring-1 ring-zinc-200 dark:ring-zinc-700'
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

        {listings.length === 0 ? (
          <div className="my-12 rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-3xl dark:bg-zinc-800">
              🔍
            </div>
            <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {t.catalog.emptyTitle}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
              {hasActiveFilters
                ? t.catalog.emptyDescFilters
                : t.catalog.emptyDescNoFilters}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {hasActiveFilters && (
                <Link
                  href={`/catalogo?type=${currentFilters.type || 'service'}`}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {t.catalog.resetFiltersBtn}
                </Link>
              )}
              <Link
                href="/"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                {locale === 'en' ? 'Explore Main Showcase' : 'Ver Vitrina Principal'}
              </Link>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          /* MODO LISTA (PREDETERMINADO CON IMAGEN PEQUEÑA E INFORMACIÓN COMPLETA) */
          <div className="flex flex-col gap-3.5 sm:gap-4">
            {visibleListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} viewMode="list" />
            ))}
          </div>
        ) : (
          /* MODO CUADRÍCULA */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} viewMode="grid" />
            ))}
          </div>
        )}

        {/* Control inferior para cargar más ítems si hay más que el límite actual */}
        {listings.length > visibleListings.length && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              {locale === 'en'
                ? `Showing ${visibleListings.length} of ${listings.length} items`
                : `Mostrando ${visibleListings.length} de ${listings.length} publicaciones disponibles`}
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setVisibleLimit((prev) =>
                    Math.min(listings.length, prev + (itemsPerPage > 0 ? itemsPerPage : 10))
                  )
                }
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                ➕ Cargar {Math.min(itemsPerPage > 0 ? itemsPerPage : 10, listings.length - visibleListings.length)} más
              </button>
              <button
                type="button"
                onClick={() => handleChangeItemsPerPage(0)}
                className="rounded-xl border border-zinc-300 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Ver todos ({listings.length})
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
