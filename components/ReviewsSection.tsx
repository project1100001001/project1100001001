'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import type { Review } from '@/lib/types'
import ReviewRatingModal from './ReviewRatingModal'

interface ReviewsSectionProps {
  listingId: string
  sellerId: string
  sellerName?: string
  listingTitle: string
  listingType?: string
  initialReviews?: Review[]
}

export default function ReviewsSection({
  listingId,
  sellerId,
  sellerName,
  listingTitle,
  listingType = 'product',
  initialReviews = [],
}: ReviewsSectionProps) {
  const { t, locale } = useTranslation()
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [modalOpen, setModalOpen] = useState(false)

  // Calcular estadísticas de reseñas
  const totalCount = reviews.length
  const avgRating =
    totalCount > 0
      ? (reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / totalCount).toFixed(1)
      : '0.0'

  const countsByStar: Record<number, number> = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  }

  const handleReviewSuccess = (newReview: Review) => {
    setReviews((prev) => [newReview, ...prev])
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs space-y-6">
      {/* Header de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 pb-5 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>⭐</span>
            <span>{t.reviews.title}</span>
          </h2>
          <p className="mt-1 text-xs text-zinc-500 max-w-xl">
            {t.reviews.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-400 transition-colors shrink-0"
        >
          <span>⭐</span>
          <span>{t.reviews.leaveReviewBtn}</span>
        </button>
      </div>

      {/* Resumen de Calificación y Barras de Estrellas */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center rounded-xl bg-zinc-50/70 p-5 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
        {/* Promedio General */}
        <div className="md:col-span-4 text-center md:border-r border-zinc-200 dark:border-zinc-700/60 md:pr-6">
          <div className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-50">
            {avgRating}
          </div>
          <div className="mt-1.5 flex justify-center text-amber-400 text-lg">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={s <= Math.round(Number(avgRating)) ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}>
                ★
              </span>
            ))}
          </div>
          <span className="mt-1 text-xs text-zinc-500 block">
            {totalCount} {t.reviews.totalReviews}
          </span>
        </div>

        {/* Distribución por Estrellas */}
        <div className="md:col-span-8 space-y-1.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = countsByStar[stars] || 0
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 shrink-0 font-bold text-zinc-700 dark:text-zinc-300">
                  {stars} ★
                </span>
                <div className="h-2 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-[11px] text-zinc-400">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Listado de Opiniones Verificadas */}
      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/40 p-8 text-center dark:border-zinc-800 dark:bg-zinc-800/20">
          <span className="text-3xl">🌟</span>
          <p className="mt-2 text-xs text-zinc-500">
            {t.reviews.noReviewsYet}
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-3 text-xs font-bold text-amber-600 hover:text-amber-500 underline"
          >
            {t.reviews.leaveReviewBtn}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const buyerName = rev.buyer?.full_name || 'Comprador Verificado'
            const initials = buyerName.slice(0, 2).toUpperCase()

            return (
              <div
                key={rev.id}
                className="rounded-xl border border-zinc-100 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {initials}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                        {buyerName}
                      </span>
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                        ✓ {t.reviews.verifiedBuyer}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400 text-sm">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className={s <= rev.rating ? 'text-amber-400' : 'text-zinc-200 dark:text-zinc-700'}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(rev.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Comentario */}
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {rev.comment}
                </p>

                {/* Badge de Recomendación */}
                {rev.recommend !== undefined && (
                  <div className="pt-1 flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold">
                    <span>{rev.recommend ? '👍' : '👎'}</span>
                    <span>
                      {rev.recommend
                        ? (locale === 'en' ? 'Recommends this product/service' : 'Recomienda este artículo')
                        : (locale === 'en' ? 'Does not recommend' : 'No recomienda este artículo')}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Calificación */}
      <ReviewRatingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        listingId={listingId}
        listingTitle={listingTitle}
        sellerId={sellerId}
        sellerName={sellerName}
        listingType={listingType}
        onSuccess={handleReviewSuccess}
      />
    </div>
  )
}
