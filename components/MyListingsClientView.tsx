'use client'

import Link from 'next/link'
import type { ListingWithRelations } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface MyListingsClientViewProps {
  listings: ListingWithRelations[]
}

export default function MyListingsClientView({ listings }: MyListingsClientViewProps) {
  const { t, locale } = useTranslation()

  const statusBadges: Record<string, { label: string; color: string }> = {
    draft: { label: t.common.draft, color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
    submitted: { label: t.common.inReview, color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    pending_review: { label: t.common.inReview, color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    published: { label: t.common.approved, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
    rejected: { label: t.common.rejected, color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
    paused: { label: locale === 'en' ? 'Paused' : 'Pausado', color: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200' },
    archived: { label: locale === 'en' ? 'Archived' : 'Archivado', color: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200' },
  }

  return (
    <main className="flex-1 bg-zinc-50/50 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t.myListings.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {t.myListings.subtitle}
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="my-12 rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-4xl">📝</span>
            <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {t.myListings.emptyTitle}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
              {t.myListings.emptyDesc}
            </p>
            <div className="mt-6">
              <Link
                href="/publicar"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                {t.myListings.createListingBtn}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 font-semibold">{locale === 'en' ? 'Listing' : 'Anuncio'}</th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">{locale === 'en' ? 'Type' : 'Tipo'}</th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">{t.common.price}</th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">{t.common.status}</th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">{locale === 'en' ? 'Date' : 'Fecha'}</th>
                    <th scope="col" className="px-6 py-3.5 font-semibold text-right">{locale === 'en' ? 'Action' : 'Acción'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {listings.map((l) => {
                    const badge = statusBadges[l.status] || {
                      label: l.status,
                      color: 'bg-zinc-100 text-zinc-700',
                    }
                    const primaryMedia = l.listing_media?.sort((a, b) => a.position - b.position)[0]

                    return (
                      <tr key={l.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                              {primaryMedia ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={primaryMedia.url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-lg">
                                  📦
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold">{l.title}</div>
                              <div className="text-xs text-zinc-500">{l.category?.name || 'Categoría'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 capitalize">{l.type}</td>
                        <td className="px-6 py-4">
                          {l.price !== null
                            ? `$ ${l.price.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')} ${l.price_unit ? `/${l.price_unit}` : ''}`
                            : t.common.quoteOnRequest}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {new Date(l.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <Link
                              href={`/inventario?edit=${l.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shrink-0 shadow-2xs"
                              title={t.inventory.editItem || 'Editar Artículo Completo'}
                            >
                              <span>🛠️</span>
                              <span>{t.myListings.editBtn || 'Editar'}</span>
                            </Link>
                            {l.status === 'published' && (
                              <Link
                                href={`/promocionar?listing_id=${l.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition-colors shrink-0"
                              >
                                <span>🚀</span>
                                <span>{t.myListings.promoteBtn}</span>
                              </Link>
                            )}
                            <Link
                              href={`/catalogo/${l.id}`}
                              className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 text-xs shrink-0"
                            >
                              {t.myListings.viewBtn} →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
