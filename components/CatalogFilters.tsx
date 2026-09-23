'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { Category } from '@/lib/types'

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

  return (
    <div className="space-y-4">
      {/* 1. Main Search Bar */}
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
            placeholder="¿Qué estás buscando? (ej. empanadas, plomería, laptop...)"
            className="w-full rounded-xl border border-zinc-300 bg-white pl-11 pr-4 py-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {/* 2. Type Tabs: Todos, Productos, Servicios, Artículos */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-medium text-zinc-500 mr-1">Tipo:</span>
        {[
          { id: '', label: 'Todos los tipos' },
          { id: 'product', label: '🛍️ Productos' },
          { id: 'service', label: '🛠️ Servicios' },
          { id: 'article', label: '📦 Artículos' },
        ].map((t) => {
          const active = selectedType === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setSelectedType(t.id)
                applyFilters({ type: t.id })
              }}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* 3. Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('')
            applyFilters({ category: '' })
          }}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            !selectedCategory
              ? 'border border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
          }`}
        >
          Todas las categorías
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
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? 'border border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
              }`}
            >
              {cat.name}
            </button>
          )
        })}
      </div>

      {/* 4. Filter bar: City, Price, Sort & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex flex-wrap items-center gap-3">
          {/* City select */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-zinc-500">Ciudad:</label>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value)
                applyFilters({ city: e.target.value })
              }}
              className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="">Todas las ciudades</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span>Precio:</span>
            <input
              type="number"
              placeholder="Mín"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={() => applyFilters()}
              className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Máx"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={() => applyFilters()}
              className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Sort Select */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-zinc-500">Ordenar:</label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                applyFilters({ sort: e.target.value })
              }}
              className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="newest">Más recientes</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
