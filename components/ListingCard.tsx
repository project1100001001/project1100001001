'use client'

import Link from 'next/link'
import type { ListingWithRelations } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'
import { getWhatsappUrl, getListingReferenceCode } from '@/lib/useContinuousScroll'

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

  const referenceCode = getListingReferenceCode(listing.id, listing.attrs)
  const whatsappUrl = getWhatsappUrl(
    listing.seller?.whatsapp || listing.seller?.phone || null,
    listing.seller?.business_name || 'Comercio',
    listing.title,
    locale,
    {
      listingId: listing.id,
      referenceCode,
      type: listing.type,
      categoryName: listing.category?.name || null,
      price: listing.price,
      priceUnit: listing.price_unit,
      city: listing.city || listing.seller?.city || null,
      attrs: listing.attrs || null,
    }
  )

  // Type badge styling & label (sin emojis redundantes)
  const typeMap: Record<string, { label: string; shortLabel: string; color: string }> = {
    product: {
      label: locale === 'en' ? 'Product (New)' : 'Producto (Nuevo)',
      shortLabel: locale === 'en' ? 'New' : 'Nuevo',
      color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    },
    service: {
      label: locale === 'en' ? 'Service' : 'Servicio',
      shortLabel: locale === 'en' ? 'Service' : 'Servicio',
      color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    },
    article: {
      label: locale === 'en' ? 'Article (Used)' : 'Artículo (Usado)',
      shortLabel: locale === 'en' ? 'Used' : 'Usado',
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
  // 1. MODO DE VISUALIZACIÓN DE LISTA (3 líneas bien distribuidas aprovechando el ancho con margen antes de los botones)
  // =========================================================================
  if (viewMode === 'list') {
    const extraDetail =
      listing.type === 'service'
        ? listing.attrs?.modalidad || listing.attrs?.tiempo_entrega || null
        : listing.attrs?.condition || listing.attrs?.delivery_method || null

    const descriptionLine =
      listing.description?.trim() ||
      (listing.type === 'service'
        ? 'Servicio profesional con atención directa y cotización inmediata.'
        : 'Publicación disponible para entrega o coordinación directa con el vendedor.')

    return (
      <div className="group flex items-center justify-between gap-2 sm:gap-5 rounded-xl border border-zinc-200 bg-white px-2.5 py-2.5 sm:px-4 sm:py-3 shadow-2xs hover:border-emerald-500/50 transition-all dark:border-zinc-800 dark:bg-zinc-900">
        {/* Miniatura */}
        <Link
          href={`/catalogo/${listing.id}`}
          className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/70 dark:border-zinc-800"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="text-[10px] font-bold uppercase text-zinc-400">
              {currentType.shortLabel.slice(0, 3)}
            </span>
          )}
        </Link>

        {/* Bloque central en 3 líneas expandidas horizontalmente en móvil y con margen amplio en web */}
        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1 pr-1 sm:pr-6 lg:pr-10">
          {/* Línea 1: Etiqueta de tipo + Título principal expandido a lo ancho */}
          <div className="w-full min-w-0 flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex items-center gap-1.5 sm:gap-2 flex-1">
              <span className={`shrink-0 rounded border px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold leading-none ${currentType.color}`}>
                {currentType.shortLabel}
              </span>

              <Link
                href={`/catalogo/${listing.id}`}
                className="min-w-0 flex-1 truncate text-xs sm:text-sm font-bold text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-50 dark:group-hover:text-emerald-400 transition-colors"
                title={listing.title}
              >
                {listing.title}
              </Link>

              {showSellerStatus && listing.status && listing.status !== 'published' && statusBadges[listing.status] && (
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${statusBadges[listing.status].color}`}>
                  {statusBadges[listing.status].label}
                </span>
              )}
            </div>

            <div className="hidden md:flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
              {listing.category && (
                <span className="font-medium text-zinc-600 dark:text-zinc-300">
                  {listing.category.name}
                </span>
              )}
              {listing.city && (
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {listing.city}
                </span>
              )}
            </div>
          </div>

          {/* Línea 2: Línea adicional de texto informativo / descripción expandida en todo el ancho disponible */}
          <p className="w-full truncate text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400">
            {descriptionLine}
          </p>

          {/* Línea 3: Metadatos redistribuidos a lo ancho del bloque central */}
          <div className="w-full flex items-center justify-between gap-2 sm:gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 truncate">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                {listing.seller?.business_name || t.common.seller}
              </span>
              {listing.seller?.verified && (
                <span className="hidden sm:inline text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                  Verificado
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {listing.category && (
                <span className="md:hidden truncate max-w-[140px]">
                  {listing.category.name}
                </span>
              )}
              {listing.city && (
                <span className="md:hidden font-medium text-zinc-600 dark:text-zinc-300">
                  {listing.city}
                </span>
              )}
              {extraDetail && (
                <span className="hidden sm:inline text-zinc-500 dark:text-zinc-400">
                  {extraDetail}
                </span>
              )}
              <span className="hidden lg:inline font-mono text-[10px] text-zinc-400">
                Ref: {referenceCode}
              </span>
            </div>
          </div>
        </div>

        {/* Precio y Acciones a la derecha: en móvil el precio va sobre los botones de acción; en web se mantiene en fila */}
        <div className="shrink-0 flex flex-col items-end justify-center gap-1 sm:flex-row sm:items-center sm:gap-3 pl-2 sm:pl-4 border-l border-zinc-100 dark:border-zinc-800/80">
          <div className="text-right whitespace-nowrap leading-tight">
            <span className="block text-[11px] sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formattedPrice}
            </span>
            {listing.price !== null && listing.price_unit && (
              <span className="hidden sm:block text-[10px] text-zinc-400">
                / {listing.price_unit}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contactar por WhatsApp"
                className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shrink-0 shadow-2xs"
                title="Contactar al vendedor por WhatsApp"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  aria-hidden="true"
                >
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.625.846 5.059 2.284 7.033l-1.494 5.457 5.601-1.469c1.911 1.253 4.195 1.979 6.609 1.979 6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
                </svg>
              </a>
            )}

            <Link
              href={`/catalogo/${listing.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-2 sm:px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Ver
            </Link>
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
          <div className="flex h-full w-full items-center justify-center text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            {currentType.label}
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <span
            className={`rounded-md border px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium backdrop-blur-md ${currentType.color}`}
          >
            {currentType.shortLabel}
          </span>
          <span
            className="rounded-md border border-emerald-300 bg-emerald-50/90 px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-emerald-900 backdrop-blur-md dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-200"
            title="Referencia del producto o servicio"
          >
            {referenceCode}
          </span>
          {listing.attrs?.special_runway_title && (
            <span className="rounded-md bg-amber-100/95 border border-amber-300 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-amber-900 backdrop-blur-md truncate max-w-[140px]">
              {listing.attrs.special_runway_title}
            </span>
          )}
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
        <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 line-clamp-2 group-hover:text-emerald-600 transition-colors dark:text-zinc-50 dark:group-hover:text-emerald-400">
          {listing.title}
        </h3>

        {/* Price & Unit */}
        <div className="mt-1.5 flex items-baseline gap-1 flex-wrap">
          <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
            {formattedPrice}
          </span>
          {listing.price !== null && listing.price_unit && (
            <span className="text-[10px] sm:text-xs text-zinc-500">/ {listing.price_unit}</span>
          )}
        </div>

        {/* Description snippet */}
        {listing.description && (
          <p className="mt-1 text-[11px] sm:text-xs text-zinc-600 line-clamp-2 dark:text-zinc-400">
            {listing.description}
          </p>
        )}

        {/* Rating Badge */}
        {listing.seller?.rating_avg && Number(listing.seller.rating_avg) > 0 ? (
          <div className="mt-1.5 flex items-center gap-1 text-[11px]">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {Number(listing.seller.rating_avg).toFixed(1)}
            </span>
            <span className="text-[10px] text-zinc-400">
              ({listing.seller.rating_count || 0})
            </span>
          </div>
        ) : null}

        <div className="mt-auto pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-1 text-[10px] sm:text-xs text-zinc-500">
          {/* Seller / Business */}
          <div className="flex items-center gap-1 truncate max-w-[65%]">
            <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">
              {listing.seller?.business_name || t.common.seller}
            </span>
            {listing.seller?.verified && (
              <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400 font-semibold" title={t.common.verified}>
                Verificado
              </span>
            )}
          </div>

          {/* Location */}
          {listing.city && (
            <span className="truncate text-zinc-500">{listing.city}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
