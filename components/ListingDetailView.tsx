'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ListingWithRelations } from '@/lib/types'

interface ListingDetailViewProps {
  listing: ListingWithRelations
}

export default function ListingDetailView({ listing }: ListingDetailViewProps) {
  const media = listing.listing_media?.sort((a, b) => a.position - b.position) || []
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const activeImageUrl = media[selectedImageIndex]?.url || media[0]?.url

  // Format price
  const formattedPrice =
    listing.price !== null
      ? `$ ${listing.price.toLocaleString('es-CO')}`
      : 'Cotización a solicitud'

  // Format seller whatsapp link
  const sellerPhone = listing.seller?.whatsapp || listing.seller?.phone
  const cleanPhone = sellerPhone ? sellerPhone.replace(/\D/g, '') : null
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hola, me interesa tu publicación "${listing.title}" en el Marketplace.`
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

      // Insertar fila en contact_event (el trigger de la BD incrementa listing.contact_count automáticamente)
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

  // Type metadata
  const typeMap: Record<string, { label: string; icon: string }> = {
    product: { label: 'Producto', icon: '🛍️' },
    service: { label: 'Servicio', icon: '🛠️' },
    article: { label: 'Artículo', icon: '📦' },
  }
  const typeInfo = typeMap[listing.type] || { label: listing.type, icon: '🏷️' }

  // Status badges
  const statusInfo: Record<string, { label: string; desc: string; bg: string; text: string }> = {
    draft: {
      label: 'Borrador',
      desc: 'Este anuncio es visible únicamente para ti. No está activo en el catálogo.',
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-700 dark:text-zinc-300',
    },
    submitted: {
      label: 'En revisión (Submitted)',
      desc: 'Este anuncio fue enviado al equipo de moderación. Pronto será revisado para publicación.',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
    },
    rejected: {
      label: 'Rechazado',
      desc: listing.reject_reason
        ? `Motivo: ${listing.reject_reason}`
        : 'Este anuncio no cumplió con las políticas de publicación.',
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-800 dark:text-red-300',
    },
  }

  const isNotPublished = listing.status && listing.status !== 'published'
  const currentStatus = isNotPublished ? statusInfo[listing.status] : null

  // Parse attrs
  const attrsEntries = Object.entries(listing.attrs || {})

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
        >
          ← Volver al catálogo
        </Link>
      </div>

      {/* Owner preview alert if not published */}
      {currentStatus && (
        <div className={`mb-6 rounded-xl border p-4 ${currentStatus.bg} ${currentStatus.text}`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <strong className="block text-sm font-bold">
                Vista previa del autor: Estado {currentStatus.label}
              </strong>
              <p className="text-xs mt-0.5">{currentStatus.desc}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Gallery (7 cols) */}
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
                <span className="mt-2 text-xs font-medium">Sin imagen disponible</span>
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

          {/* Description Section */}
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-3">
              Descripción
            </h2>
            <div className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
              {listing.description || 'El vendedor no incluyó una descripción adicional.'}
            </div>
          </div>

          {/* Technical Specs / Attrs Section */}
          {attrsEntries.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                Características y Atributos
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {attrsEntries.map(([key, val]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/50"
                  >
                    <dt className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      {key.replace(/_/g, ' ')}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {String(val)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Right Column: Listing Details & Seller Contact (5 cols) */}
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
              <span className="text-xs text-zinc-500 block mb-1">Precio</span>
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

            {/* Stock info */}
            {listing.stock !== null && listing.type !== 'service' && (
              <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>
                  {listing.stock > 0
                    ? `${listing.stock} disponibles en stock`
                    : 'Agotado temporalmente'}
                </span>
              </div>
            )}

            {/* Seller Contact Card */}
            <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800 space-y-4">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                Vendido y ofrecido por:
              </span>

              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    {listing.seller?.business_name || 'Negocio'}
                    {listing.seller?.verified && (
                      <span className="text-blue-500 text-sm" title="Vendedor Verificado">
                        ✓
                      </span>
                    )}
                  </h4>
                  {listing.seller?.city && (
                    <span className="text-xs text-zinc-500">
                      Ubicación: {listing.seller.city}
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
                    <span>{contacting ? 'Conectando...' : '💬 Contactar por WhatsApp'}</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-500 dark:bg-zinc-800"
                  >
                    WhatsApp no registrado
                  </button>
                )}

                {listing.seller?.phone && (
                  <a
                    href={`tel:${listing.seller.phone}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span>📞 Llamar: {listing.seller.phone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
              <div>Publicado: {new Date(listing.created_at).toLocaleDateString('es-CO')}</div>
              <div>ID de publicación: {listing.id}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
