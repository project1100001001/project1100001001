'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ListingWithRelations, ListingStatus } from '@/lib/types'

interface AdminModerationPanelProps {
  initialListings: ListingWithRelations[]
}

export default function AdminModerationPanel({
  initialListings,
}: AdminModerationPanelProps) {
  const [listings, setListings] = useState<ListingWithRelations[]>(initialListings)
  const [activeTab, setActiveTab] = useState<'pending' | 'published' | 'rejected' | 'draft' | 'all'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Rejection modal state
  const [rejectingListing, setRejectingListing] = useState<ListingWithRelations | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const supabase = createClient()

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  // Filter listings by tab and search
  const pendingStatuses: ListingStatus[] = ['submitted', 'pending_review']

  const filteredListings = listings.filter((l) => {
    // Tab filter
    if (activeTab === 'pending' && !pendingStatuses.includes(l.status)) return false
    if (activeTab === 'published' && l.status !== 'published') return false
    if (activeTab === 'rejected' && l.status !== 'rejected') return false
    if (activeTab === 'draft' && l.status !== 'draft') return false

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = l.title.toLowerCase().includes(q)
      const matchSeller = l.seller?.business_name.toLowerCase().includes(q)
      const matchCategory = l.category?.name.toLowerCase().includes(q)
      const matchCity = l.city?.toLowerCase().includes(q)
      return matchTitle || matchSeller || matchCategory || matchCity
    }

    return true
  })

  // Counts for tabs
  const pendingCount = listings.filter((l) => pendingStatuses.includes(l.status)).length
  const publishedCount = listings.filter((l) => l.status === 'published').length
  const rejectedCount = listings.filter((l) => l.status === 'rejected').length
  const draftCount = listings.filter((l) => l.status === 'draft').length
  const totalCount = listings.length

  // Handler: Approve listing
  const handleApprove = async (listingId: string) => {
    setProcessingId(listingId)
    try {
      const { error } = await supabase
        .from('listing')
        .update({
          status: 'published',
          reject_reason: null,
        })
        .eq('id', listingId)

      if (error) throw error

      setListings((prev) =>
        prev.map((item) =>
          item.id === listingId
            ? { ...item, status: 'published', reject_reason: null }
            : item
        )
      )

      showToast('Publicación aprobada exitosamente. Ya es visible en el catálogo.')
    } catch (err: any) {
      showToast(err.message || 'Error al aprobar la publicación', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  // Handler: Reject listing
  const handleConfirmReject = async () => {
    if (!rejectingListing) return
    setProcessingId(rejectingListing.id)

    try {
      const { error } = await supabase
        .from('listing')
        .update({
          status: 'rejected',
          reject_reason: rejectReason.trim() || 'No cumple con las políticas de moderación',
        })
        .eq('id', rejectingListing.id)

      if (error) throw error

      setListings((prev) =>
        prev.map((item) =>
          item.id === rejectingListing.id
            ? {
                ...item,
                status: 'rejected',
                reject_reason: rejectReason.trim() || 'No cumple con las políticas de moderación',
              }
            : item
        )
      )

      showToast('Publicación rechazada y notificada al vendedor.')
      setRejectingListing(null)
      setRejectReason('')
    } catch (err: any) {
      showToast(err.message || 'Error al rechazar la publicación', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-900/20'
              : 'bg-red-600 text-white shadow-red-900/20'
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>🛡️</span>
            <span>Cola de Moderación y Publicaciones</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Revisa, aprueba o rechaza los anuncios enviados por los vendedores antes de que aparezcan en el catálogo público.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, vendedor..."
            className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        {[
          {
            id: 'pending',
            label: 'Pendientes por Revisar',
            count: pendingCount,
            color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
          },
          {
            id: 'published',
            label: 'Publicados',
            count: publishedCount,
            color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
          },
          {
            id: 'rejected',
            label: 'Rechazados',
            count: rejectedCount,
            color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
          },
          {
            id: 'draft',
            label: 'Borradores',
            count: draftCount,
            color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
          },
          {
            id: 'all',
            label: 'Todos',
            count: totalCount,
            color: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200',
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-900' : tab.color
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Queue List */}
      {filteredListings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-4xl">
            {activeTab === 'pending' ? '🎉' : '🔍'}
          </span>
          <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50">
            {activeTab === 'pending'
              ? 'No hay publicaciones pendientes de revisión'
              : 'No se encontraron publicaciones en esta sección'}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {activeTab === 'pending'
              ? 'Todos los anuncios enviados han sido moderados y procesados.'
              : 'Prueba cambiando de pestaña o limpiando la barra de búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => {
            const primaryMedia = listing.listing_media?.sort((a, b) => a.position - b.position)[0]
            const isPending = pendingStatuses.includes(listing.status)
            const isProcessing = processingId === listing.id

            return (
              <div
                key={listing.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: Thumbnail & Main Info */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                      {primaryMedia ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={primaryMedia.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">
                          {listing.type === 'service' ? '🛠️' : listing.type === 'article' ? '📦' : '🛍️'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700 uppercase tracking-wider dark:bg-zinc-800 dark:text-zinc-300">
                          {listing.type}
                        </span>

                        {listing.category && (
                          <span className="rounded-md border border-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                            {listing.category.name}
                          </span>
                        )}

                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            listing.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : isPending
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : listing.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {listing.status === 'published'
                            ? 'Publicado'
                            : isPending
                            ? 'En revisión'
                            : listing.status === 'rejected'
                            ? 'Rechazado'
                            : 'Borrador'}
                        </span>

                        {listing.city && (
                          <span className="text-[11px] text-zinc-500">
                            📍 {listing.city}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 truncate">
                        {listing.title}
                      </h3>

                      {/* Seller and Price info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                        <span>
                          Vendedor:{' '}
                          <strong className="text-zinc-700 dark:text-zinc-300">
                            {listing.seller?.business_name || 'Negocio'}
                          </strong>
                        </span>
                        <span>
                          Precio:{' '}
                          <strong className="text-zinc-900 dark:text-zinc-100">
                            {listing.price !== null
                              ? `$ ${listing.price.toLocaleString('es-CO')} ${listing.price_unit ? `/${listing.price_unit}` : ''}`
                              : 'Cotización'}
                          </strong>
                        </span>
                        <span>
                          Fecha: {new Date(listing.created_at).toLocaleDateString('es-CO')}
                        </span>
                      </div>

                      {/* Rejection reason notice if rejected */}
                      {listing.status === 'rejected' && listing.reject_reason && (
                        <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                          <strong>Motivo de rechazo:</strong> {listing.reject_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Moderation Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800 shrink-0">
                    <Link
                      href={`/catalogo/${listing.id}`}
                      className="rounded-xl border border-zinc-300 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Ver detalle ↗
                    </Link>

                    {listing.status !== 'published' && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleApprove(listing.id)}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                      >
                        <span>✓</span>
                        <span>{isProcessing ? 'Procesando...' : 'Aprobar publicación'}</span>
                      </button>
                    )}

                    {listing.status !== 'rejected' && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => {
                          setRejectingListing(listing)
                          setRejectReason('')
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-red-300 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <span>✕</span>
                        <span>Rechazar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal para motivo de rechazo */}
      {rejectingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Rechazar Publicación
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Indica la razón del rechazo para que el vendedor ({rejectingListing.seller?.business_name}) pueda corregir su anuncio.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Motivo del rechazo
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej. La imagen no corresponde con la descripción, faltan detalles del precio o el artículo está duplicado..."
                className="w-full rounded-xl border border-zinc-300 p-3 text-xs text-zinc-900 focus:border-red-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectingListing(null)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-sm"
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
