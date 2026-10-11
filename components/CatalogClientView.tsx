'use client'

import React, { Suspense } from 'react'
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
  }
  listings: ListingWithRelations[]
}

export default function CatalogClientView({
  categories,
  uniqueCities,
  currentFilters,
  listings,
}: CatalogClientViewProps) {
  const { t } = useTranslation()
  const hasActiveFilters = Boolean(
    currentFilters.q ||
      currentFilters.category ||
      currentFilters.type ||
      currentFilters.city ||
      currentFilters.minPrice ||
      currentFilters.maxPrice
  )

  return (
    <main className="flex-1 bg-zinc-50/50 pb-20 dark:bg-zinc-950">
      {/* Catalog Header */}
      <section className="border-b border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t.catalog.title}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t.catalog.subtitle}
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
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {listings.length === 1
              ? `1 ${t.catalog.singleResult}`
              : `${listings.length} ${t.catalog.resultsCount}`}
          </span>
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
                  href="/catalogo"
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {t.catalog.resetFiltersBtn}
                </Link>
              )}
              <Link
                href="/publicar"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                {t.catalog.publishNowBtn}
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
