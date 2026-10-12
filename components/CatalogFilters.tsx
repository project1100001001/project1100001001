'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'
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

  // Sincronizar estado local reactivamente cuando cambian las props o la navegación
  useEffect(() => {
    setQ(currentFilters.q || '')
    setSelectedCategory(currentFilters.category || '')
    setSelectedType(currentFilters.type || '')
    setSelectedCity(currentFilters.city || '')
    setMinPrice(currentFilters.minPrice || '')
    setMaxPrice(currentFilters.maxPrice || '')
    setSort(currentFilters.sort || 'newest')
  }, [
    currentFilters.q,
    currentFilters.category,
    currentFilters.type,
    currentFilters.city,
    currentFilters.minPrice,
    currentFilters.maxPrice,
    currentFilters.sort,
  ])

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
    { id: 'service', label: locale === 'en' ? '🛠️ Services' : '🛠️ Servicios' },
    { id: 'article', label: locale === 'en' ? '📦 Articles (Used / Pre-owned)' : '📦 Artículos (Usados / Segunda mano)' },
    { id: 'product', label: locale === 'en' ? '🛍️ Products (New)' : '🛍️ Productos (Nuevos)' },
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
          className="rounded-2xl bg-emerald-600 px-5 sm:px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
        >
          {isPending ? t.common.loading : t.common.search}
        </button>
      </form>

      {/* 2. Type Tabs: Responsive 4-Column Segmented Control con señalización destacada */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {typeOptions.map((item) => {
          const active = selectedType === item.id
          let activeClasses = 'bg-zinc-900 text-white shadow-xs dark:bg-white dark:text-zinc-900 ring-2 ring-zinc-900/20 dark:ring-white/20'
          if (item.id === 'service') {
            activeClasses = 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-600/30'
          } else if (item.id === 'article') {
            activeClasses = 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-600/30'
          } else if (item.id === 'product') {
            activeClasses = 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedType(item.id)
                applyFilters({ type: item.id })
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                active
                  ? activeClasses
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 border border-zinc-200/60 dark:border-zinc-700/60'
              }`}
            >
              <span>{item.label}</span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-current shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* 3. Filter Box: Symmetrical 4-Column Grid with Equal Heights */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
              🏷️ {locale === 'en' ? 'Category' : 'Categoría'}
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  applyFilters({ category: e.target.value })
                }}
                className={`w-full h-10 appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer ${
                  selectedCategory
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold dark:border-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-200 ring-1 ring-emerald-500/20'
                    : 'border-zinc-300 bg-zinc-50/50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100'
                }`}
              >
                <option value="">{t.common.allCategories}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 text-[10px]">
                ▼
              </span>
            </div>
          </div>

          {/* Ciudad */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
              📍 {locale === 'en' ? 'City' : 'Ciudad'}
            </label>
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value)
                  applyFilters({ city: e.target.value })
                }}
                className={`w-full h-10 appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer ${
                  selectedCity
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold dark:border-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-200 ring-1 ring-emerald-500/20'
                    : 'border-zinc-300 bg-zinc-50/50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100'
                }`}
              >
                <option value="">{t.common.allCities}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 text-[10px]">
                ▼
              </span>
            </div>
          </div>

          {/* Rango de Precios */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
              💰 {t.common.price} ($)
            </label>
            <div className={`flex h-10 items-center rounded-xl border px-2.5 transition-colors focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-zinc-800 ${
              minPrice || maxPrice
                ? 'border-emerald-500 bg-emerald-50/30 dark:border-emerald-500 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20'
                : 'border-zinc-300 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/80'
            }`}>
              <input
                type="number"
                placeholder={locale === 'en' ? 'Min' : 'Mín'}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onBlur={() => applyFilters()}
                className="w-1/2 bg-transparent text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
              />
              <span className="px-1.5 text-zinc-400 font-bold select-none">-</span>
              <input
                type="number"
                placeholder={locale === 'en' ? 'Max' : 'Máx'}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={() => applyFilters()}
                className="w-1/2 bg-transparent text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 text-right"
              />
            </div>
          </div>

          {/* Ordenar */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
              ↕️ {locale === 'en' ? 'Sort by' : 'Ordenar por'}
            </label>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value)
                  applyFilters({ sort: e.target.value })
                }}
                className={`w-full h-10 appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer ${
                  sort && sort !== 'newest'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold dark:border-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-200 ring-1 ring-emerald-500/20'
                    : 'border-zinc-300 bg-zinc-50/50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100'
                }`}
              >
                <option value="newest">{locale === 'en' ? 'Newest' : 'Más recientes'}</option>
                <option value="price_asc">{locale === 'en' ? 'Lowest price' : 'Menor precio'}</option>
                <option value="price_desc">{locale === 'en' ? 'Highest price' : 'Mayor precio'}</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 text-[10px]">
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* Barra inferior de estado si hay filtros activos */}
        {hasActiveFilters && (
          <div className="mt-3.5 pt-3 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{locale === 'en' ? 'Active filters applied' : 'Filtros aplicados al catálogo'}</span>
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <span>✕</span>
              <span>{locale === 'en' ? 'Clear filters' : 'Limpiar filtros'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
