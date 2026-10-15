// components/ServicesRunway.tsx
'use client'

import React, { useRef, useMemo, memo } from 'react'
import Link from 'next/link'
import type { ShowcaseItem } from '@/components/HeroRunway'
import {
  useGpuContinuousScroll,
  createLoopedItems,
  getWhatsappUrl,
  trackAdEvent,
} from '@/lib/useContinuousScroll'

interface ServicesRunwayProps {
  items: ShowcaseItem[]
  locale: string
  t: any
}

function ServicesRunwayComponent({ items, locale, t }: ServicesRunwayProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const loopedItems = useMemo(() => createLoopedItems(items), [items])
  const control = useGpuContinuousScroll({
    trackRef,
    itemCount: items.length,
    speed: 0.65,
  })

  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t.home.servicesRunwayTitle}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {t.home.servicesRunwaySubtitle}
          </p>
        </div>

        {/* Controles de Desplazamiento y Estado de Rotación */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all select-none border ${
              control.isPaused
                ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                : 'text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900'
            }`}
            title={control.isPaused ? 'Desplazamiento pausado por cursor sobre publicación' : 'Desplazamiento continuo fluido activo'}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${control.isPaused ? 'bg-amber-500' : 'bg-purple-500 animate-pulse'}`} />
            <span className="hidden sm:inline">{control.isPaused ? 'Pausado' : 'Continuo'}</span>
          </span>

          <button
            type="button"
            onClick={() => control.stepManual('left')}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
            aria-label="Desplazar a la izquierda"
            title="Servicio anterior"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => control.stepManual('right')}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
            aria-label="Desplazar a la derecha"
            title="Siguiente servicio"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Contenedor Viewport con Aislamiento CSS contain: paint layout y GPU translate3d */}
      <div
        className="relative w-full overflow-hidden pb-4 pt-1 select-none"
        style={{ contain: 'paint layout' }}
      >
        <div
          ref={trackRef}
          className="flex gap-5 will-change-transform cursor-grab active:cursor-grabbing"
          style={{
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          onPointerDown={control.handlePointerDown}
          onPointerMove={control.handlePointerMove}
          onPointerUp={control.handlePointerUp}
          onClickCapture={control.handleClickCapture}
        >
          {loopedItems.map((item, idx) => {
            const whatsappUrl = getWhatsappUrl(item.sellerWhatsapp, item.sellerName, item.title, locale)

            return (
              <div
                key={`${item.id}-${idx}`}
                onMouseEnter={control.pause}
                onMouseLeave={control.resume}
                className="w-80 sm:w-96 shrink-0 flex flex-col justify-between rounded-2xl border border-purple-200/80 bg-white p-5 shadow-xs hover:shadow-lg transition-all dark:border-purple-900/40 dark:bg-zinc-900 overflow-hidden"
              >
                <div className="space-y-3.5">
                  {/* 1. Fila Superior de Etiquetas (Badges & Categoría) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="inline-flex items-center rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-200">
                        🛠️ Servicio Profesional
                      </span>
                      {item.isPaidCampaign && (
                        <span className="inline-flex items-center rounded-lg bg-purple-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                          📢 Patrocinado
                        </span>
                      )}
                    </div>

                    {item.categoryName && (
                      <span className="shrink-0 rounded-lg bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {item.categoryName}
                      </span>
                    )}
                  </div>

                  {/* 2. Título, Prestador y Calificación */}
                  <div className="space-y-1 min-w-0">
                    <h3
                      className="font-bold text-zinc-900 dark:text-zinc-50 text-base leading-snug line-clamp-2 break-words"
                      title={item.title}
                    >
                      {item.title}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-0.5">
                      <span className="truncate max-w-[75%]">
                        Por: <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{item.sellerName}</strong>
                      </span>
                      <span className="shrink-0 font-semibold text-amber-500">
                        ★ {item.sellerRating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* 3. Descripción del Servicio */}
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed break-words">
                    {item.description}
                  </p>

                  {/* 4. Métricas Operativas Clave */}
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-purple-50/60 p-2.5 text-[11px] dark:bg-zinc-800/60 border border-purple-100 dark:border-zinc-800">
                    <div className="min-w-0">
                      <span className="text-zinc-400 block text-[9px] uppercase font-bold truncate">
                        Tiempo de Respuesta:
                      </span>
                      <strong className="text-zinc-800 dark:text-zinc-200 block truncate font-semibold text-xs mt-0.5">
                        ⏱️ {item.attrs?.tiempo_entrega || 'Inmediata'}
                      </strong>
                    </div>
                    <div className="min-w-0">
                      <span className="text-zinc-400 block text-[9px] uppercase font-bold truncate">
                        Modalidad de Atención:
                      </span>
                      <strong className="text-zinc-800 dark:text-zinc-200 block truncate font-semibold text-xs mt-0.5">
                        📍 {item.attrs?.modalidad || 'A Domicilio / Virtual'}
                      </strong>
                    </div>
                  </div>

                  {/* 5. Tarifa / Cotización y Ciudad */}
                  <div className="flex items-baseline justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">
                        Tarifa referencial:
                      </span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {item.price !== null
                          ? `$ ${item.price.toLocaleString('es-CO')}`
                          : 'A Cotizar'}
                      </span>
                    </div>

                    {item.city && (
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        📍 {item.city}
                      </span>
                    )}
                  </div>
                </div>

                {/* 6. Acciones de Contacto Directo */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-2">
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackAdEvent(item, 'whatsapp')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
                    >
                      <span>💬</span>
                      <span>{t.home.quoteService || 'Cotizar Servicio'}</span>
                    </a>
                  ) : null}

                  <Link
                    href={`/catalogo/${item.listingId}`}
                    onClick={() => trackAdEvent(item, 'click')}
                    className={`inline-flex items-center justify-center rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors ${
                      !whatsappUrl ? 'col-span-2' : ''
                    }`}
                  >
                    Ver Detalle
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export const ServicesRunway = memo(ServicesRunwayComponent)
export default ServicesRunway
