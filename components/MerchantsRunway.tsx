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
  isPromoted?: boolean
  adBadge?: string
}

interface MerchantsRunwayProps {
  merchants: MerchantShowcase[]
  locale: string
  t: any
  scrollSpeed?: number
}

function MerchantsRunwayComponent({ merchants, locale, t, scrollSpeed = 0.65 }: MerchantsRunwayProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const loopedMerchants = useMemo(() => createLoopedItems(merchants), [merchants])
  const control = useGpuContinuousScroll({
    trackRef,
    itemCount: merchants.length,
    speed: scrollSpeed,
  })

  if (merchants.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Cabecera centrada sin íconos ni controles de botones */}
      <div className="flex flex-col items-center justify-center text-center mb-5">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t.home.merchantsRunwayTitle}
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-2xl">
          {t.home.merchantsRunwaySubtitle}
        </p>
      </div>

      {/* Contenedor Viewport con GPU translate3d y manipulación directa de la pasarela */}
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
          {loopedMerchants.map((merchant, idx) => (
            <div
              key={`${merchant.sellerId}-${idx}`}
              onMouseEnter={control.pause}
              onMouseLeave={control.resume}
              className="w-72 shrink-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-base font-black text-white shadow-xs">
                    {merchant.name[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                        {merchant.name}
                      </h4>
                      {merchant.adBadge && (
                        <span className="hidden sm:inline shrink-0 rounded-md bg-purple-50 border border-purple-200 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 dark:bg-purple-950/60 dark:border-purple-800 dark:text-purple-300">
                          {merchant.adBadge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {merchant.city || 'Colombia'}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">Calificación {merchant.rating.toFixed(1)}</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {merchant.itemsCount} ofertas en vitrina
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href={`/catalogo?seller=${merchant.sellerId}`}
                  className="w-full inline-flex items-center justify-center rounded-xl border border-purple-300 bg-purple-50/50 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 transition-colors"
                >
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
