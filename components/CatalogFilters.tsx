'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useTransition, useMemo } from 'react'
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
    modality?: string
    leadTime?: string
    condition?: string
    delivery?: string
    subType?: string
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

  // Normalizar tipo de búsqueda
  const initialType =
    currentFilters.type === 'article'
      ? 'article'
      : currentFilters.type === 'product'
      ? 'product'
      : 'service'

  const [q, setQ] = useState(currentFilters.q || '')
  const [selectedCategory, setSelectedCategory] = useState(currentFilters.category || '')
  const [selectedType, setSelectedType] = useState(initialType)
  const [selectedCity, setSelectedCity] = useState(currentFilters.city || '')
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice || '')
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice || '')
  const [sort, setSort] = useState(currentFilters.sort || 'newest')

  // Filtros exclusivos de Servicios
  const [selectedModality, setSelectedModality] = useState(currentFilters.modality || '')
  const [selectedLeadTime, setSelectedLeadTime] = useState(currentFilters.leadTime || '')

  // Filtros exclusivos de Productos / Artículos (Entrega)
  const [selectedDelivery, setSelectedDelivery] = useState(currentFilters.delivery || '')

  // Sincronizar estado local reactivamente cuando cambian las props o la navegación
  useEffect(() => {
    setQ(currentFilters.q || '')
    setSelectedCategory(currentFilters.category || '')

    const normType =
      currentFilters.type === 'article'
        ? 'article'
        : currentFilters.type === 'product'
        ? 'product'
        : 'service'
    setSelectedType(normType)

    setSelectedCity(currentFilters.city || '')
    setMinPrice(currentFilters.minPrice || '')
    setMaxPrice(currentFilters.maxPrice || '')
    setSort(currentFilters.sort || 'newest')
    setSelectedModality(currentFilters.modality || '')
    setSelectedLeadTime(currentFilters.leadTime || '')
    setSelectedDelivery(currentFilters.delivery || '')
  }, [
    currentFilters.q,
    currentFilters.category,
    currentFilters.type,
    currentFilters.city,
    currentFilters.minPrice,
    currentFilters.maxPrice,
    currentFilters.sort,
    currentFilters.modality,
    currentFilters.leadTime,
    currentFilters.delivery,
  ])

  // Categorías filtradas según el tipo seleccionado
  const filteredCategories = useMemo(() => {
    if (selectedType === 'service') {
      return categories.filter(
        (c) => c.applies_to === 'service' || c.applies_to === 'both' || !c.applies_to
      )
    }
    return categories.filter(
      (c) => c.applies_to === 'product' || c.applies_to === 'both' || !c.applies_to
    )
  }, [categories, selectedType])

  const applyFilters = (updatedOverrides: Record<string, string> = {}) => {
    const params = new URLSearchParams(searchParams.toString())

    const targetType = updatedOverrides.type !== undefined ? updatedOverrides.type : selectedType
    const isService = targetType === 'service'

    const filters: Record<string, string> = {
      q,
      category: selectedCategory,
      type: targetType,
      city: selectedCity,
      minPrice,
      maxPrice,
      sort,
      // Solo aplicar filtros de servicios si estamos en modo servicios
      modality: isService ? (updatedOverrides.modality ?? selectedModality) : '',
      leadTime: isService ? (updatedOverrides.leadTime ?? selectedLeadTime) : '',
      // Solo aplicar entrega si no es servicio
      delivery: !isService ? (updatedOverrides.delivery ?? selectedDelivery) : '',
      ...updatedOverrides,
    }

    // Limpiar claves que no aplican
    if (isService) {
      delete filters.delivery
    } else {
      delete filters.modality
      delete filters.leadTime
    }

    delete filters.condition
    delete filters.subType

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        params.set(key, value.trim())
      } else {
        params.delete(key)
      }
    })

    params.delete('condition')
    params.delete('subType')

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
    setSelectedCity('')
    setMinPrice('')
    setMaxPrice('')
    setSort('newest')
    setSelectedModality('')
    setSelectedLeadTime('')
    setSelectedDelivery('')

    const params = new URLSearchParams()
    params.set('type', selectedType || 'service')
    startTransition(() => {
      router.push(`/catalogo?${params.toString()}`)
    })
  }

  const hasActiveFilters = Boolean(
    q ||
    selectedCategory ||
    selectedCity ||
    minPrice ||
    maxPrice ||
    (sort && sort !== 'newest') ||
    (selectedType === 'service' && (selectedModality || selectedLeadTime)) ||
    (selectedType !== 'service' && selectedDelivery)
  )

  return (
    <div className="space-y-4">
      {/* 1. Barra de Búsqueda Principal */}
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
            placeholder={
              selectedType === 'service'
                ? (locale === 'en' ? 'Search services, technical assistance, consulting...' : 'Buscar servicios, asesorías, reparaciones, citas...')
                : selectedType === 'article'
                ? (locale === 'en' ? 'Search used articles, pre-owned items...' : 'Buscar artículos usados, de segunda mano...')
                : (locale === 'en' ? 'Search new products, brand-name items...' : 'Buscar productos nuevos, marcas a estrenar...')
            }
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

      {/* 2. Panel de Filtros según la Selección del Menú Lateral */}
      {selectedType === 'service' ? (
        /* ========================================================================= */
        /* A. PANEL EXCLUSIVO PARA SERVICIOS                                         */
        /* (Cero condición de usados/nuevos, filtros de modalidad y tiempos)         */
        /* ========================================================================= */
        <div className="rounded-2xl border border-purple-200 bg-white p-4 shadow-xs dark:border-purple-900/50 dark:bg-zinc-900/90">
          <div className="flex items-center justify-between border-b border-purple-100 pb-2.5 mb-3.5 dark:border-purple-900/40">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-800 dark:text-purple-300">
              <span>🛠️</span>
              <span>
                {locale === 'en'
                  ? 'Service Filters: Modality, response times and direct quotes'
                  : 'Filtros de Servicios: Modalidad de atención, tiempos de respuesta y cotizaciones'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
              Exclusivo Servicios
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Categoría de Servicio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                🏷️ {locale === 'en' ? 'Service Category' : 'Categoría de Servicio'}
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    applyFilters({ category: e.target.value })
                  }}
                  className={`w-full h-10 appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors cursor-pointer ${
                    selectedCategory
                      ? 'border-purple-500 bg-purple-50/50 text-purple-900 font-bold dark:border-purple-500 dark:bg-purple-950/30 dark:text-purple-200 ring-1 ring-purple-500/20'
                      : 'border-zinc-300 bg-zinc-50/50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100'
                  }`}
                >
                  <option value="">{locale === 'en' ? 'All service categories' : 'Todas las categorías de servicio'}</option>
                  {filteredCategories.map((cat) => (
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

            {/* Ciudad de Cobertura */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                📍 {locale === 'en' ? 'City / Location' : 'Ciudad / Cobertura'}
              </label>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value)
                    applyFilters({ city: e.target.value })
                  }}
                  className={`w-full h-10 appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors cursor-pointer ${
                    selectedCity
                      ? 'border-purple-500 bg-purple-50/50 text-purple-900 font-bold dark:border-purple-500 dark:bg-purple-950/30 dark:text-purple-200 ring-1 ring-purple-500/20'
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

            {/* Modalidad del Servicio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                📍 {locale === 'en' ? 'Service Modality' : 'Modalidad de Atención'}
              </label>
              <div className="relative">
                <select
                  value={selectedModality}
                  onChange={(e) => {
                    setSelectedModality(e.target.value)
                    applyFilters({ modality: e.target.value })
                  }}
                  className={`w-full h-10 appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors cursor-pointer ${
                    selectedModality
                      ? 'border-purple-500 bg-purple-50/50 text-purple-900 font-bold dark:border-purple-500 dark:bg-purple-950/30 dark:text-purple-200 ring-1 ring-purple-500/20'
                      : 'border-zinc-300 bg-zinc-50/50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100'
                  }`}
                >
                  <option value="">{locale === 'en' ? 'All modalities' : 'Todas las modalidades'}</option>
                  <option value="presencial">🏢 {locale === 'en' ? 'In-person / On-site' : 'Presencial en local'}</option>
                  <option value="domicilio">🛵 {locale === 'en' ? 'Home service' : 'A domicilio'}</option>
                  <option value="virtual">💻 {locale === 'en' ? 'Virtual / Remote' : 'Virtual / Remoto'}</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 text-[10px]">
                  ▼
                </span>
              </div>
            </div>

            {/* Tiempo de Respuesta / Entrega */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                ⏱️ {locale === 'en' ? 'Lead / Response Time' : 'Tiempo de Respuesta'}
              </label>
              <div className="relative">
                <select
                  value={selectedLeadTime}
                  onChange={(e) => {
                    setSelectedLeadTime(e.target.value)
                    applyFilters({ leadTime: e.target.value })
                  }}
                  className={`w-full h-10 appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors cursor-pointer ${
                    selectedLeadTime
                      ? 'border-purple-500 bg-purple-50/50 text-purple-900 font-bold dark:border-purple-500 dark:bg-purple-950/30 dark:text-purple-200 ring-1 ring-purple-500/20'
                      : 'border-zinc-300 bg-zinc-50/50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100'
                  }`}
                >
                  <option value="">{locale === 'en' ? 'All response times' : 'Todos los tiempos'}</option>
                  <option value="mismo día">⚡ {locale === 'en' ? 'Same day / Immediate' : 'Mismo día / Inmediato'}</option>
                  <option value="24">⏳ {locale === 'en' ? '24 to 48 hours' : '24 a 48 horas'}</option>
                  <option value="cita">📅 {locale === 'en' ? 'Scheduled / By appointment' : 'Previa cita / Programado'}</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 text-[10px]">
                  ▼
                </span>
              </div>
            </div>

            {/* Tarifa / Honorarios */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                💰 {locale === 'en' ? 'Fee / Quote ($)' : 'Honorarios / Tarifa ($)'}
              </label>
              <div
                className={`flex h-10 items-center rounded-xl border px-2.5 transition-colors focus-within:border-purple-500 focus-within:bg-white dark:focus-within:bg-zinc-800 ${
                  minPrice || maxPrice
                    ? 'border-purple-500 bg-purple-50/30 dark:border-purple-500 dark:bg-purple-950/20 ring-1 ring-purple-500/20'
                    : 'border-zinc-300 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/80'
                }`}
              >
                <input
                  type="number"
                  placeholder={locale === 'en' ? 'Min' : 'Mín'}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  onBlur={() => applyFilters()}
                  className="w-1/2 bg-transparent text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
                />
                <span className="px-1 text-zinc-400 font-bold select-none">-</span>
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
          </div>
        </div>
      ) : selectedType === 'article' ? (
        /* ========================================================================= */
        /* B. PANEL EXCLUSIVO PARA ARTÍCULOS USADOS                                  */
        /* (Segunda mano, entrega y precios; CERO condición nuevo/usado)             */
        /* ========================================================================= */
        <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-xs dark:border-amber-900/50 dark:bg-zinc-900/90">
          <div className="flex items-center justify-between border-b border-amber-100 pb-2.5 mb-3.5 dark:border-amber-900/40">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <span>📦</span>
              <span>
                {locale === 'en'
                  ? 'Used Article Filters: Categories, shipping methods and prices'
                  : 'Filtros de Artículos Usados: Oportunidades de segunda mano, despacho y precios'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              Exclusivo Usados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Categoría */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                🏷️ {locale === 'en' ? 'Article Category' : 'Categoría de Artículo'}
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    applyFilters({ category: e.target.value })
                  }}
                  className={`w-full h-10 appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer ${
                    selectedCategory
                      ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-bold dark:border-amber-500 dark:bg-amber-950/30 dark:text-amber-200 ring-1 ring-amber-500/20'
                      : 'border-zinc-300 bg-zinc-50/50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100'
                  }`}
                >
                  <option value="">{locale === 'en' ? 'All article categories' : 'Todas las categorías'}</option>
                  {filteredCategories.map((cat) => (
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
                  className={`w-full h-10 appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer ${
                    selectedCity
                      ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-bold dark:border-amber-500 dark:bg-amber-950/30 dark:text-amber-200 ring-1 ring-amber-500/20'
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

            {/* Método de Entrega / Despacho */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                🚚 {locale === 'en' ? 'Delivery Method' : 'Entrega / Despacho'}
              </label>
              <div className="relative">
                <select
                  value={selectedDelivery}
                  onChange={(e) => {
                    setSelectedDelivery(e.target.value)
                    applyFilters({ delivery: e.target.value })
                  }}
                  className={`w-full h-10 appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer ${
                    selectedDelivery
                      ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-bold dark:border-amber-500 dark:bg-amber-950/30 dark:text-amber-200 ring-1 ring-amber-500/20'
                      : 'border-zinc-300 bg-zinc-50/50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100'
                  }`}
                >
                  <option value="">{locale === 'en' ? 'All methods' : 'Todos los métodos'}</option>
                  <option value="domicilio">🛵 {locale === 'en' ? 'Home Delivery' : 'Envío a domicilio'}</option>
                  <option value="tienda">🏬 {locale === 'en' ? 'Store Pickup' : 'Retiro en persona / tienda'}</option>
                  <option value="nacional">📦 {locale === 'en' ? 'National Shipping' : 'Envío nacional'}</option>
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
              <div
                className={`flex h-10 items-center rounded-xl border px-2.5 transition-colors focus-within:border-amber-500 focus-within:bg-white dark:focus-within:bg-zinc-800 ${
                  minPrice || maxPrice
                    ? 'border-amber-500 bg-amber-50/30 dark:border-amber-500 dark:bg-amber-950/20 ring-1 ring-amber-500/20'
                    : 'border-zinc-300 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/80'
                }`}
              >
                <input
                  type="number"
                  placeholder={locale === 'en' ? 'Min' : 'Mín'}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  onBlur={() => applyFilters()}
                  className="w-1/2 bg-transparent text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
                />
                <span className="px-1 text-zinc-400 font-bold select-none">-</span>
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
                  className={`w-full h-10 appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer ${
                    sort && sort !== 'newest'
                      ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-bold dark:border-amber-500 dark:bg-amber-950/30 dark:text-amber-200 ring-1 ring-amber-500/20'
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
        </div>
      ) : (
        /* ========================================================================= */
        /* C. PANEL EXCLUSIVO PARA PRODUCTOS NUEVOS                                  */
        /* (Artículos a estrenar, despacho y precios; CERO condición nuevo/usado)   */
        /* ========================================================================= */
        <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-xs dark:border-blue-900/50 dark:bg-zinc-900/90">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2.5 mb-3.5 dark:border-blue-900/40">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-800 dark:text-blue-300">
              <span>✨</span>
              <span>
                {locale === 'en'
                  ? 'New Product Filters: Brand new stock, delivery and categories'
                  : 'Filtros de Productos Nuevos: Artículos a estrenar de fábrica, despacho y precios'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              Exclusivo Nuevos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Categoría */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                🏷️ {locale === 'en' ? 'Product Category' : 'Categoría de Producto'}
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    applyFilters({ category: e.target.value })
                  }}
                  className={`w-full h-10 appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer ${
                    selectedCategory
                      ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-200 ring-1 ring-blue-500/20'
                      : 'border-zinc-300 bg-zinc-50/50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100'
                  }`}
                >
                  <option value="">{locale === 'en' ? 'All product categories' : 'Todas las categorías'}</option>
                  {filteredCategories.map((cat) => (
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
                  className={`w-full h-10 appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer ${
                    selectedCity
                      ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-200 ring-1 ring-blue-500/20'
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

            {/* Método de Entrega / Despacho */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                🚚 {locale === 'en' ? 'Delivery Method' : 'Entrega / Despacho'}
              </label>
              <div className="relative">
                <select
                  value={selectedDelivery}
                  onChange={(e) => {
                    setSelectedDelivery(e.target.value)
                    applyFilters({ delivery: e.target.value })
                  }}
                  className={`w-full h-10 appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer ${
                    selectedDelivery
                      ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-200 ring-1 ring-blue-500/20'
                      : 'border-zinc-300 bg-zinc-50/50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100'
                  }`}
                >
                  <option value="">{locale === 'en' ? 'All methods' : 'Todos los métodos'}</option>
                  <option value="domicilio">🛵 {locale === 'en' ? 'Home Delivery' : 'Envío a domicilio'}</option>
                  <option value="tienda">🏬 {locale === 'en' ? 'Store Pickup' : 'Retiro en tienda'}</option>
                  <option value="nacional">📦 {locale === 'en' ? 'National Shipping' : 'Envío nacional'}</option>
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
              <div
                className={`flex h-10 items-center rounded-xl border px-2.5 transition-colors focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-800 ${
                  minPrice || maxPrice
                    ? 'border-blue-500 bg-blue-50/30 dark:border-blue-500 dark:bg-blue-950/20 ring-1 ring-blue-500/20'
                    : 'border-zinc-300 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/80'
                }`}
              >
                <input
                  type="number"
                  placeholder={locale === 'en' ? 'Min' : 'Mín'}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  onBlur={() => applyFilters()}
                  className="w-1/2 bg-transparent text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
                />
                <span className="px-1 text-zinc-400 font-bold select-none">-</span>
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
                  className={`w-full h-10 appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer ${
                    sort && sort !== 'newest'
                      ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-200 ring-1 ring-blue-500/20'
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
        </div>
      )}

      {/* 3. Barra Inferior de Estado de Filtros */}
      {hasActiveFilters && (
        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/60 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 font-medium text-zinc-600 dark:text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {selectedType === 'service'
                ? (locale === 'en' ? 'Filters active in Services' : 'Filtros activos en Servicios')
                : (locale === 'en' ? 'Filters active in Products' : 'Filtros activos en Productos')}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
          >
            <span>✕</span>
            <span>{locale === 'en' ? 'Reset filters' : 'Limpiar filtros'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
