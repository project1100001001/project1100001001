'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ListingWithRelations, Review } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'
import { getPublicListingSpecs, getListingFreeTrialStatus } from '@/lib/adPolicies'
import ReviewsSection from './ReviewsSection'

interface ListingDetailViewProps {
  listing: ListingWithRelations
  initialReviews?: Review[]
}

export default function ListingDetailView({
  listing,
  initialReviews = [],
}: ListingDetailViewProps) {
  const { t, locale } = useTranslation()
  const media = listing.listing_media?.sort((a, b) => a.position - b.position) || []
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const activeImageUrl = media[selectedImageIndex]?.url || media[0]?.url

  // Format price
  const formattedPrice =
    listing.price !== null
      ? `$ ${listing.price.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}`
      : t.listingDetail.quoteOnRequest

  // Format seller whatsapp link
  const sellerPhone = listing.seller?.whatsapp || listing.seller?.phone
  const cleanPhone = sellerPhone ? sellerPhone.replace(/\D/g, '') : null
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `${t.listingDetail.chatGreetingPrefix} "${listing.title}" ${t.listingDetail.chatGreetingSuffix}`
      )}`
    : null

  const [contacting, setContacting] = useState(false)

  const handleWhatsAppContact = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!whatsappUrl || contacting) return

    setContacting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      await supabase.from('contact_event').insert({
        listing_id: listing.id,
        buyer_user_id: user?.id || null,
        channel: 'whatsapp',
      })
    } catch (err) {
      console.error('Error registrando contact_event:', err)
    } finally {
      setContacting(false)
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Seller ownership & Admin moderation state
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSellerOwner, setIsSellerOwner] = useState(false)
  const [listingStatus, setListingStatus] = useState<string>(listing.status)
  const [rejectReason, setRejectReason] = useState<string | null>(listing.reject_reason || null)
  const [moderating, setModerating] = useState(false)
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectText, setRejectText] = useState('')

  useEffect(() => {
    async function checkViewerPermissions() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Verificar si el usuario autenticado es el vendedor dueño de este producto/servicio
      if (listing.seller?.owner_user_id && listing.seller.owner_user_id === user.id) {
        setIsSellerOwner(true)
      } else if (listing.seller_id) {
        const { data: sellerRow } = await supabase
          .from('seller')
          .select('owner_user_id')
          .eq('id', listing.seller_id)
          .maybeSingle()
        if (sellerRow?.owner_user_id === user.id) {
          setIsSellerOwner(true)
        }
      }

      const { data: profile } = await supabase
        .from('app_user')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (profile?.role === 'admin') {
        setIsAdmin(true)
      }
    }
    checkViewerPermissions()
  }, [listing.seller?.owner_user_id, listing.seller_id])

  const handleAdminApprove = async () => {
    setModerating(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('listing')
        .update({ status: 'published', reject_reason: null })
        .eq('id', listing.id)
      if (error) throw error
      setListingStatus('published')
      setRejectReason(null)
    } catch (err: any) {
      alert(err.message || 'Error al aprobar la publicación')
    } finally {
      setModerating(false)
    }
  }

  const handleAdminReject = async () => {
    if (!rejectText.trim()) return
    setModerating(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('listing')
        .update({ status: 'rejected', reject_reason: rejectText.trim() })
        .eq('id', listing.id)
      if (error) throw error
      setListingStatus('rejected')
      setRejectReason(rejectText.trim())
      setShowRejectInput(false)
    } catch (err: any) {
      alert(err.message || 'Error al rechazar la publicación')
    } finally {
      setModerating(false)
    }
  }

  // Type metadata
  const typeMap: Record<string, { label: string; icon: string }> = {
    product: { label: t.common.product, icon: '🛍️' },
    service: { label: t.common.service, icon: '🛠️' },
    article: { label: t.common.article, icon: '📦' },
  }
  const typeInfo = typeMap[listing.type] || { label: listing.type, icon: '🏷️' }

  // Status badges
  const statusInfo: Record<string, { label: string; desc: string; bg: string; text: string }> = {
    draft: {
      label: t.common.draft,
      desc: locale === 'en' ? 'Visible only to you. Not public in catalog.' : 'Este anuncio es visible únicamente para ti. No está activo en el catálogo.',
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-700 dark:text-zinc-300',
    },
    submitted: {
      label: t.common.inReview,
      desc: locale === 'en' ? 'Submitted to moderation team. Will be reviewed shortly.' : 'Este anuncio fue enviado al equipo de moderación. Pronto será revisado.',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
    },
    rejected: {
      label: t.common.rejected,
      desc: listing.reject_reason
        ? `${locale === 'en' ? 'Reason' : 'Motivo'}: ${listing.reject_reason}`
        : (locale === 'en' ? 'Does not comply with listing policies.' : 'Este anuncio no cumplió con las políticas de publicación.'),
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-800 dark:text-red-300',
    },
  }

  const isNotPublished = listingStatus && listingStatus !== 'published'
  const currentStatus = isNotPublished ? statusInfo[listingStatus] : null

  // Atributos públicos pensados para compradores (sin tiempos de publicidad ni historiales internos)
  const publicSpecs = getPublicListingSpecs(listing.attrs, locale)

  // Datos exclusivos del perfil vendedor (tiempo de publicidad y auditoría de precios)
  const canViewSellerExclusiveInfo = isSellerOwner || isAdmin
  const adTrialStatus = getListingFreeTrialStatus(listing)
  const priceHistoryCount = Array.isArray(listing.attrs?.price_history)
    ? listing.attrs.price_history.length
    : 0
  const adPlacementRaw = listing.attrs?.ad_placement || 'free_trial_7d'
  const adPlacementLabel =
    adPlacementRaw === 'combo'
      ? 'Plan Combo (Gran Vitrina + Pasarela)'
      : adPlacementRaw === 'gran_vitrina'
      ? 'Plan Gran Vitrina Principal'
      : adPlacementRaw === 'pasarela'
      ? 'Plan Pasarela Continua'
      : '7 Días Iniciales de Publicidad Gratis'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Admin Moderation Bar */}
      {isAdmin && (
        <div className="mb-6 rounded-2xl border-2 border-purple-300 bg-purple-50/90 p-5 shadow-sm dark:border-purple-800 dark:bg-purple-950/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white font-bold text-lg shrink-0">
                🛡️
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {t.listingDetail.adminModeration}
                  </h4>
                  <span className="rounded-md bg-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-900 dark:bg-purple-900 dark:text-purple-200 uppercase">
                    {t.common.status}: {listingStatus}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  {locale === 'en'
                    ? 'As an administrator, approve this listing to make it visible in the public catalog, or reject it with notes.'
                    : 'Como administrador, puedes aprobar este anuncio para que sea visible en el catálogo público o rechazarlo indicando el motivo.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {listingStatus !== 'published' ? (
                <button
                  type="button"
                  disabled={moderating}
                  onClick={handleAdminApprove}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <span>✓</span>
                  <span>{moderating ? t.common.loading : t.listingDetail.approve}</span>
                </button>
              ) : (
                <span className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <span>✓</span>
                  <span>{t.common.approved}</span>
                </span>
              )}

              {listingStatus !== 'rejected' && (
                <button
                  type="button"
                  disabled={moderating}
                  onClick={() => setShowRejectInput(!showRejectInput)}
                  className="rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 transition-colors"
                >
                  ✕ {t.listingDetail.reject}
                </button>
              )}
            </div>
          </div>

          {showRejectInput && (
            <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800/60 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={rejectText}
                onChange={(e) => setRejectText(e.target.value)}
                placeholder={t.listingDetail.rejectReasonPlaceholder}
                className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-red-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                type="button"
                disabled={moderating || !rejectText.trim()}
                onClick={handleAdminReject}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t.listingDetail.confirmReject}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Owner preview alert if not published (Solo visible para el vendedor autor o administrador) */}
      {canViewSellerExclusiveInfo && currentStatus && (
        <div className={`mb-6 rounded-xl border p-4 ${currentStatus.bg} ${currentStatus.text}`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <strong className="block text-sm font-bold">
                {locale === 'en' ? 'Seller preview' : 'Vista previa del vendedor'}: {currentStatus.label}
              </strong>
              <p className="text-xs mt-0.5">{currentStatus.desc}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Gallery, Description, Public Buyer Specs & Reviews (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-center">
            {activeImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeImageUrl}
                alt={listing.title}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-400">
                <span className="text-6xl">{typeInfo.icon}</span>
                <span className="mt-2 text-xs font-medium">
                  {locale === 'en' ? 'No image available' : 'Sin imagen disponible'}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails row */}
          {media.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {media.map((item, idx) => (
                <button
                  key={item.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border transition-all ${
                    selectedImageIndex === idx
                      ? 'border-emerald-600 ring-2 ring-emerald-600 ring-offset-2'
                      : 'border-zinc-200 dark:border-zinc-800 hover:opacity-80'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description Section (Pública para compradores) */}
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-3">
              {t.listingDetail.description}
            </h2>
            <div className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
              {listing.description || (locale === 'en' ? 'No additional description provided.' : 'El vendedor no incluyó una descripción adicional.')}
            </div>
          </div>

          {/* Public Technical Specs / Buyer Attributes Section (Limpia de datos de publicidad internos) */}
          {publicSpecs.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                {t.listingDetail.specifications}
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {publicSpecs.map((spec) => (
                  <div
                    key={spec.key}
                    className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/50"
                  >
                    <dt className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      {spec.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Módulo de Reseñas y Calificaciones con Estrellas */}
          <ReviewsSection
            listingId={listing.id}
            sellerId={listing.seller_id}
            sellerName={listing.seller?.business_name}
            listingTitle={listing.title}
            listingType={listing.type}
            initialReviews={initialReviews}
          />
        </div>

        {/* Right Column: Listing Details, Seller Contact & Seller-Only Advertising Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
            {/* Badges: Type and Category */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                <span>{typeInfo.icon}</span>
                <span>{typeInfo.label}</span>
              </span>

              {listing.category && (
                <span className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  {listing.category.name}
                </span>
              )}

              {listing.city && (
                <span className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  📍 {listing.city}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {listing.title}
            </h1>

            {/* Price Box */}
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-xs text-zinc-500 block mb-1">{t.common.price}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                  {formattedPrice}
                </span>
                {listing.price !== null && listing.price_unit && (
                  <span className="text-sm font-medium text-zinc-500">
                    / {listing.price_unit}
                  </span>
                )}
              </div>
            </div>

            {/* Stock info (Visible para el comprador para conocer disponibilidad inmediata) */}
            {listing.stock !== null && listing.type !== 'service' && (
              <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    listing.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
                <span>
                  {listing.stock > 0
                    ? `${listing.stock} ${locale === 'en' ? 'units in stock' : 'disponibles en stock'}`
                    : (locale === 'en' ? 'Temporarily out of stock' : 'Agotado temporalmente')}
                </span>
              </div>
            )}

            {/* Seller Contact Card (Información Pública para Compradores con o sin registro) */}
            <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800 space-y-4">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                {t.listingDetail.sellerInfo}
              </span>

              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    {listing.seller?.business_name || t.common.seller}
                    {listing.seller?.verified && (
                      <span className="text-blue-500 text-sm" title={t.listingDetail.verifiedSeller}>
                        ✓
                      </span>
                    )}
                  </h4>
                  {listing.seller?.city && (
                    <span className="text-xs text-zinc-500">
                      {t.listingDetail.location}: {listing.seller.city}
                    </span>
                  )}
                </div>

                {listing.seller?.rating_avg && Number(listing.seller.rating_avg) > 0 ? (
                  <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    ★ {listing.seller.rating_avg} ({listing.seller.rating_count})
                  </span>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                {whatsappUrl ? (
                  <button
                    type="button"
                    onClick={handleWhatsAppContact}
                    disabled={contacting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors disabled:opacity-75"
                  >
                    <span>{contacting ? t.common.loading : `💬 ${t.listingDetail.contactWhatsApp}`}</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-500 dark:bg-zinc-800"
                  >
                    {locale === 'en' ? 'WhatsApp not registered' : 'WhatsApp no registrado'}
                  </button>
                )}

                {listing.seller?.phone && (
                  <a
                    href={`tel:${listing.seller.phone}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span>📞 {locale === 'en' ? 'Call' : 'Llamar'}: {listing.seller.phone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Public Metadata Footer (Solo fecha de publicación, sin IDs internos) */}
            <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800/80 text-[11px] text-zinc-400">
              <div>
                {t.listingDetail.publishedOn}: {new Date(listing.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO')}
              </div>
            </div>
          </div>

          {/* 🔒 PANEL EXCLUSIVO DEL PERFIL VENDEDOR: TIEMPO DE PUBLICIDAD Y GESTIÓN INTERNA */}
          {canViewSellerExclusiveInfo && (
            <div className="rounded-2xl border-2 border-purple-200 bg-purple-50/40 p-5 sm:p-6 shadow-xs dark:border-purple-900/60 dark:bg-purple-950/20 space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-purple-200/70 pb-3 dark:border-purple-800/60">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-800 dark:bg-purple-900/70 dark:text-purple-200">
                    🔒 Exclusivo Perfil Vendedor
                  </span>
                  <h3 className="mt-1.5 text-sm font-black text-zinc-900 dark:text-zinc-50">
                    {locale === 'en'
                      ? 'Advertising Time & Internal Status'
                      : 'Tiempo de Publicidad y Gestión del Anuncio'}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {locale === 'en'
                      ? 'Hidden from unregistered buyers and buyer profiles.'
                      : 'Esta información es privada de tu negocio y no es visible para los compradores.'}
                  </p>
                </div>
                <span className="text-xl shrink-0">⏱️</span>
              </div>

              {/* Estado del Tiempo de Publicidad */}
              <div className="rounded-xl bg-white p-3.5 border border-purple-200/80 dark:bg-zinc-900 dark:border-purple-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">
                    Tiempo de Publicidad Activa:
                  </span>
                  {adTrialStatus.isFreeTrialActive ? (
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      ⏳ {adTrialStatus.daysRemaining}d {adTrialStatus.hoursRemaining}h restantes
                    </span>
                  ) : (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      ⚠️ Periodo inicial finalizado
                    </span>
                  )}
                </div>

                {/* Barra de progreso del tiempo publicitario */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      adTrialStatus.isFreeTrialActive ? 'bg-purple-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${adTrialStatus.progressPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-zinc-500">
                  <div>
                    <span className="block text-[10px] uppercase text-zinc-400">Inicio publicidad</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {new Date(adTrialStatus.startsAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO')}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-zinc-400">Vencimiento</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {new Date(adTrialStatus.endsAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Metadatos Internos del Vendedor */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl bg-white/80 p-2.5 border border-purple-100 dark:bg-zinc-900/80 dark:border-purple-900/40">
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Modalidad Publicitaria</span>
                  <span className="font-bold text-purple-700 dark:text-purple-300 text-[11px]">
                    {adPlacementLabel}
                  </span>
                </div>
                <div className="rounded-xl bg-white/80 p-2.5 border border-purple-100 dark:bg-zinc-900/80 dark:border-purple-900/40">
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Revisiones de Precio</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">
                    {priceHistoryCount > 0 ? `${priceHistoryCount} registros` : 'Precio inicial'}
                  </span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-zinc-400">
                ID Interno: {listing.id}
              </div>

              {/* Acciones Rápidas exclusivas del Vendedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <Link
                  href={listing.type === 'service' ? '/mis-servicios' : '/mis-publicaciones'}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-purple-300 bg-white px-3 py-2 text-xs font-bold text-purple-800 hover:bg-purple-50 dark:border-purple-700 dark:bg-zinc-900 dark:text-purple-200 transition-colors"
                >
                  <span>🛠️</span>
                  <span>Gestionar Publicación</span>
                </Link>
                <Link
                  href={`/promocionar?listing_id=${listing.id}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition-colors"
                >
                  <span>🚀</span>
                  <span>Impulsar / Extender</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
