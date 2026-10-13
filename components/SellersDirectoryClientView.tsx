'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Seller } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

export interface SellerWithListings extends Seller {
  listings?: {
    id: string
    title: string
    type: string
    price: number | null
    price_unit: string | null
    status: string
    listing_media?: { url: string }[]
  }[]
  listingsCount?: number
}

interface SellersDirectoryClientViewProps {
  initialSellers: SellerWithListings[]
  initialFilter?: string
  initialCity?: string
  initialQuery?: string
}

export default function SellersDirectoryClientView({
  initialSellers,
  initialFilter = '',
  initialCity = '',
  initialQuery = '',
}: SellersDirectoryClientViewProps) {
  const { t, locale } = useTranslation()

  // Filtros interactivos de pantalla
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedType, setSelectedType] = useState('all')
  const [selectedCity, setSelectedCity] = useState(initialCity || 'all')
  const [selectedVerification, setSelectedVerification] = useState<'all' | 'verified'>(
    initialFilter === 'verified' ? 'verified' : 'all'
  )
  const [selectedContact, setSelectedContact] = useState<'all' | 'whatsapp' | 'phone'>(
    initialFilter === 'whatsapp' ? 'whatsapp' : 'all'
  )
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'rating' | 'listings_count'>('name_asc')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Modal para ver ficha completa del comercio
  const [selectedSellerModal, setSelectedSellerModal] = useState<SellerWithListings | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  // Lista única de rubros / tipos de negocio
  const businessTypes = useMemo(() => {
    const set = new Set<string>()
    initialSellers.forEach((s) => {
      if (s.business_type?.trim()) {
        set.add(s.business_type.trim())
      }
    })
    return Array.from(set).sort()
  }, [initialSellers])

  // Lista única de ciudades
  const cities = useMemo(() => {
    const set = new Set<string>()
    initialSellers.forEach((s) => {
      if (s.city?.trim()) {
        set.add(s.city.trim())
      }
    })
    return Array.from(set).sort()
  }, [initialSellers])

  // Helper para normalizar WhatsApp
  const formatWhatsappUrl = (phoneRaw: string | null, businessName: string) => {
    if (!phoneRaw) return ''
    let cleaned = phoneRaw.replace(/\D/g, '')
    if (cleaned.length === 10) {
      cleaned = `57${cleaned}`
    }
    const msg =
      locale === 'en'
        ? `Hello ${businessName}, I found your business in the Marketplace Directory and would like more information.`
        : `Hola ${businessName}, encontré su negocio en el Directorio del Marketplace y me gustaría solicitar información.`
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`
  }

  // Copiar datos de contacto al portapapeles
  const handleCopyContact = (seller: SellerWithListings) => {
    const lines = [
      `🏪 ${seller.business_name}`,
      seller.business_type ? `Rubro: ${seller.business_type}` : null,
      seller.city ? `Ciudad: ${seller.city}` : null,
      seller.whatsapp ? `WhatsApp: ${seller.whatsapp}` : null,
      seller.phone ? `Teléfono: ${seller.phone}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(lines)
      showToast(t.directory.contactCopied)
    }
  }

  // Filtrado y ordenamiento de la lista
  const filteredSellers = useMemo(() => {
    return initialSellers
      .filter((seller) => {
        // Búsqueda por texto libre
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const matchName = seller.business_name.toLowerCase().includes(q)
          const matchType = seller.business_type?.toLowerCase().includes(q) || false
          const matchCity = seller.city?.toLowerCase().includes(q) || false
          const matchDesc = seller.description?.toLowerCase().includes(q) || false
          const matchPhone = seller.phone?.includes(q) || seller.whatsapp?.includes(q) || false
          if (!matchName && !matchType && !matchCity && !matchDesc && !matchPhone) {
            return false
          }
        }

        // Filtro por Rubro
        if (selectedType !== 'all') {
          if (seller.business_type?.trim() !== selectedType) {
            return false
          }
        }

        // Filtro por Ciudad
        if (selectedCity !== 'all') {
          if (seller.city?.trim() !== selectedCity) {
            return false
          }
        }

        // Filtro por Verificación
        if (selectedVerification === 'verified' && !seller.verified) {
          return false
        }

        // Filtro por Canal de Contacto
        if (selectedContact === 'whatsapp' && !seller.whatsapp) {
          return false
        }
        if (selectedContact === 'phone' && !seller.phone) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') {
          return a.business_name.localeCompare(b.business_name)
        }
        if (sortBy === 'name_desc') {
          return b.business_name.localeCompare(a.business_name)
        }
        if (sortBy === 'rating') {
          return (b.rating_avg || 0) - (a.rating_avg || 0)
        }
        if (sortBy === 'listings_count') {
          return (b.listingsCount || 0) - (a.listingsCount || 0)
        }
        return 0
      })
  }, [
    initialSellers,
    searchQuery,
    selectedType,
    selectedCity,
    selectedVerification,
    selectedContact,
    sortBy,
  ])

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedType !== 'all' ||
    selectedCity !== 'all' ||
    selectedVerification !== 'all' ||
    selectedContact !== 'all'

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedType('all')
    setSelectedCity('all')
    setSelectedVerification('all')
    setSelectedContact('all')
    setSortBy('name_asc')
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* 1. Cabecera Principal de la Pantalla */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>📇</span>
            <span>{t.directory.title}</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {t.directory.subtitle}
          </p>
        </div>

        {/* Buscador Rápido Superior */}
        <div className="relative w-full sm:w-80">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.directory.searchPlaceholder}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-xs placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* 2. Barra de Filtros Funcionales de Pantalla */}
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        {/* Fila 1: Filtro por Verificación y Canales de Contacto */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Filtro:
            </span>
            <button
              type="button"
              onClick={() => setSelectedVerification('all')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                selectedVerification === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {t.directory.allVerification}
            </button>
            <button
              type="button"
              onClick={() => setSelectedVerification('verified')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                selectedVerification === 'verified'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {t.directory.verifiedOnly}
            </button>
            <button
              type="button"
              onClick={() => setSelectedContact(selectedContact === 'whatsapp' ? 'all' : 'whatsapp')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                selectedContact === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {t.directory.withWhatsappOnly}
            </button>
            <button
              type="button"
              onClick={() => setSelectedContact(selectedContact === 'phone' ? 'all' : 'phone')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                selectedContact === 'phone'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {t.directory.withPhoneOnly}
            </button>
          </div>

          {/* Selector de Ordenamiento */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              {t.directory.sortBy}:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="name_asc">{t.directory.sortNameAsc}</option>
              <option value="name_desc">{t.directory.sortNameDesc}</option>
              <option value="rating">{t.directory.sortRating}</option>
              <option value="listings_count">{t.directory.sortOffers}</option>
            </select>
          </div>
        </div>

        {/* Fila 2: Filtro por Ciudad y Rubro comercial */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Ciudad */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500">📍</span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <option value="all">{t.directory.allCities}</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Rubro */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500">🏷️</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <option value="all">{t.directory.allCategories}</option>
                {businessTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contador y Limpiar */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
              {filteredSellers.length} {t.directory.totalSellers}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 transition-colors"
              >
                ✕ {t.directory.clearFilters}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Control de Resultados y Selector de Modo de Visualización (Lista vs Cuadrícula) */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
          {filteredSellers.length === 1
            ? `1 ${locale === 'en' ? 'registered business' : 'comercio registrado'}`
            : `${filteredSellers.length} ${t.directory.totalSellers}`}
        </span>

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

      {/* 3. Listado / Cuadrícula de Vendedores */}
      {filteredSellers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-5xl">🔍</span>
          <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50">
            {t.directory.noSellersFound}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
            {t.directory.noSellersSubtitle}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-4 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition-colors"
            >
              {t.directory.clearFilters}
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* MODO LISTA (PREDETERMINADO CON IMAGEN PEQUEÑA E INFORMACIÓN COMPLETA) */
        <div className="flex flex-col gap-3.5 sm:gap-4">
          {filteredSellers.map((seller) => {
            const initial = seller.business_name ? seller.business_name[0].toUpperCase() : 'C'
            const whatsappUrl = formatWhatsappUrl(seller.whatsapp, seller.business_name)
            const thumbnail = seller.listings?.find((l) => l.listing_media && l.listing_media.length > 0)?.listing_media?.[0]?.url

            return (
              <div
                key={seller.id}
                className="group relative flex flex-col md:flex-row items-stretch rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs hover:shadow-md hover:border-purple-500/50 transition-all dark:border-zinc-800 dark:bg-zinc-900 gap-4"
              >
                {/* Imagen Pequeña (Thumbnail Compacto o Avatar) */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSellerModal(seller)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedSellerModal(seller)
                  }}
                  className="relative w-full sm:w-28 md:w-32 aspect-video sm:aspect-square shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center self-start md:self-center border border-zinc-200/70 dark:border-zinc-800 cursor-pointer"
                >
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={seller.business_name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-2 text-center select-none">
                      <span className="text-3xl font-black">{initial}</span>
                      <span className="mt-1 text-[10px] font-bold opacity-80">🏪 Comercio</span>
                    </div>
                  )}

                  {/* Badge superpuesto en miniatura */}
                  <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
                    {seller.verified ? (
                      <span className="rounded-md bg-emerald-500/90 text-white px-1.5 py-0.5 text-[9px] font-black shadow-xs backdrop-blur-xs">
                        ✓ Verificado
                      </span>
                    ) : (
                      <span className="rounded-md bg-zinc-900/70 text-white px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-xs">
                        🏪 {initial}
                      </span>
                    )}
                  </div>
                </div>

                {/* Zona Central: Información Completa del Comercio */}
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div className="space-y-1.5">
                    {/* Fila 1: Título, Badges y Ubicación */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <button
                          type="button"
                          onClick={() => setSelectedSellerModal(seller)}
                          className="text-left font-bold text-zinc-900 group-hover:text-purple-600 dark:text-zinc-50 dark:group-hover:text-purple-400 transition-colors text-base sm:text-lg truncate max-w-xs sm:max-w-md cursor-pointer"
                        >
                          {seller.business_name}
                        </button>

                        {seller.verified ? (
                          <span
                            title={t.directory.verifiedBadge}
                            className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800"
                          >
                            ✓ Verificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            En validación
                          </span>
                        )}

                        {seller.business_type && (
                          <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            🏷️ {seller.business_type}
                          </span>
                        )}
                      </div>

                      {/* Ciudad */}
                      {seller.city && (
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
                          📍 {seller.city}
                        </span>
                      )}
                    </div>

                    {/* Fila 2: Rating, Opiniones y Conteo de Publicaciones */}
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-bold text-amber-500">★</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {seller.rating_avg > 0 ? Number(seller.rating_avg).toFixed(1) : '5.0'}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        ({seller.rating_count || 0} opiniones)
                      </span>

                      {seller.listingsCount !== undefined && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-700">•</span>
                          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                            📦 {seller.listingsCount} {t.directory.activeOffers}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Fila 3: Descripción del Comercio */}
                    {seller.description ? (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {seller.description}
                      </p>
                    ) : (
                      <p className="text-xs italic text-zinc-400">
                        Comercio registrado en la plataforma.
                      </p>
                    )}

                    {/* Fila 4: Mini-preview de publicaciones destacadas */}
                    {seller.listings && seller.listings.length > 0 && (
                      <div className="pt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
                          Ofertas:
                        </span>
                        {seller.listings.slice(0, 3).map((l) => (
                          <Link
                            key={l.id}
                            href={`/catalogo/${l.id}`}
                            className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 hover:bg-purple-50 hover:text-purple-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 transition-colors truncate max-w-[180px]"
                          >
                            {l.type === 'service' ? '🛠️' : l.type === 'article' ? '📦' : '🛍️'} {l.title}
                          </Link>
                        ))}
                        {seller.listings.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setSelectedSellerModal(seller)}
                            className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 cursor-pointer"
                          >
                            +{seller.listings.length - 3} más
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fila Inferior Móvil: Enlaces rápidos */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3 flex-wrap md:hidden">
                    <button
                      type="button"
                      onClick={() => handleCopyContact(seller)}
                      className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <span>📋</span>
                      <span>{t.directory.copyContact}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSellerModal(seller)}
                      className="font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <span>{t.directory.viewDetailBtn}</span>
                      <span>↗</span>
                    </button>
                  </div>
                </div>

                {/* Columna Derecha: Canales de Contacto Directo y Acciones */}
                <div className="flex md:flex-col justify-between md:justify-center items-stretch gap-2 md:w-48 shrink-0 md:border-l md:border-zinc-100 md:dark:border-zinc-800/80 md:pl-4 pt-3 md:pt-0 border-t border-zinc-100 md:border-t-0 dark:border-zinc-800/80">
                  {/* Botón WhatsApp */}
                  {seller.whatsapp ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
                    >
                      <span>💬</span>
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-400 cursor-not-allowed dark:bg-zinc-800"
                    >
                      <span>💬</span>
                      <span>Sin WhatsApp</span>
                    </button>
                  )}

                  {/* Botón Ver Catálogo del Vendedor */}
                  <Link
                    href={`/catalogo?seller=${seller.id}`}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/60 transition-colors text-center"
                  >
                    <span>🛍️</span>
                    <span>{t.directory.viewCatalog}</span>
                  </Link>

                  {/* Acciones Secundarias en Desktop */}
                  <div className="hidden md:flex items-center justify-between gap-1 pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleCopyContact(seller)}
                      className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                      title={t.directory.copyContact}
                    >
                      <span>📋</span>
                      <span>Copiar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSellerModal(seller)}
                      className="font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ficha</span>
                      <span>↗</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSellers.map((seller) => {
            const initial = seller.business_name ? seller.business_name[0].toUpperCase() : 'C'
            const whatsappUrl = formatWhatsappUrl(seller.whatsapp, seller.business_name)

            return (
              <div
                key={seller.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  {/* Cabecera de la Tarjeta */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-lg font-black text-white shadow-sm">
                      {initial}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base truncate">
                          {seller.business_name}
                        </h3>
                        {seller.verified ? (
                          <span
                            title={t.directory.verifiedBadge}
                            className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800"
                          >
                            ✓ Verificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            En validación
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        {seller.business_type && (
                          <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            🏷️ {seller.business_type}
                          </span>
                        )}
                        {seller.city && (
                          <span className="text-[11px] text-zinc-500">📍 {seller.city}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating y Reputación */}
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="font-bold text-amber-500">★</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {seller.rating_avg > 0 ? Number(seller.rating_avg).toFixed(1) : '5.0'}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      ({seller.rating_count || 0} opiniones)
                    </span>
                    {seller.listingsCount !== undefined && (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          📦 {seller.listingsCount} {t.directory.activeOffers}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Descripción del Negocio */}
                  {seller.description ? (
                    <p className="mt-2.5 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {seller.description}
                    </p>
                  ) : (
                    <p className="mt-2.5 text-xs italic text-zinc-400">
                      Comercio registrado en la plataforma.
                    </p>
                  )}

                  {/* Mini-preview de publicaciones (si tiene) */}
                  {seller.listings && seller.listings.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Ofertas destacadas:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {seller.listings.slice(0, 2).map((l) => (
                          <Link
                            key={l.id}
                            href={`/catalogo/${l.id}`}
                            className="rounded-lg bg-zinc-50 px-2.5 py-1 text-[11px] text-zinc-700 hover:bg-purple-50 hover:text-purple-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 transition-colors truncate max-w-[200px]"
                          >
                            🛍️ {l.title}
                          </Link>
                        ))}
                        {seller.listings.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setSelectedSellerModal(seller)}
                            className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                          >
                            +{seller.listings.length - 2} más
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Zona de Contacto Directo y Acciones */}
                <div className="mt-5 space-y-2.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Botón WhatsApp */}
                    {seller.whatsapp ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
                      >
                        <span>💬</span>
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-400 cursor-not-allowed dark:bg-zinc-800"
                      >
                        <span>💬</span>
                        <span>Sin WhatsApp</span>
                      </button>
                    )}

                    {/* Botón Llamada */}
                    {seller.phone ? (
                      <a
                        href={`tel:${seller.phone}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <span>📞</span>
                        <span>Llamar</span>
                      </a>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-400 cursor-not-allowed dark:bg-zinc-800"
                      >
                        <span>📞</span>
                        <span>Sin Teléfono</span>
                      </button>
                    )}
                  </div>

                  {/* Acciones Secundarias: Copiar y Ver Ficha */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleCopyContact(seller)}
                      className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-semibold text-[11px] flex items-center gap-1"
                    >
                      <span>📋</span>
                      <span>{t.directory.copyContact}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSellerModal(seller)}
                      className="font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-[11px] flex items-center gap-1"
                    >
                      <span>{t.directory.viewDetailBtn}</span>
                      <span>↗</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 4. Modal Detallado de Ficha Comercial del Vendedor */}
      {selectedSellerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            {/* Botón de Cierre */}
            <button
              type="button"
              onClick={() => setSelectedSellerModal(null)}
              className="absolute top-4 right-4 rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              ✕
            </button>

            {/* Cabecera del Comercio */}
            <div className="flex items-start gap-4 pr-8">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-2xl font-black text-white shadow-md">
                {selectedSellerModal.business_name[0]?.toUpperCase() || 'C'}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {selectedSellerModal.business_name}
                  </h2>
                  {selectedSellerModal.verified ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                      ✓ Verificado Oficialmente
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      En Validación
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  {selectedSellerModal.business_type && (
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      🏷️ {selectedSellerModal.business_type}
                    </span>
                  )}
                  {selectedSellerModal.city && (
                    <span>📍 {selectedSellerModal.city}</span>
                  )}
                  <span className="text-amber-500 font-bold">
                    ★ {selectedSellerModal.rating_avg > 0 ? Number(selectedSellerModal.rating_avg).toFixed(1) : '5.0'} ({selectedSellerModal.rating_count || 0} reseñas)
                  </span>
                </div>
              </div>
            </div>

            {/* Descripción */}
            {selectedSellerModal.description && (
              <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-xs text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 leading-relaxed border border-zinc-100 dark:border-zinc-800">
                <span className="block font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  Acerca del negocio:
                </span>
                {selectedSellerModal.description}
              </div>
            )}

            {/* Datos de Contacto Directo */}
            <div className="mt-5 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>💬</span>
                  <span>{t.directory.contactDirect}</span>
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                  {t.directory.directWhatsappNotice}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {selectedSellerModal.whatsapp && (
                  <a
                    href={formatWhatsappUrl(selectedSellerModal.whatsapp, selectedSellerModal.business_name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
                  >
                    <span>💬</span>
                    <span>WhatsApp: {selectedSellerModal.whatsapp}</span>
                  </a>
                )}

                {selectedSellerModal.phone && (
                  <a
                    href={`tel:${selectedSellerModal.phone}`}
                    className="flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300 transition-colors"
                  >
                    <span>📞</span>
                    <span>Teléfono: {selectedSellerModal.phone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Lista de Publicaciones Activas */}
            <div className="mt-6">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <span>🛍️</span>
                  <span>{t.directory.publishedOffers}</span>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    {selectedSellerModal.listings?.length || 0}
                  </span>
                </h4>

                <Link
                  href={`/catalogo?seller=${selectedSellerModal.id}`}
                  onClick={() => setSelectedSellerModal(null)}
                  className="text-xs font-bold text-purple-600 hover:underline dark:text-purple-400"
                >
                  Ver todo en catálogo ↗
                </Link>
              </div>

              {selectedSellerModal.listings && selectedSellerModal.listings.length > 0 ? (
                <div className="mt-3 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {selectedSellerModal.listings.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-2.5 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">
                            {l.type === 'service' ? 'Servicio' : 'Producto'}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                          {l.title}
                        </h5>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">
                          {l.price !== null
                            ? `$ ${l.price.toLocaleString('es-CO')} ${l.price_unit ? `/${l.price_unit}` : ''}`
                            : 'Cotización'}
                        </span>
                        <Link
                          href={`/catalogo/${l.id}`}
                          onClick={() => setSelectedSellerModal(null)}
                          className="block text-[11px] font-bold text-purple-600 hover:underline dark:text-purple-400"
                        >
                          Ver detalle ↗
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs italic text-zinc-500 text-center py-4">
                  {t.directory.noOffersYet}
                </p>
              )}
            </div>

            {/* Pie del Modal */}
            <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => handleCopyContact(selectedSellerModal)}
                className="rounded-xl border border-zinc-300 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
              >
                📋 {t.directory.copyContact}
              </button>

              <button
                type="button"
                onClick={() => setSelectedSellerModal(null)}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
