// components/BuyerRequestsRunway.tsx
'use client'

import React, { useRef, useMemo, memo } from 'react'
import {
  useGpuContinuousScroll,
  createLoopedItems,
} from '@/lib/useContinuousScroll'
import {
  type BuyerClassifiedRequest,
} from '@/lib/buyerRequests'

interface BuyerRequestsRunwayProps {
  requests: BuyerClassifiedRequest[]
  locale: string
  scrollSpeed?: number
}

function BuyerRequestsRunwayComponent({
  requests,
  locale,
  scrollSpeed = 0.62,
}: BuyerRequestsRunwayProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const activeRequests = useMemo(
    () => requests.filter((r) => r.status !== 'closed'),
    [requests]
  )
  const loopedRequests = useMemo(
    () => createLoopedItems(activeRequests),
    [activeRequests]
  )
  const control = useGpuContinuousScroll({
    trackRef,
    itemCount: activeRequests.length,
    speed: scrollSpeed,
  })

  if (activeRequests.length === 0) return null

  const getStatusBadge = (req: BuyerClassifiedRequest) => {
    switch (req.status) {
      case 'open':
        return {
          text: locale === 'en' ? '🟢 Looking for Provider' : '🟢 Buscando Quién Atienda',
          cls: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        }
      case 'in_attention':
        return {
          text: locale === 'en' ? '⚙️ In Service Attention' : '⚙️ En Proceso de Atención',
          cls: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        }
      case 'rated':
      case 'completed':
        return {
          text: locale === 'en' ? '⭐ Attended & Rated' : '⭐ Atendido y Calificado',
          cls: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
        }
      default:
        return {
          text: req.status,
          cls: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300',
        }
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-2xs">
              📜 {locale === 'en' ? 'Contracts Directory' : 'Directorio de Contratos'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-950/60 dark:border-purple-800 dark:text-purple-300">
              🛠️ {locale === 'en' ? 'Service Priority + Rating System' : 'Prioridad Servicios • Con Calificación Verificada'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {locale === 'en'
                ? 'Buyer Classified Requests Runway (Services & Products Needed)'
                : 'Pasarela de Solicitudes de Compradores (Servicios y Productos Requeridos)'}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {locale === 'en'
              ? 'Active service and product requests registered in the Contracts Directory.'
              : 'Solicitudes activas de servicios y productos registradas en el Directorio de Contratos.'}
          </p>
        </div>

        {/* Controles de Desplazamiento Continuo */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all select-none border ${
              control.isPaused
                ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                : 'text-teal-700 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-900'
            }`}
            title={
              control.isPaused
                ? 'Desplazamiento pausado por cursor sobre solicitud'
                : 'Desplazamiento continuo fluido activo'
            }
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                control.isPaused ? 'bg-amber-500' : 'bg-teal-500 animate-pulse'
              }`}
            />
            <span className="hidden sm:inline">
              {control.isPaused ? 'Pausado' : 'Continuo'}
            </span>
          </span>

          <button
            type="button"
            onClick={() => control.stepManual('left')}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
            aria-label="Desplazar a la izquierda"
            title="Solicitud anterior"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => control.stepManual('right')}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
            aria-label="Desplazar a la derecha"
            title="Siguiente solicitud"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Carrusel GPU de Solicitudes Clasificadas */}
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
          {loopedRequests.map((req, idx) => {
            const statusBadge = getStatusBadge(req)
            const isService = req.requestType === 'service'

            return (
              <div
                key={`${req.id}-${idx}`}
                onMouseEnter={control.pause}
                onMouseLeave={control.resume}
                className="w-80 sm:w-96 shrink-0 flex flex-col justify-between rounded-2xl border border-teal-200/80 bg-white p-5 shadow-xs hover:shadow-lg transition-all dark:border-teal-900/50 dark:bg-zinc-900 overflow-hidden"
              >
                <div className="space-y-3">
                  {/* 1. Fila Superior: Tipo Prioritario (Servicio / Producto) + Estado */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                        isService
                          ? 'border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-200'
                          : 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
                      }`}
                    >
                      <span>{isService ? '🛠️ Solicitud de Servicio' : '📦 Solicitud de Producto'}</span>
                    </span>

                    <span
                      className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-extrabold ${statusBadge.cls}`}
                    >
                      {statusBadge.text}
                    </span>
                  </div>

                  {/* 2. Referencia, Título y Comprador Solicitante */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-400">
                      <span>📌 {req.referenceCode}</span>
                      <span>{req.categoryName}</span>
                    </div>
                    <h3
                      className="font-bold text-zinc-900 dark:text-zinc-50 text-base leading-snug line-clamp-2 break-words"
                      title={req.title}
                    >
                      {req.title}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-0.5">
                      <span className="truncate max-w-[70%]">
                        Solicita:{' '}
                        <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">
                          {req.buyerName}
                        </strong>
                      </span>
                      <span className="shrink-0 font-semibold text-teal-600 dark:text-teal-400">
                        📍 {req.buyerCity}
                      </span>
                    </div>
                  </div>

                  {/* 3. Descripción de la necesidad */}
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed break-words">
                    {req.description}
                  </p>

                  {/* 4. Estructura Técnica de Servicio (Urgencia, Modalidad y Horario) */}
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-teal-50/60 p-2.5 text-[11px] dark:bg-zinc-800/60 border border-teal-100 dark:border-zinc-800">
                    <div className="min-w-0">
                      <span className="text-zinc-400 block text-[9px] uppercase font-bold truncate">
                        Urgencia Requerida:
                      </span>
                      <strong className="text-zinc-800 dark:text-zinc-200 block truncate font-semibold text-xs mt-0.5">
                        {req.urgencyLabel}
                      </strong>
                    </div>
                    <div className="min-w-0">
                      <span className="text-zinc-400 block text-[9px] uppercase font-bold truncate">
                        Modalidad de Atención:
                      </span>
                      <strong className="text-zinc-800 dark:text-zinc-200 block truncate font-semibold text-xs mt-0.5">
                        {req.modalityLabel}
                      </strong>
                    </div>
                  </div>

                  {/* Si ya fue atendido y calificado, mostrar insignia de calificación otorgada */}
                  {req.review && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] dark:border-amber-900/60 dark:bg-amber-950/30 flex items-center justify-between gap-2">
                      <span className="truncate text-amber-900 dark:text-amber-200 font-semibold">
                        🏆 Atendido por: <strong>{req.review.sellerBusinessName}</strong>
                      </span>
                      <span className="shrink-0 font-black text-amber-500">
                        ★ {req.review.rating.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* 5. Presupuesto Referencial y Postulaciones */}
                  <div className="flex items-baseline justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">
                        Presupuesto ofrecido ({req.budgetUnit}):
                      </span>
                      <span className="text-base font-black text-teal-600 dark:text-teal-400">
                        {req.budgetMaxCop !== null
                          ? req.budgetMinCop
                            ? `$${req.budgetMinCop.toLocaleString('es-CO')} - $${req.budgetMaxCop.toLocaleString('es-CO')}`
                            : `Hasta $${req.budgetMaxCop.toLocaleString('es-CO')}`
                          : 'Abierto a Cotizaciones'}
                      </span>
                    </div>

                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                      🙋 {req.proposals.length}{' '}
                      {req.proposals.length === 1 ? 'postulación' : 'postulaciones'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export const BuyerRequestsRunway = memo(BuyerRequestsRunwayComponent)
export default BuyerRequestsRunway
