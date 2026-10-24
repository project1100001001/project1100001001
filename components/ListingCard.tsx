'use client'

import Link from 'next/link'
import type { ListingWithRelations } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface ListingCardProps {
  listing: ListingWithRelations
  viewMode?: 'list' | 'grid'
  showSellerStatus?: boolean
}

export default function ListingCard({
  listing,
  viewMode = 'list',
  showSellerStatus = false,
}: ListingCardProps) {
  const { t, locale } = useTranslation()

  // Format price
  const formattedPrice =
    listing.price !== null
      ? `$ ${listing.price.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}`
      : t.common.quoteOnRequest

  // Primary image
  const primaryMedia = listing.listing_media?.sort((a, b) => a.position - b.position)[0]
  const imageUrl = primaryMedia?.url

  // Helper para WhatsApp
  const formatWhatsappUrl = (phoneRaw: string | null | undefined, businessName: string, title: string) => {
    if (!phoneRaw) return ''
    let cleaned = phoneRaw.replace(/\D/g, '')
    if (cleaned.length === 10) {
      cleaned = `57${cleaned}`
    }
    const msg =
      locale === 'en'
        ? `Hello ${businessName}, I am interested in your listing "${title}" on Indie Clasificados.`
        : `Hola ${businessName}, me interesa tu anuncio "${title}" que vi en el catálogo de Indie Clasificados.`
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`
  }

  const whatsappUrl = formatWhatsappUrl(
    listing.seller?.whatsapp || listing.seller?.phone,
    listing.seller?.business_name || 'Comercio',
    listing.title
  )

  // Type badge styling & label
  const typeMap: Record<string, { label: string; shortLabel: string; color: string }> = {
    product: {
      label: locale === 'en' ? '🛍️ Product (New)' : '🛍️ Producto (Nuevo)',
      shortLabel: locale === 'en' ? '🛍️ New' : '🛍️ Nuevo',
      color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    },
    service: {
      label: locale === 'en' ? '🛠️ Service' : '🛠️ Servicio Profesional',
      shortLabel: locale === 'en' ? '🛠️ Service' : '🛠️ Servicio',
      color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    },
    article: {
      label: locale === 'en' ? '📦 Article (Used)' : '📦 Artículo (Usado)',
      shortLabel: locale === 'en' ? '📦 Used' : '📦 Usado',
      color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    },
  }

  const currentType = typeMap[listing.type] || {
    label: listing.type,
    shortLabel: listing.type,
    color: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300',
  }

  // Status badge for owner view (if draft/submitted/rejected)
  const statusBadges: Record<string, { label: string; color: string }> = {
    draft: { label: t.common.draft, color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
    submitted: { label: t.common.inReview, color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    rejected: { label: t.common.rejected, color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
  }

  // =========================================================================
  // 1. MODO DE VISUALIZACIÓN DE LISTA (Predeterminado - Imagen Pequeña)
  // =========================================================================
  if (viewMode === 'list') {
    return (
      <div className="group relative flex flex-row items-start sm:items-stretch rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all dark:border-zinc-800 dark:bg-zinc-900 gap-3 sm:gap-4 overflow-hidden">
        {/* Imagen Pequeña (Thumbnail Compacto Horizontal en Móvil y Desktop) */}
        <Link
          href={`/catalogo/${listing.id}`}
          className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 aspect-square shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center self-start sm:self-center border border-zinc-200/70 dark:border-zinc-800"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400 p-2 text-center select-none">
              <span className="text-2xl sm:text-4xl">
                {listing.type === 'service' ? '🛠️' : listing.type === 'article' ? '📦' : '🛍️'}
              </span>
              {listing.category && (
                <span className="mt-1 text-[9px] font-bold text-zinc-500 truncate max-w-full">
                  {listing.category.name}
                </span>
              )}
            </div>
          )}

          {/* Badge de Tipo en la esquina de la miniatura */}
          <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 flex flex-wrap gap-1">
            <span className={`rounded-md border px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold backdrop-blur-md ${currentType.color}`}>
              {currentType.shortLabel}
            </span>
          </div>
        </Link>

        {/* Contenedor Derecho: Información + Precio y Acciones */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch justify-between min-w-0 gap-2.5 sm:gap-4">
          {/* Zona Central: Información Completa del Anuncio */}
          <div className="flex flex-1 flex-col justify-between min-w-0">
            <div className="space-y-1 sm:space-y-1.5">
              {/* Fila 1: Badges, Categoría y Ciudad */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap text-xs">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap min-w-0">
                  <span className={`hidden sm:inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${currentType.color}`}>
                    {currentType.label}
                  </span>

                  {listing.attrs?.condition && (
                    <span className="rounded-md bg-zinc-100 px-1.5 sm:px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {listing.attrs.condition}
                    </span>
                  )}

                  {listing.category && (
                    <span className="rounded-md bg-purple-50 px-1.5 sm:px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 truncate max-w-[130px] sm:max-w-none">
                      🏷️ {listing.category.name}
                    </span>
                  )}

                  {showSellerStatus && listing.status && listing.status !== 'published' && statusBadges[listing.status] && (
                    <span className={`rounded-md px-1.5 sm:px-2 py-0.5 text-[10px] font-bold ${statusBadges[listing.status].color}`}>
                      {statusBadges[listing.status].label}
                    </span>
                  )}
                </div>

                {/* Ubicación */}
                {listing.city && (
                  <span className="shrink-0 text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    📍 {listing.city}
                  </span>
                )}
              </div>

              {/* Fila 2: Título del Anuncio */}
              <Link href={`/catalogo/${listing.id}`}>
                <h3 className="text-sm sm:text-lg font-bold text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-50 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 sm:line-clamp-2 leading-snug">
                  {listing.title}
                </h3>
              </Link>

              {/* Fila 3: Descripción del Anuncio */}
              {listing.description && (
                <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                  {listing.description}
                </p>
              )}

              {/* Fila 4: Atributos Operativos / Específicos */}
              <div className="hidden sm:flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                {listing.attrs?.tiempo_entrega && (
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    ⏱️ Entrega: {listing.attrs.tiempo_entrega}
                  </span>
                )}
                {listing.attrs?.modalidad && (
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                    📍 Modalidad: {listing.attrs.modalidad}
                  </span>
                )}
                {listing.attrs?.delivery_method && (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    🚚 {listing.attrs.delivery_method}
                  </span>
                )}
                {listing.stock !== null && listing.stock !== undefined && listing.type !== 'service' && (
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    📦 Stock: {listing.stock} {listing.stock === 1 ? 'disponible' : 'disponibles'}
                  </span>
                )}
              </div>
            </div>

            {/* Fila 5: Datos del Comercio / Vendedor y Reputación */}
            <div className="mt-1.5 sm:mt-2.5 pt-1.5 sm:pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                <span className="text-zinc-500 truncate max-w-[160px] sm:max-w-none">
                  Por: <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{listing.seller?.business_name || t.common.seller}</strong>
                </span>
                {listing.seller?.verified && (
                  <span
                    title="Comercio Verificado Oficialmente"
                    className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    ✓ Verificado
                  </span>
                )}
                {listing.seller?.rating_avg && Number(listing.seller.rating_avg) > 0 && (
                  <div className="flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold text-amber-500">
                    <span>★</span>
                    <span>{Number(listing.seller.rating_avg).toFixed(1)}</span>
                    <span className="text-zinc-400">({listing.seller.rating_count || 0})</span>
                  </div>
                )}
              </div>

              {listing.seller_id && (
                <Link
                  href={`/catalogo?seller=${listing.seller_id}`}
                  className="hidden md:inline text-[11px] font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline"
                >
                  Más ofertas de este comercio →
                </Link>
              )}
            </div>
          </div>

          {/* Zona Lateral Derecha: Precio y Botones de Acción */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-zinc-100 dark:border-zinc-800 pt-2 sm:pt-0 sm:pl-4 sm:min-w-[170px] shrink-0 gap-2 sm:gap-3">
            <div className="text-left sm:text-right min-w-0">
              <span className="hidden sm:block text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                {listing.type === 'service' ? 'Tarifa Referencial' : 'Precio'}
              </span>
              <div className="flex items-baseline sm:justify-end gap-1 flex-wrap">
                <span className="text-sm sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formattedPrice}
                </span>
                {listing.price !== null && listing.price_unit && (
                  <span className="text-[9px] sm:text-[10px] text-zinc-500 font-semibold">/ {listing.price_unit}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 rounded-lg sm:rounded-xl bg-emerald-600 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
                  title="Contactar al vendedor por WhatsApp"
                >
                  <span>💬</span>
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              )}

              <Link
                href={`/catalogo/${listing.id}`}
                className="inline-flex items-center justify-center gap-1 rounded-lg sm:rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
              >
                <span>Ver</span>
                <span className="hidden sm:inline">detalle</span>
                <span>↗</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // 2. MODO CUADRÍCULA (GRID)
  // =========================================================================
  return (
    <Link
      href={`/catalogo/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            <span className="text-3xl sm:text-4xl">
              {listing.type === 'service' ? '🛠️' : listing.type === 'article' ? '📦' : '🛍️'}
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <span
            className={`rounded-md border px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium backdrop-blur-md ${currentType.color}`}
          >
            {currentType.shortLabel}
          </span>
          {showSellerStatus && listing.status && listing.status !== 'published' && statusBadges[listing.status] && (
            <span
              className={`rounded-md px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium ${statusBadges[listing.status].color}`}
            >
              {statusBadges[listing.status].label}
            </span>
          )}
        </div>

        {listing.category && (
          <div className="absolute bottom-2 left-2 right-2">
            <span className="inline-block max-w-full truncate rounded-md bg-black/60 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium text-white backdrop-blur-md">
              {listing.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {/* Title */}
        <h3 className="text-xs sm:text-base font-semibold text-zinc-900 line-clamp-2 group-hover:text-emerald-600 transition-colors dark:text-zinc-50 dark:group-hover:text-emerald-400">
          {listing.title}
        </h3>

        {/* Price & Unit */}
        <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1 flex-wrap">
          <span className="text-sm sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formattedPrice}
          </span>
          {listing.price !== null && listing.price_unit && (
            <span className="text-[10px] sm:text-xs text-zinc-500">/ {listing.price_unit}</span>
          )}
        </div>

        {/* Description snippet */}
        {listing.description && (
          <p className="mt-1 sm:mt-1.5 text-[11px] sm:text-xs text-zinc-600 line-clamp-2 dark:text-zinc-400">
            {listing.description}
          </p>
        )}

        {/* Rating Stars Badge */}
        {listing.seller?.rating_avg && Number(listing.seller.rating_avg) > 0 ? (
          <div className="mt-2 flex items-center gap-1 text-[11px] sm:text-xs">
            <span className="text-amber-400 font-bold">★</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {Number(listing.seller.rating_avg).toFixed(1)}
            </span>
            <span className="text-[10px] sm:text-[11px] text-zinc-400">
              ({listing.seller.rating_count || 0})
            </span>
          </div>
        ) : null}

        <div className="mt-auto pt-2.5 sm:pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-1 text-[10px] sm:text-xs text-zinc-500">
          {/* Seller / Business */}
          <div className="flex items-center gap-1 truncate max-w-[65%]">
            <span>🏢</span>
            <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">
              {listing.seller?.business_name || t.common.seller}
            </span>
            {listing.seller?.verified && (
              <span className="text-blue-500" title={t.common.verified}>
                ✓
              </span>
            )}
          </div>

          {/* Location */}
          {listing.city && (
            <div className="flex items-center gap-0.5 truncate text-zinc-500">
              <span>📍</span>
              <span className="truncate">{listing.city}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
