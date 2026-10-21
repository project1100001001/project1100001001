'use client'

import Link from 'next/link'
import type { ListingWithRelations } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'
import { getListingFreeTrialStatus, FREE_INITIAL_AD_DAYS } from '@/lib/adPolicies'

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

        {/* Banner de Política de Publicidad del Cliente */}
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/90 via-white to-purple-50/70 p-4 shadow-2xs dark:border-emerald-900/60 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-purple-950/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-zinc-700 dark:text-zinc-300">
              <span className="font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                🎁 Política de Publicidad:
              </span>{' '}
              Cada producto o servicio creado dura inicialmente <strong>{FREE_INITIAL_AD_DAYS} días con publicidad gratis ($0 COP)</strong>. Luego puedes elegir: <strong>Plan Individual Gran Vitrina ($20.000)</strong>, <strong>Plan Individual Pasarela ($10.000)</strong> o <strong>Plan en Combo las dos por $25.000 COP</strong>.
            </div>
          </div>
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
                    <th scope="col" className="px-6 py-3.5 font-semibold">{locale === 'en' ? 'Advertising Policy' : 'Publicidad / Plan'}</th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">{locale === 'en' ? 'Date' : 'Fecha'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {listings.map((l) => {
                    const badge = statusBadges[l.status] || {
                      label: l.status,
                      color: 'bg-zinc-100 text-zinc-700',
                    }
                    const primaryMedia = l.listing_media?.sort((a, b) => a.position - b.position)[0]
                    const freeTrial = getListingFreeTrialStatus(l)

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
                        <td className="px-6 py-4">
                          {freeTrial.isInFreePeriod ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
                              <span>🎁</span>
                              <span>Gratis ({freeTrial.daysRemaining}d restantes de {FREE_INITIAL_AD_DAYS}d)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/50 dark:border-purple-800 dark:text-purple-300">
                              <span>🚀</span>
                              <span>Pasarela $10k | Vitrina $20k | Combo $25k</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {new Date(l.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO')}
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
