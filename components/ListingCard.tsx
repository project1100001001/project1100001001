'use client'

import Link from 'next/link'
import type { ListingWithRelations } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface ListingCardProps {
  listing: ListingWithRelations
}

export default function ListingCard({ listing }: ListingCardProps) {
  const { t, locale } = useTranslation()

  // Format price
  const formattedPrice =
    listing.price !== null
      ? `$ ${listing.price.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}`
      : t.common.quoteOnRequest

  // Primary image
  const primaryMedia = listing.listing_media?.sort((a, b) => a.position - b.position)[0]
  const imageUrl = primaryMedia?.url

  // Type badge styling & label
  const typeMap: Record<string, { label: string; color: string }> = {
    product: {
      label: t.common.product,
      color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    },
    service: {
      label: t.common.service,
      color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    },
    article: {
      label: t.common.article,
      color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    },
  }

  const currentType = typeMap[listing.type] || {
    label: listing.type,
    color: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  }

  // Status badge for owner view (if draft/submitted/rejected)
  const statusBadges: Record<string, { label: string; color: string }> = {
    draft: { label: t.common.draft, color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
    submitted: { label: t.common.inReview, color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    rejected: { label: t.common.rejected, color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
  }

  return (
    <Link
      href={`/catalogo/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            <span className="text-4xl">
              {listing.type === 'service' ? '🛠️' : listing.type === 'article' ? '📦' : '🛍️'}
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <span
            className={`rounded-md border px-2 py-0.5 text-[11px] font-medium backdrop-blur-md ${currentType.color}`}
          >
            {currentType.label}
          </span>
          {listing.status && listing.status !== 'published' && statusBadges[listing.status] && (
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${statusBadges[listing.status].color}`}
            >
              {statusBadges[listing.status].label}
            </span>
          )}
        </div>

        {listing.category && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
              {listing.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <h3 className="text-base font-semibold text-zinc-900 line-clamp-2 group-hover:text-emerald-600 transition-colors dark:text-zinc-50 dark:group-hover:text-emerald-400">
          {listing.title}
        </h3>

        {/* Price & Unit */}
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {formattedPrice}
          </span>
          {listing.price !== null && listing.price_unit && (
            <span className="text-xs text-zinc-500">/ {listing.price_unit}</span>
          )}
        </div>

        {/* Description snippet */}
        {listing.description && (
          <p className="mt-1.5 text-xs text-zinc-600 line-clamp-2 dark:text-zinc-400">
            {listing.description}
          </p>
        )}

        {/* Rating Stars Badge */}
        {listing.seller?.rating_avg && Number(listing.seller.rating_avg) > 0 ? (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs">
            <span className="text-amber-400 font-bold">★</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">
              {Number(listing.seller.rating_avg).toFixed(1)}
            </span>
            <span className="text-[11px] text-zinc-400">
              ({listing.seller.rating_count || 0})
            </span>
          </div>
        ) : null}

        <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          {/* Seller / Business */}
          <div className="flex items-center gap-1.5 truncate max-w-[65%]">
            <span className="text-xs">🏢</span>
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
            <div className="flex items-center gap-1 truncate text-zinc-500">
              <span>📍</span>
              <span className="truncate">{listing.city}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
