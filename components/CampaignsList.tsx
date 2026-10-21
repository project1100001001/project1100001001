'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import type { AdOrderWithRelations, AdOrderStatus } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'
import { resolveAdOrderPlacement, FREE_INITIAL_AD_DAYS } from '@/lib/adPolicies'

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
  const [selectedAnalyticsOrder, setSelectedAnalyticsOrder] =
    useState<AdOrderWithRelations | null>(null)

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

  // Métricas agregadas globales
  const countInReview = orders.filter(
    (o) => o.status === 'submitted' || o.status === 'in_review'
  ).length
  const countLive = orders.filter((o) => o.status === 'live').length
  const totalClicks = orders.reduce((acc, curr) => acc + (Number(curr.clicks_count) || 0), 0)
  const totalContacts = orders.reduce((acc, curr) => acc + (Number(curr.contacts_count) || 0), 0)
  const totalImpressions = orders.reduce(
    (acc, curr) => acc + (Number(curr.impressions_count) || 0),
    0
  )
  const globalCtr =
    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0'
  const totalInvested = orders.reduce((acc, curr) => acc + (Number(curr.price_paid) || 0), 0)

  const tabs = [
    { id: 'all', label: t.campaigns.tabAll },
    { id: 'active', label: t.campaigns.tabActive },
    { id: 'in_review', label: t.campaigns.tabInReview },
    { id: 'ended', label: t.campaigns.tabEnded },
    { id: 'rejected', label: t.campaigns.tabRejected },
  ]

  // Cálculo de tiempo restante individual formateado
  const formatRemainingTime = (order: AdOrderWithRelations) => {
    if (order.status === 'submitted' || order.status === 'in_review') {
      return {
        label: t.campaigns.campaignInReviewBadge,
        color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
        detail: 'Iniciará al ser aprobada',
        percent: 0,
      }
    }
    if (order.status === 'ended' || order.isExpired) {
      return {
        label: t.campaigns.campaignExpiredBadge,
        color: 'text-zinc-600 bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400',
        detail: order.ends_at
          ? `Expiró el ${new Date(order.ends_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO')}`
          : 'Completada',
        percent: 100,
      }
    }
    if (order.status === 'rejected') {
      return {
        label: t.common.rejected,
        color: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
        detail: order.reject_reason || 'Rechazada por moderación',
        percent: 0,
      }
    }

    const days = order.daysRemaining ?? 0
    const hours = order.hoursRemaining ?? 0

    if (days === 0 && hours === 0) {
      return {
        label: 'Últimas horas',
        color: 'text-red-700 bg-red-50 border-red-200 animate-pulse dark:bg-red-950/40 dark:text-red-300',
        detail: 'Menos de 1 hora restante',
        percent: 95,
      }
    }

    return {
      label: `⏳ ${days}d ${hours}h restantes`,
      color: 'text-emerald-800 bg-emerald-50 border-emerald-200 font-bold dark:bg-emerald-950/40 dark:text-emerald-300',
      detail: order.ends_at
        ? `Vence: ${new Date(order.ends_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO')}`
        : `${days} días de exhibición`,
      percent: order.progressPercent ?? 30,
    }
  }

  return (
    <div className="space-y-8 select-none">
      {/* 1. Resumen de Saldo de Billetera y Anunciante */}
      <div className="rounded-3xl border border-purple-200/80 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white p-6 sm:p-7 shadow-xs dark:border-purple-900/40 dark:from-purple-950/30 dark:via-zinc-900 dark:to-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white font-black text-2xl shadow-md">
              💳
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
                {t.campaigns.advertiserAccount}: {advertiserName}
              </span>
              <div className="flex items-baseline gap-2.5 mt-1">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {t.campaigns.availableBalance}:
                </span>
                <span className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  ${balance.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')} COP
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-purple-900 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/50 rounded-2xl p-3 border border-purple-200/60 dark:border-purple-800/60 max-w-sm">
            <div className="flex items-center gap-1.5 font-bold">
              <span>💡</span>
              <span>Gestión de Saldo:</span>
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed">
              Recarga saldo o activa nuevos paquetes desde el menú lateral izquierdo en{' '}
              <strong>Mis Campañas → Recarga de Saldo</strong>.
            </p>
          </div>
        </div>

        {/* Resumen de Políticas y Tarifas de Publicidad para el Cliente */}
        <div className="mt-5 pt-4 border-t border-purple-200/60 dark:border-purple-800/50 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="rounded-xl bg-emerald-50/90 border border-emerald-200 px-3 py-2 dark:bg-emerald-950/40 dark:border-emerald-800/60">
            <span className="text-[10px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300 block">
              🎁 Publicidad Inicial
            </span>
            <span className="font-black text-emerald-700 dark:text-emerald-400">
              {FREE_INITIAL_AD_DAYS} Días GRATIS ($0)
            </span>
            <span className="block text-[10px] text-zinc-500">Al crear producto o servicio</span>
          </div>
          <div className="rounded-xl bg-white/90 border border-zinc-200 px-3 py-2 dark:bg-zinc-800/70 dark:border-zinc-700">
            <span className="text-[10px] font-extrabold uppercase text-blue-700 dark:text-blue-400 block">
              ✨ Individual Pasarela
            </span>
            <span className="font-black text-zinc-900 dark:text-zinc-50">$10.000 COP</span>
            <span className="block text-[10px] text-zinc-500">Ciclo de 7 días</span>
          </div>
          <div className="rounded-xl bg-white/90 border border-zinc-200 px-3 py-2 dark:bg-zinc-800/70 dark:border-zinc-700">
            <span className="text-[10px] font-extrabold uppercase text-purple-700 dark:text-purple-400 block">
              🏆 Individual Gran Vitrina
            </span>
            <span className="font-black text-zinc-900 dark:text-zinc-50">$20.000 COP</span>
            <span className="block text-[10px] text-zinc-500">Ciclo de 7 días</span>
          </div>
          <div className="rounded-xl bg-purple-100/80 border border-purple-300 px-3 py-2 dark:bg-purple-950/60 dark:border-purple-700">
            <span className="text-[10px] font-extrabold uppercase text-purple-900 dark:text-purple-300 block">
              🔥 Plan en Combo (Las dos)
            </span>
            <span className="font-black text-purple-700 dark:text-purple-300">$25.000 COP</span>
            <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
              Vitrina + Pasarela (Ahorras $5.000)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Grid de Métricas de Rendimiento de Campañas (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Activas */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              {t.campaigns.activeLive}
            </span>
            {countLive > 0 && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />}
          </div>
          <div className="mt-1.5 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {countLive}
          </div>
          <span className="text-[10px] text-zinc-400">en exhibición portada</span>
        </div>

        {/* Total Clics Generados */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
            👆 {t.campaigns.totalClicks}
          </span>
          <div className="mt-1.5 text-2xl font-black text-purple-600 dark:text-purple-400">
            {totalClicks.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}
          </div>
          <span className="text-[10px] text-zinc-400">tráfico a ficha comercial</span>
        </div>

        {/* Contactos WhatsApp Directos */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            💬 {t.campaigns.whatsappContacts}
          </span>
          <div className="mt-1.5 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {totalContacts.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}
          </div>
          <span className="text-[10px] text-zinc-400">conversaciones iniciadas</span>
        </div>

        {/* Impresiones en Vitrina */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            👁️ {t.campaigns.impressionsCount}
          </span>
          <div className="mt-1.5 text-2xl font-black text-blue-600 dark:text-blue-400">
            {totalImpressions.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}
          </div>
          <span className="text-[10px] text-zinc-400">vistas en gran vitrina</span>
        </div>

        {/* Tasa de Clics (CTR) */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            🎯 {t.campaigns.ctrRate}
          </span>
          <div className="mt-1.5 text-2xl font-black text-amber-600 dark:text-amber-400">
            {globalCtr}%
          </div>
          <span className="text-[10px] text-zinc-400">efectividad de anuncio</span>
        </div>

        {/* Total Invertido */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            💰 {t.campaigns.totalInvested}
          </span>
          <div className="mt-1.5 text-lg font-black text-zinc-900 dark:text-zinc-100">
            ${totalInvested.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}
          </div>
          <span className="text-[10px] text-zinc-400">COP en paquetes</span>
        </div>
      </div>

      {/* 3. Filtros de Estado */}
      {orders.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                filterStatus === tab.id
                  ? 'bg-purple-600 text-white shadow-xs scale-105'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* 4. Lista de Campañas */}
      {orders.length === 0 ? (
        <div className="my-10 rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-5xl">📢</span>
          <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {t.campaigns.emptyTitle}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            {t.campaigns.emptyDesc}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 px-5 py-3 text-xs font-semibold text-purple-800 dark:text-purple-300">
            <span>👈</span>
            <span>
              {locale === 'en'
                ? 'Select "Mis Campañas → Configurar Campaña" on the left menu to feature your first product.'
                : 'Usa el menú lateral izquierdo en "Mis Campañas → Configurar Campaña" para destacar tu primera publicación.'}
            </span>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          {locale === 'en'
            ? 'No campaigns match the selected filter.'
            : 'No hay campañas que coincidan con este filtro.'}
        </div>
      ) : (
        <>
          {/* Vista Móvil (Tarjetas Adaptables con Métricas) */}
          <div className="md:hidden space-y-4">
            {filteredOrders.map((order) => {
              const badge = statusBadges[order.status] || {
                label: order.status,
                bg: 'bg-zinc-100 dark:bg-zinc-800',
                text: 'text-zinc-700 dark:text-zinc-300',
                dot: 'bg-zinc-400',
              }
              const remaining = formatRemainingTime(order)
              const ctr =
                order.impressions_count && order.impressions_count > 0
                  ? (
                      ((order.clicks_count || 0) / order.impressions_count) *
                      100
                    ).toFixed(1)
                  : '0.0'

              return (
                <div
                  key={order.id}
                  className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="h-18 w-18 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
                      {order.image_url ? (
                        <img src={order.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl">📢</div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black ${badge.bg} ${badge.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          ${Number(order.price_paid).toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')} COP
                        </span>
                      </div>

                      <h4 className="mt-1 font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                        {order.headline}
                      </h4>
                      {order.listing && (
                        <Link
                          href={`/catalogo/${order.listing.id}`}
                          className="mt-0.5 text-xs text-purple-600 dark:text-purple-400 hover:underline block truncate"
                        >
                          🔗 {order.listing.title}
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Vigencia y Barra de Tiempo */}
                  <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className={`rounded-lg px-2 py-0.5 text-[10px] border ${remaining.color}`}>
                        {remaining.label}
                      </span>
                      <span className="text-[11px] text-zinc-500">{remaining.detail}</span>
                    </div>

                    {/* Barra de progreso de días */}
                    <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${remaining.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Métricas Móviles */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="rounded-xl bg-purple-50/50 p-2 dark:bg-purple-950/20">
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 block">
                        👆 Clics
                      </span>
                      <strong className="text-sm font-black text-purple-900 dark:text-purple-100">
                        {order.clicks_count || 0}
                      </strong>
                    </div>

                    <div className="rounded-xl bg-emerald-50/50 p-2 dark:bg-emerald-950/20">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">
                        💬 WhatsApp
                      </span>
                      <strong className="text-sm font-black text-emerald-900 dark:text-emerald-100">
                        {order.contacts_count || 0}
                      </strong>
                    </div>

                    <div className="rounded-xl bg-blue-50/50 p-2 dark:bg-blue-950/20">
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 block">
                        🎯 CTR
                      </span>
                      <strong className="text-sm font-black text-blue-900 dark:text-blue-100">
                        {ctr}%
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedAnalyticsOrder(order)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 bg-white py-2.5 text-xs font-bold text-zinc-800 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <span>📊</span>
                    <span>{t.campaigns.viewAnalyticsBtn}</span>
                  </button>
                </div>
              )
            })}
          </div>

          {/* Vista Escritorio (Tabla Exhaustiva con Métricas y Tiempos) */}
          <div className="hidden md:block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                <thead className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-bold">
                      {locale === 'en' ? 'Ad Creative & Product' : 'Anuncio & Publicación'}
                    </th>
                    <th scope="col" className="px-4 py-4 font-bold">
                      {t.campaigns.status}
                    </th>
                    <th scope="col" className="px-5 py-4 font-bold">
                      {t.campaigns.timeRemaining}
                    </th>
                    <th scope="col" className="px-5 py-4 font-bold">
                      {locale === 'en' ? 'Performance Metrics' : 'Métricas de Tráfico'}
                    </th>
                    <th scope="col" className="px-4 py-4 font-bold">
                      {locale === 'en' ? 'Paid / Package' : 'Inversión'}
                    </th>
                    <th scope="col" className="px-4 py-4 text-center font-bold">
                      Acción
                    </th>
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
                    const remaining = formatRemainingTime(order)
                    const ctr =
                      order.impressions_count && order.impressions_count > 0
                        ? (
                            ((order.clicks_count || 0) / order.impressions_count) *
                            100
                          ).toFixed(1)
                        : '0.0'

                    return (
                      <tr key={order.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                        {/* 1. Anuncio Creatividad */}
                        <td className="px-5 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                          <div className="flex items-start gap-3.5">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
                              {order.image_url ? (
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
                            <div className="min-w-0 max-w-xs">
                              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                                {order.headline}
                              </div>
                              {order.body && (
                                <div className="text-xs text-zinc-500 truncate mt-0.5">
                                  {order.body}
                                </div>
                              )}
                              {order.listing && (
                                <div className="mt-1 text-[11px] text-purple-600 dark:text-purple-400 flex items-center gap-1 truncate">
                                  <span>🔗 Publicación:</span>
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

                        {/* 2. Estado */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${badge.bg} ${badge.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>

                        {/* 3. Vigencia y Tiempo Restante */}
                        <td className="px-5 py-4">
                          <div className="space-y-1.5 min-w-[170px]">
                            <div className="flex items-center justify-between">
                              <span className={`rounded-md px-2 py-0.5 text-[10px] border ${remaining.color}`}>
                                {remaining.label}
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200/60 dark:border-zinc-700/60">
                              <div
                                className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${remaining.percent}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                              {remaining.detail}
                            </div>
                          </div>
                        </td>

                        {/* 4. Métricas de Rendimiento */}
                        <td className="px-5 py-4">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-purple-600 dark:text-purple-400">
                                👆 {order.clicks_count || 0} clics
                              </span>
                              <span className="text-zinc-300 dark:text-zinc-600">•</span>
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                💬 {order.contacts_count || 0} WhatsApp
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                              <span>👁️ {order.impressions_count || 0} vistas</span>
                              <span>•</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                CTR: {ctr}%
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 5. Inversión y Plan Oficial */}
                        <td className="px-4 py-4">
                          <div className="font-black text-sm text-zinc-900 dark:text-zinc-50">
                            ${Number(order.price_paid).toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}
                          </div>
                          <div className="text-[10px] font-semibold text-purple-700 dark:text-purple-400">
                            {(() => {
                              const pl = resolveAdOrderPlacement(order)
                              if (pl === 'combo') return '🔥 Combo (Vitrina + Pasarela)'
                              if (pl === 'gran_vitrina') return '🏆 Individual Gran Vitrina'
                              return '✨ Individual Pasarela'
                            })()}
                          </div>
                        </td>

                        {/* 6. Botón de Analítica */}
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedAnalyticsOrder(order)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <span>📊</span>
                            <span>Métricas</span>
                          </button>
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

      {/* ========================================================================= */}
      {/* 5. MODAL DE ANÁLISIS DETALLADO DE CAMPAÑA (ANALYTICS MODAL)               */}
      {/* ========================================================================= */}
      {selectedAnalyticsOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-lg dark:bg-purple-950 dark:text-purple-300">
                  📊
                </span>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                    {t.campaigns.analyticsModalTitle}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t.campaigns.analyticsModalSubtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnalyticsOrder(null)}
                className="h-8 w-8 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="mt-6 space-y-6">
              {/* Tarjeta de Creatividad del Anuncio */}
              <div className="flex items-center gap-4 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
                <div className="h-18 w-18 shrink-0 overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                  {selectedAnalyticsOrder.image_url ? (
                    <img
                      src={selectedAnalyticsOrder.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl select-none">📢</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">
                    {selectedAnalyticsOrder.package?.name || 'Campaña Patrocinada'}
                  </span>
                  <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-50 truncate">
                    {selectedAnalyticsOrder.headline}
                  </h4>
                  {selectedAnalyticsOrder.listing && (
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <Link
                        href={`/catalogo/${selectedAnalyticsOrder.listing.id}`}
                        target="_blank"
                        className="font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        <span>Ver publicación en catálogo</span>
                        <span>↗</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Métricas Principales Desglosadas */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">
                  Resultados Comerciales Generados
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 text-center dark:border-purple-900/40 dark:bg-purple-950/20">
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block">
                      👆 Clics Totales
                    </span>
                    <strong className="mt-1 block text-2xl font-black text-purple-900 dark:text-purple-100">
                      {selectedAnalyticsOrder.clicks_count || 0}
                    </strong>
                    <span className="text-[10px] text-purple-600/80">interacciones</span>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
                      💬 Leads WhatsApp
                    </span>
                    <strong className="mt-1 block text-2xl font-black text-emerald-900 dark:text-emerald-100">
                      {selectedAnalyticsOrder.contacts_count || 0}
                    </strong>
                    <span className="text-[10px] text-emerald-600/80">contactos directos</span>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-center dark:border-blue-900/40 dark:bg-blue-950/20">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block">
                      👁️ Vistas Vitrina
                    </span>
                    <strong className="mt-1 block text-2xl font-black text-blue-900 dark:text-blue-100">
                      {selectedAnalyticsOrder.impressions_count || 0}
                    </strong>
                    <span className="text-[10px] text-blue-600/80">impresiones</span>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block">
                      🎯 Efectividad CTR
                    </span>
                    <strong className="mt-1 block text-2xl font-black text-amber-900 dark:text-amber-100">
                      {selectedAnalyticsOrder.impressions_count &&
                      selectedAnalyticsOrder.impressions_count > 0
                        ? (
                            ((selectedAnalyticsOrder.clicks_count || 0) /
                              selectedAnalyticsOrder.impressions_count) *
                            100
                          ).toFixed(1)
                        : '0.0'}
                      %
                    </strong>
                    <span className="text-[10px] text-amber-600/80">ratio de clics</span>
                  </div>
                </div>
              </div>

              {/* Vigencia y Fechas */}
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Estado de Vigencia:
                  </span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {selectedAnalyticsOrder.daysRemaining ?? 0} días restantes
                  </span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full"
                    style={{ width: `${selectedAnalyticsOrder.progressPercent ?? 50}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-zinc-500 pt-1">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">
                      {t.campaigns.campaignStarted}
                    </span>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {selectedAnalyticsOrder.starts_at
                        ? new Date(selectedAnalyticsOrder.starts_at).toLocaleString(
                            locale === 'en' ? 'en-US' : 'es-CO'
                          )
                        : 'Al ser aprobada'}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">
                      {t.campaigns.campaignEnds}
                    </span>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {selectedAnalyticsOrder.ends_at
                        ? new Date(selectedAnalyticsOrder.ends_at).toLocaleString(
                            locale === 'en' ? 'en-US' : 'es-CO'
                          )
                        : 'Sin fecha de fin'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Inversión y Costo por Clic */}
              <div className="flex items-center justify-between rounded-2xl bg-purple-50/40 p-4 text-xs dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60">
                <div>
                  <span className="text-purple-700 dark:text-purple-300 font-bold">
                    Inversión Pagada:
                  </span>
                  <div className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                    ${Number(selectedAnalyticsOrder.price_paid).toLocaleString(
                      locale === 'en' ? 'en-US' : 'es-CO'
                    )}{' '}
                    COP
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-zinc-500 text-[11px]">Costo aprox. por Clic:</span>
                  <div className="font-bold text-zinc-700 dark:text-zinc-300">
                    ~$
                    {Math.round(
                      selectedAnalyticsOrder.price_paid /
                        Math.max(1, selectedAnalyticsOrder.clicks_count || 1)
                    ).toLocaleString('es-CO')}{' '}
                    COP
                  </div>
                </div>
              </div>
            </div>

            {/* Pie del Modal */}
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAnalyticsOrder(null)}
                className="rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 transition-colors"
              >
                {t.campaigns.closeModal}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
