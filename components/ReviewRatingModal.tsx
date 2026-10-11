'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n'
import type { Review } from '@/lib/types'

interface ReviewRatingModalProps {
  isOpen: boolean
  onClose: () => void
  listingId: string
  listingTitle: string
  sellerId: string
  sellerName?: string
  listingType?: string
  saleId?: string | null
  onSuccess?: (newReview: Review) => void
}

export default function ReviewRatingModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  sellerId,
  sellerName,
  listingType = 'product',
  saleId = null,
  onSuccess,
}: ReviewRatingModalProps) {
  const { t, locale } = useTranslation()
  const supabase = createClient()

  // Form State
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [recommend, setRecommend] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const starLabels: Record<number, string> = {
    1: t.reviews.star1,
    2: t.reviews.star2,
    3: t.reviews.star3,
    4: t.reviews.star4,
    5: t.reviews.star5,
  }

  const activeStar = hoverRating || rating

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1 || rating > 5) {
      setErrorMsg(locale === 'en' ? 'Please select a star rating from 1 to 5.' : 'Por favor selecciona una calificación de 1 a 5 estrellas.')
      return
    }

    if (!comment.trim() || comment.trim().length < 10) {
      setErrorMsg(
        locale === 'en'
          ? 'Comment must be at least 10 characters long to validate reputation.'
          : 'El comentario de calificación es obligatorio y debe tener al menos 10 caracteres.'
      )
      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setErrorMsg(
          locale === 'en'
            ? 'You must be logged in to leave a review.'
            : 'Debes iniciar sesión para registrar una calificación.'
        )
        setSubmitting(false)
        return
      }

      const reviewPayload = {
        listing_id: listingId,
        seller_id: sellerId,
        buyer_user_id: user.id,
        sale_id: saleId || null,
        rating,
        comment: comment.trim(),
        recommend,
        status: 'published',
      }

      const { data: insertedReview, error: reviewError } = await supabase
        .from('review')
        .insert([reviewPayload])
        .select(`
          *,
          buyer:buyer_user_id (id, full_name, city, avatar_url)
        `)
        .single()

      if (reviewError) throw reviewError

      if (saleId) {
        await supabase
          .from('sale')
          .update({ has_reviewed: true })
          .eq('id', saleId)
      }

      if (onSuccess && insertedReview) {
        onSuccess(insertedReview as unknown as Review)
      }

      onClose()
    } catch (err: any) {
      console.error('Error enviando reseña:', err)
      setErrorMsg(err.message || t.reviews.errorNotice)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-200">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {t.reviews.modalTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Resumen del Artículo */}
        <div className="mt-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            {listingType === 'service' ? '⏱️ Servicio Recibido' : '📦 Producto Recibido'}
          </span>
          <h4 className="mt-0.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {listingTitle}
          </h4>
          {sellerName && (
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
              Vendido por: <strong className="text-emerald-600 dark:text-emerald-400">{sellerName}</strong>
            </span>
          )}
        </div>

        <p className="mt-2 text-[11px] text-zinc-500">
          {t.reviews.modalSubtitle}
        </p>

        {errorMsg && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Selector Interactivo de Estrellas */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-center dark:border-amber-950/60 dark:bg-amber-950/20">
            <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-1.5">
              {t.reviews.ratingLabel}
            </label>

            {/* Estrellas 1 a 5 */}
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const filled = starValue <= activeStar
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-3xl transition-transform hover:scale-125 focus:outline-none"
                    aria-label={`${starValue} estrellas`}
                  >
                    <span className={filled ? 'text-amber-400 drop-shadow-xs' : 'text-zinc-300 dark:text-zinc-700'}>
                      ★
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="text-xs font-bold text-amber-800 dark:text-amber-300 mt-1 min-h-[18px]">
              {starLabels[activeStar]}
            </div>
          </div>

          {/* Comentario de Calificación Obligatorio */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              {t.reviews.commentLabel}
            </label>
            <textarea
              required
              rows={3}
              minLength={10}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t.reviews.commentPlaceholder}
              className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-xs text-zinc-900 focus:border-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400">
              <span>{t.reviews.ratingMandatoryNotice}</span>
              <span className={comment.trim().length < 10 ? 'text-amber-500 font-bold' : 'text-emerald-500'}>
                {comment.trim().length}/10 mín
              </span>
            </div>
          </div>

          {/* Recomendación: ¿Recomiendas este producto o servicio? */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <span className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              {t.reviews.recommendLabel}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRecommend(true)}
                className={`flex-1 rounded-lg py-1.5 px-3 text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  recommend
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>👍</span>
                <span>{t.reviews.yes}</span>
              </button>

              <button
                type="button"
                onClick={() => setRecommend(false)}
                className={`flex-1 rounded-lg py-1.5 px-3 text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  !recommend
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>👎</span>
                <span>{t.reviews.no}</span>
              </button>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting || comment.trim().length < 10}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              <span>⭐</span>
              <span>{submitting ? t.reviews.submitting : t.reviews.submitReview}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
