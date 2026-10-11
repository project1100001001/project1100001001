'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { AdOrderWithRelations, AdOrderStatus } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface CampaignsListProps {
  initialOrders: AdOrderWithRelations[]
  balance: number
  advertiserName: string
}

export default function CampaignsList({
  initialOrders,
  balance,
  advertiserName,
}: CampaignsListProps) {
  const { t, locale } = useTranslation()
  const [orders] = useState<AdOrderWithRelations[]>(initialOrders)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const statusBadges: Record<
    AdOrderStatus,
    { label: string; bg: string; text: string; dot: string }
  > = {
    draft: {
      label: t.common.draft,
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-700 dark:text-zinc-300',
      dot: 'bg-zinc-400',
    },
    submitted: {
      label: t.common.inReview,
      bg: 'bg-amber-100/80 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    in_review: {
      label: t.common.inReview,
      bg: 'bg-amber-100/80 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    approved: {
      label: t.common.approved,
      bg: 'bg-blue-100/80 dark:bg-blue-950/40',
      text: 'text-blue-800 dark:text-blue-300',
      dot: 'bg-blue-500',
    },
    scheduled: {
      label: locale === 'en' ? 'Scheduled' : 'Programado',
      bg: 'bg-indigo-100/80 dark:bg-indigo-950/40',
      text: 'text-indigo-800 dark:text-indigo-300',
      dot: 'bg-indigo-500',
    },
    live: {
      label: locale === 'en' ? 'Active (Live)' : 'Activo (En vivo)',
      bg: 'bg-emerald-100/80 dark:bg-emerald-950/40',
      text: 'text-emerald-800 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
    rejected: {
      label: t.common.rejected,
      bg: 'bg-rose-100/80 dark:bg-rose-950/40',
      text: 'text-rose-800 dark:text-rose-300',
      dot: 'bg-rose-500',
    },
    paused: {
      label: locale === 'en' ? 'Paused' : 'Pausado',
      bg: 'bg-yellow-100/80 dark:bg-yellow-950/40',
      text: 'text-yellow-800 dark:text-yellow-300',
      dot: 'bg-yellow-500',
    },
    ended: {
      label: locale === 'en' ? 'Ended' : 'Finalizado',
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-600 dark:text-zinc-400',
      dot: 'bg-zinc-400',
    },
    cancelled: {
      label: locale === 'en' ? 'Cancelled' : 'Cancelado',
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-500 dark:text-zinc-400',
      dot: 'bg-zinc-400',
    },
  }

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'in_review') return o.status === 'submitted' || o.status === 'in_review'
    if (filterStatus === 'active') return o.status === 'live' || o.status === 'approved'
    if (filterStatus === 'ended') return o.status === 'ended' || o.status === 'cancelled'
    if (filterStatus === 'rejected') return o.status === 'rejected'
    return o.status === filterStatus
  })

  const countInReview = orders.filter(
    (o) => o.status === 'submitted' || o.status === 'in_review'
  ).length
  const countLive = orders.filter((o) => o.status === 'live').length

  const tabs = [
    { id: 'all', label: t.campaigns.tabAll },
    { id: 'in_review', label: t.campaigns.tabInReview },
    { id: 'active', label: t.campaigns.tabActive },
    { id: 'rejected', label: t.campaigns.tabRejected },
    { id: 'ended', label: t.campaigns.tabEnded },
  ]

  return (
    <div className="space-y-6">
      {/* Resumen de Saldo y Anunciante */}
      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 p-6 shadow-sm dark:border-purple-900/60 dark:from-purple-950/40 dark:via-zinc-900 dark:to-purple-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white font-bold text-xl shadow-xs">
              💳
            </div>
            <div>
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
                {t.campaigns.advertiserAccount}: {advertiserName}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">{t.campaigns.availableBalance}:</span>
                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                  ${balance.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')} COP
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link
              href="/promocionar"
              className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-500 transition-colors flex items-center gap-1.5"
            >
              <span>🚀</span>
              <span>{t.campaigns.newCampaignBtn}</span>
            </Link>
          </div>
        </div>

        {/* Mensaje de recarga de saldo */}
        <div className="mt-4 rounded-xl bg-purple-100/70 p-3.5 border border-purple-200/80 text-xs text-purple-900 dark:bg-purple-950/50 dark:border-purple-800 dark:text-purple-200 flex items-start gap-2.5">
          <span className="text-base shrink-0">ℹ️</span>
          <div>
            <strong>{t.campaigns.rechargeNoticeTitle}</strong>
            <p className="mt-0.5 text-purple-800 dark:text-purple-300">
              {t.campaigns.rechargeNoticeDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{t.campaigns.totalCampaigns}</span>
          <div className="mt-1 text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">{orders.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">{t.campaigns.inReview}</span>
          <div className="mt-1 text-2xl font-extrabold text-amber-600">{countInReview}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">{t.campaigns.activeLive}</span>
          <div className="mt-1 text-2xl font-extrabold text-emerald-600">{countLive}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{t.campaigns.totalInvested}</span>
          <div className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            ${orders.reduce((acc, curr) => acc + (Number(curr.price_paid) || 0), 0).toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}
          </div>
        </div>
      </div>

      {/* Filtros de estado */}
      {orders.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filterStatus === tab.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista de campañas */}
      {orders.length === 0 ? (
        <div className="my-12 rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-4xl">📢</span>
          <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {t.campaigns.emptyTitle}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
            {t.campaigns.emptyDesc}
          </p>
          <div className="mt-6">
            <Link
              href="/promocionar"
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-500 transition-colors"
            >
              <span>🚀</span>
              <span>{t.campaigns.createFirstCampaignBtn}</span>
            </Link>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          {locale === 'en' ? 'No campaigns match the selected filter.' : 'No hay campañas con el filtro seleccionado.'}
        </div>
      ) : (
        <>
          {/* Responsive Cards for Mobile */}
          <div className="md:hidden space-y-3.5">
            {filteredOrders.map((order) => {
              const badge = statusBadges[order.status] || {
                label: order.status,
                bg: 'bg-zinc-100 dark:bg-zinc-800',
                text: 'text-zinc-700 dark:text-zinc-300',
                dot: 'bg-zinc-400',
              }

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
                      {order.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={order.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg">📢</div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.bg} ${badge.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                        <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                          ${Number(order.price_paid).toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')} COP
                        </span>
                      </div>

                      <h4 className="mt-1 font-bold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {order.headline}
                      </h4>
                      {order.body && (
                        <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5">{order.body}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>{t.campaigns.package}: <strong>{order.package?.name || 'Estándar'}</strong></span>
                    <span>{new Date(order.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO')}</span>
                  </div>

                  {order.reject_reason && order.status === 'rejected' && (
                    <div className="rounded-xl bg-red-50 p-2.5 text-[11px] text-red-700 dark:bg-red-950/40 dark:text-red-300">
                      <strong>{locale === 'en' ? 'Rejection reason:' : 'Motivo de rechazo:'}</strong> {order.reject_reason}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 font-semibold">{locale === 'en' ? 'Ad Creative' : 'Anuncio / Creatividad'}</th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">{t.campaigns.package}</th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">{locale === 'en' ? 'Price Paid' : 'Precio Pagado'}</th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">{t.campaigns.status}</th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">{locale === 'en' ? 'Dates' : 'Fechas'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredOrders.map((order) => {
                    const badge = statusBadges[order.status] || {
                      label: order.status,
                      bg: 'bg-zinc-100 dark:bg-zinc-800',
                      text: 'text-zinc-700 dark:text-zinc-300',
                      dot: 'bg-zinc-400',
                    }

                    return (
                      <tr key={order.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                          <div className="flex items-start gap-3">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
                              {order.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={order.image_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-lg">
                                  📢
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 max-w-xs sm:max-w-sm">
                              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                {order.headline}
                              </div>
                              {order.body && (
                                <div className="text-xs text-zinc-500 truncate mt-0.5">
                                  {order.body}
                                </div>
                              )}
                              {order.listing && (
                                <div className="mt-1 text-[11px] text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                  <span>🔗 {t.common.product}:</span>
                                  <Link
                                    href={`/catalogo/${order.listing.id}`}
                                    className="underline hover:text-purple-700 truncate"
                                  >
                                    {order.listing.title}
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            {order.package?.name || 'Paquete Estándar'}
                          </div>
                          {order.package?.duration_days && (
                            <div className="text-[11px] text-zinc-500">
                              {order.package.duration_days} {locale === 'en' ? 'days duration' : 'días de vigencia'}
                            </div>
                          )}
                          {(order.target_city || order.target_category) && (
                            <div className="mt-1 text-[10px] text-zinc-400">
                              {[order.target_city, order.target_category].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                            ${Number(order.price_paid).toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}
                          </div>
                          <div className="text-[10px] text-zinc-400">COP ({locale === 'en' ? 'Deducted balance' : 'Saldo deducido'})</div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${badge.bg} ${badge.text}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                            {order.status === 'rejected' && order.reject_reason && (
                              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                                {locale === 'en' ? 'Reason:' : 'Motivo:'} {order.reject_reason}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs">
                          <div className="text-zinc-700 dark:text-zinc-300">
                            <strong>{locale === 'en' ? 'Created:' : 'Creado:'}</strong> {new Date(order.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO')}
                          </div>
                          {order.starts_at && (
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              {new Date(order.starts_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO')} -{' '}
                              {order.ends_at ? new Date(order.ends_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO') : (locale === 'en' ? 'No end date' : 'Sin fin')}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
