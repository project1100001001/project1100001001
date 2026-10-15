// components/MerchantsRunway.tsx
'use client'

import React, { useRef, useMemo, memo } from 'react'
import Link from 'next/link'
import {
  useGpuContinuousScroll,
  createLoopedItems,
} from '@/lib/useContinuousScroll'

export interface MerchantShowcase {
  sellerId: string
  name: string
  city: string | null
  verified: boolean
  rating: number
  whatsapp: string | null
  itemsCount: number
  sampleImages: string[]
}

interface MerchantsRunwayProps {
  merchants: MerchantShowcase[]
  locale: string
  t: any
}

function MerchantsRunwayComponent({ merchants, locale, t }: MerchantsRunwayProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const loopedMerchants = useMemo(() => createLoopedItems(merchants), [merchants])
  const control = useGpuContinuousScroll({
    trackRef,
    itemCount: merchants.length,
    speed: 0.65,
  })

  if (merchants.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t.home.merchantsRunwayTitle}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {t.home.merchantsRunwaySubtitle}
          </p>
        </div>

        {/* Controles de Desplazamiento y Estado de Rotación */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all select-none border ${
              control.isPaused
                ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                : 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900'
            }`}
            title={control.isPaused ? 'Desplazamiento pausado por cursor sobre publicación' : 'Desplazamiento continuo fluido activo'}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${control.isPaused ? 'bg-amber-500' : 'bg-indigo-500 animate-pulse'}`} />
            <span className="hidden sm:inline">{control.isPaused ? 'Pausado' : 'Continuo'}</span>
          </span>

          <button
            type="button"
            onClick={() => control.stepManual('left')}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
            aria-label="Desplazar a la izquierda"
            title="Comercio anterior"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => control.stepManual('right')}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
            aria-label="Desplazar a la derecha"
            title="Siguiente comercio"
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
          {loopedMerchants.map((merchant, idx) => (
            <div
              key={`${merchant.sellerId}-${idx}`}
              onMouseEnter={control.pause}
              onMouseLeave={control.resume}
              className="w-72 shrink-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-lg font-black text-white shadow-xs">
                    {merchant.name[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                      {merchant.name}
                    </h4>
                    <div className="text-[11px] text-zinc-500">
                      📍 {merchant.city || 'Colombia'}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                  <span className="text-amber-500 font-bold">★ {merchant.rating.toFixed(1)}</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {merchant.itemsCount} ofertas en vitrina
                  </span>
                </div>

                {/* Muestra de fotos de catálogo o íconos temáticos */}
                {merchant.sampleImages.length > 0 ? (
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {merchant.sampleImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden"
                      >
                        <img src={img} alt="Catálogo" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    <div className="aspect-square rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg select-none">
                      🛍️
                    </div>
                    <div className="aspect-square rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg select-none">
                      📦
                    </div>
                    <div className="aspect-square rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg select-none">
                      ✨
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href={`/catalogo?seller=${merchant.sellerId}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50/50 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 transition-colors"
                >
                  <span>🛍️</span>
                  <span>Ver Catálogo del Comercio</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export const MerchantsRunway = memo(MerchantsRunwayComponent)
export default MerchantsRunway
