// components/ProductsRunway.tsx
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

interface ProductsRunwayProps {
  items: ShowcaseItem[]
  locale: string
  t: any
  scrollSpeed?: number
}

function ProductsRunwayComponent({ items, locale, t, scrollSpeed = 0.65 }: ProductsRunwayProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const loopedItems = useMemo(() => createLoopedItems(items), [items])
  const control = useGpuContinuousScroll({
    trackRef,
    itemCount: items.length,
    speed: scrollSpeed,
  })

  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛍️</span>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t.home.productsRunwayTitle}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {t.home.productsRunwaySubtitle}
          </p>
        </div>

        {/* Controles de Desplazamiento y Estado de Rotación */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all select-none border ${
              control.isPaused
                ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                : 'text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900'
            }`}
            title={control.isPaused ? 'Desplazamiento pausado por cursor sobre publicación' : 'Desplazamiento continuo fluido activo'}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${control.isPaused ? 'bg-amber-500' : 'bg-blue-500 animate-pulse'}`} />
            <span className="hidden sm:inline">{control.isPaused ? 'Pausado' : 'Continuo'}</span>
          </span>

          <button
            type="button"
            onClick={() => control.stepManual('left')}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
            aria-label="Desplazar a la izquierda"
            title="Producto anterior"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => control.stepManual('right')}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
            aria-label="Desplazar a la derecha"
            title="Siguiente producto"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Contenedor Viewport con GPU translate3d y flujo continuo en móvil */}
      <div className="relative w-full overflow-hidden pb-4 pt-1 select-none">
        <div
          ref={trackRef}
          className="flex w-max gap-5 will-change-transform cursor-grab active:cursor-grabbing"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            touchAction: 'pan-y',
          }}
          onPointerDown={control.handlePointerDown}
          onPointerMove={control.handlePointerMove}
          onPointerUp={control.handlePointerUp}
          onTouchStart={control.handleTouchStart}
          onTouchMove={control.handleTouchMove}
          onTouchEnd={control.handleTouchEnd}
          onTouchCancel={control.handleTouchEnd}
          onClickCapture={control.handleClickCapture}
        >
          {loopedItems.map((item, idx) => {
            const whatsappUrl = getWhatsappUrl(item.sellerWhatsapp, item.sellerName, item.title, locale)

            return (
              <div
                key={`${item.id}-${idx}`}
                onMouseEnter={control.pause}
                onMouseLeave={control.resume}
                className="w-72 sm:w-80 shrink-0 flex flex-col justify-between rounded-2xl border border-blue-200/70 bg-white p-4 shadow-xs hover:shadow-lg transition-all dark:border-blue-900/30 dark:bg-zinc-900 group"
              >
                <div>
                  {/* Imagen y Badges */}
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-400 select-none">
                        <span className="text-4xl transition-transform duration-300 group-hover:scale-110">
                          🛍️
                        </span>
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      <span className="rounded-md border border-blue-300 bg-blue-50/95 px-2 py-0.5 text-[10px] font-bold backdrop-blur-md text-blue-800 dark:border-blue-800 dark:bg-blue-950/90 dark:text-blue-200">
                        🛍️ Producto (Nuevo)
                      </span>
                      {item.isPaidCampaign && (
                        <span className="rounded-md bg-purple-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                          📢 Patrocinado
                        </span>
                      )}
                    </div>

                    {/* Bottom Nuevo Badge */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="rounded-md bg-blue-600/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                        ✨ Nuevo de Fábrica
                      </span>
                    </div>

                    {item.city && (
                      <div className="absolute bottom-2.5 right-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                        📍 {item.city}
                      </div>
                    )}
                  </div>

                  {/* Datos de la Oferta */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="font-semibold text-blue-700 dark:text-blue-400">
                        {item.categoryName}
                      </span>
                      <span>★ {item.sellerRating.toFixed(1)}</span>
                    </div>

                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm truncate">
                      {item.title}
                    </h3>

                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Precio y Entrega */}
                  <div className="mt-3 flex items-baseline justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {item.price !== null
                        ? `$ ${item.price.toLocaleString('es-CO')}`
                        : 'Cotización'}
                    </span>
                    {item.attrs?.tiempo_entrega && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        ⏱️ {item.attrs.tiempo_entrega}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones de Contacto */}
                <div className="mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-2">
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackAdEvent(item, 'whatsapp')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
                    >
                      <span>💬</span>
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <Link
                      href={`/catalogo/${item.listingId}`}
                      onClick={() => trackAdEvent(item, 'click')}
                      className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900"
                    >
                      Ver Detalle
                    </Link>
                  )}

                  <Link
                    href={`/catalogo/${item.listingId}`}
                    onClick={() => trackAdEvent(item, 'click')}
                    className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Ficha ↗
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

export const ProductsRunway = memo(ProductsRunwayComponent)
export default ProductsRunway
