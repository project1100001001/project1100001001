'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { Category } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface CatalogFiltersProps {
  categories: Category[]
  cities: string[]
  currentFilters: {
    q?: string
    category?: string
    type?: string
    city?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
  }
}

export default function CatalogFilters({
  categories,
  cities,
  currentFilters,
}: CatalogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const { t, locale } = useTranslation()

  const [q, setQ] = useState(currentFilters.q || '')
  const [selectedCategory, setSelectedCategory] = useState(currentFilters.category || '')
  const [selectedType, setSelectedType] = useState(currentFilters.type || '')
  const [selectedCity, setSelectedCity] = useState(currentFilters.city || '')
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice || '')
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice || '')
  const [sort, setSort] = useState(currentFilters.sort || 'newest')

  const applyFilters = (updatedOverrides: Record<string, string> = {}) => {
    const params = new URLSearchParams(searchParams.toString())

    const filters = {
      q,
      category: selectedCategory,
      type: selectedType,
      city: selectedCity,
      minPrice,
      maxPrice,
      sort,
      ...updatedOverrides,
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        params.set(key, value.trim())
      } else {
        params.delete(key)
      }
    })

    startTransition(() => {
      router.push(`/catalogo?${params.toString()}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
  }

  const handleClearFilters = () => {
    setQ('')
    setSelectedCategory('')
    setSelectedType('')
    setSelectedCity('')
    setMinPrice('')
    setMaxPrice('')
    setSort('newest')
    startTransition(() => {
      router.push('/catalogo')
    })
  }

  const hasActiveFilters = Boolean(
    q ||
    selectedCategory ||
    selectedType ||
    selectedCity ||
    minPrice ||
    maxPrice ||
    (sort && sort !== 'newest')
  )

  const typeOptions = [
    { id: '', label: locale === 'en' ? 'All types' : 'Todos los tipos' },
    { id: 'product', label: locale === 'en' ? '🛍️ Products' : '🛍️ Productos' },
    { id: 'service', label: locale === 'en' ? '🛠️ Services' : '🛠️ Servicios' },
    { id: 'article', label: locale === 'en' ? '📦 Articles' : '📦 Artículos' },
  ]

  return (
    <div className="space-y-4">
      {/* 1. Main Search Bar (Touch friendly on mobile) */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.common.searchPlaceholder}
            className="w-full rounded-2xl border border-zinc-300 bg-white pl-11 pr-4 py-3 text-sm text-zinc-900 shadow-xs placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-2xl bg-emerald-600 px-5 sm:px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors disabled:opacity-50 shrink-0"
        >
          {isPending ? t.common.loading : t.common.search}
        </button>
      </form>

      {/* 2. Type Tabs: Horizontally swipeable on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-zinc-400 shrink-0 mr-1">
          {locale === 'en' ? 'Type:' : 'Tipo:'}
        </span>
        {typeOptions.map((item) => {
          const active = selectedType === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedType(item.id)
                applyFilters({ type: item.id })
              }}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                active
                  ? 'bg-zinc-900 text-white shadow-2xs dark:bg-white dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* 3. Category Pills: Swipeable carousel on mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('')
            applyFilters({ category: '' })
          }}
          className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
            !selectedCategory
              ? 'border border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-2xs'
              : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
          }`}
        >
          {t.common.allCategories}
        </button>

        {categories.map((cat) => {
          const active = selectedCategory === cat.slug || selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.slug)
                applyFilters({ category: cat.slug })
              }}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                active
                  ? 'border border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-2xs'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
              }`}
            >
              {cat.name}
            </button>
          )
        })}
      </div>

      {/* 4. Filter bar: City, Price, Sort & Reset (Stacked nicely on mobile, row on tablet/desktop) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex flex-wrap items-center gap-3">
          {/* City select */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-zinc-500 font-medium">
              {locale === 'en' ? 'City:' : 'Ciudad:'}
            </label>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value)
                applyFilters({ city: e.target.value })
              }}
              className="rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="">{t.common.allCities}</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
            <span>{t.common.price}:</span>
            <input
              type="number"
              placeholder={locale === 'en' ? 'Min' : 'Mín'}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={() => applyFilters()}
              className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <span>-</span>
            <input
              type="number"
              placeholder={locale === 'en' ? 'Max' : 'Máx'}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={() => applyFilters()}
              className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200 dark:border-zinc-800">
          {/* Sort Select */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-zinc-500 font-medium">
              {locale === 'en' ? 'Sort:' : 'Ordenar:'}
            </label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                applyFilters({ sort: e.target.value })
              }}
              className="rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="newest">{locale === 'en' ? 'Newest' : 'Más recientes'}</option>
              <option value="price_asc">{locale === 'en' ? 'Lowest price' : 'Menor precio'}</option>
              <option value="price_desc">{locale === 'en' ? 'Highest price' : 'Mayor precio'}</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400"
            >
              {locale === 'en' ? 'Clear filters' : 'Limpiar filtros'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
