// components/HeroRunway.tsx
'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react'
import Link from 'next/link'
import { getWhatsappUrl, trackAdEvent } from '@/lib/useContinuousScroll'

export interface ShowcaseItem {
  id: string
  listingId: string
  title: string
  headline: string
  description: string
  imageUrl: string | null
  allImages: string[]
  price: number | null
  priceUnit: string | null
  type: string
  city: string | null
  categoryName: string
  categorySlug: string
  sellerName: string
  sellerWhatsapp: string | null
  sellerPhone: string | null
  sellerVerified: boolean
  sellerRating: number
  sellerId: string
  isPaidCampaign: boolean
  daysRemaining: number
  campaignStatus: string
  attrs: Record<string, any>
}

interface HeroRunwayProps {
  heroItems: ShowcaseItem[]
  locale: string
  t: any
}

function HeroRunwayComponent({ heroItems, locale, t }: HeroRunwayProps) {
  // Estado local e independiente de la Gran Vitrina Principal (Hero Runway)
  // Desplazamiento horizontal continuo al costado sin afectar el resto de la página
  const [trackIndex, setTrackIndex] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const isTransitioningRef = useRef(false)
  const trackIndexRef = useRef(1)
  trackIndexRef.current = trackIndex
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedPhotos, setSelectedPhotos] = useState<Record<string, number>>({})

  // Items extendidos con clones en los extremos para bucle horizontal infinito sin saltos
  const extendedHeroItems = useMemo(() => {
    if (heroItems.length <= 1) return heroItems
    return [
      heroItems[heroItems.length - 1], // Slot 0: Clon del último
      ...heroItems,                     // Slots 1 .. N: Items reales
      heroItems[0],                     // Slot N+1: Clon del primero
    ]
  }, [heroItems])

  // Índice real activo (0 .. N-1)
  const activeHeroIndex = useMemo(() => {
    if (heroItems.length <= 1) return 0
    return ((trackIndex - 1) % heroItems.length + heroItems.length) % heroItems.length
  }, [trackIndex, heroItems.length])

  // Finalizar transición y gestionar teletransporte invisible sin saltos
  const finishTransition = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }

    const N = heroItems.length
    if (N <= 1) {
      isTransitioningRef.current = false
      return
    }

    const currentIdx = trackIndexRef.current
    if (currentIdx >= N + 1) {
      // Teletransporte instantáneo al slot 1 (primer item real) desactivando la animación
      setIsTransitioning(false)
      setTrackIndex(1)
      trackIndexRef.current = 1
      // Reactivar la animación para el siguiente desplazamiento
      setTimeout(() => {
        setIsTransitioning(true)
        isTransitioningRef.current = false
      }, 50)
    } else if (currentIdx <= 0) {
      // Teletransporte instantáneo al slot N (último item real) desactivando la animación
      setIsTransitioning(false)
      setTrackIndex(N)
      trackIndexRef.current = N
      // Reactivar la animación para el siguiente desplazamiento
      setTimeout(() => {
        setIsTransitioning(true)
        isTransitioningRef.current = false
      }, 50)
    } else {
      isTransitioningRef.current = false
    }
  }, [heroItems.length])

  // Desplazamiento hacia una diapositiva objetivo con protección y temporizador de seguridad
  const goToTrackSlide = useCallback((targetTrackIndex: number) => {
    if (isTransitioningRef.current) return
    isTransitioningRef.current = true
    setIsTransitioning(true)
    setTrackIndex(targetTrackIndex)
    trackIndexRef.current = targetTrackIndex

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }
    // Timeout de seguridad (la transición CSS dura 700ms; si transitionend no dispara en 800ms se desbloquea)
    transitionTimeoutRef.current = setTimeout(() => {
      finishTransition()
    }, 800)
  }, [finishTransition])

  const handleNextHero = useCallback(() => {
    if (heroItems.length <= 1 || isTransitioningRef.current) return
    goToTrackSlide(trackIndexRef.current + 1)
  }, [heroItems.length, goToTrackSlide])

  const handlePrevHero = useCallback(() => {
    if (heroItems.length <= 1 || isTransitioningRef.current) return
    goToTrackSlide(trackIndexRef.current - 1)
  }, [heroItems.length, goToTrackSlide])

  const handleDotClick = useCallback((realIdx: number) => {
    if (heroItems.length <= 1 || isTransitioningRef.current) return
    goToTrackSlide(realIdx + 1)
  }, [heroItems.length, goToTrackSlide])

  // Evento nativo cuando concluye la animación CSS del riel
  const handleTrackTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    // Filtrar eventos procedentes de elementos hijos con transiciones CSS
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return
    finishTransition()
  }

  // Rotación automática de la Gran Vitrina cada 5 segundos continuos en dirección invertida
  // Aislada en este componente para NO provocar re-render en las pasarelas continuas
  useEffect(() => {
    if (heroItems.length <= 1) return

    const timer = setInterval(() => {
      goToTrackSlide(trackIndexRef.current - 1)
    }, 5000)

    return () => {
      clearInterval(timer)
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
        transitionTimeoutRef.current = null
      }
    }
  }, [heroItems.length, goToTrackSlide])

  const currentHero = heroItems[activeHeroIndex] || heroItems[0]

  // Registrar impresión en la vitrina de manera diferida para no competir con la animación de inicio
  useEffect(() => {
    if (!currentHero) return
    const timer = setTimeout(() => {
      trackAdEvent(currentHero, 'impression')
    }, 850)
    return () => clearTimeout(timer)
  }, [currentHero?.id])

  if (!currentHero) return null

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-white via-zinc-50 to-white py-10 sm:py-14 dark:from-zinc-900 dark:via-zinc-900/80 dark:to-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800"
    >
      {/* Luces y efectos visuales de fondo */}
      <div className="absolute top-0 left-1/4 -z-10 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Cabecera sutil de la Gran Vitrina */}
        <div className="flex items-center justify-between pb-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-sm dark:bg-purple-950 dark:text-purple-300">
              ✨
            </span>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                {t.home.featuredRunwayBadge}
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {t.home.runwaySubtitle}
              </p>
            </div>
          </div>

          {/* Controles de diapositiva (Anterior / Siguiente) */}
          {heroItems.length > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevHero}
                aria-label="Anterior"
                title="Publicación anterior"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={handleNextHero}
                aria-label="Siguiente"
                title="Siguiente publicación"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
              >
                ▶
              </button>
            </div>
          )}
        </div>

        {/* Tarjeta de Exhibición Dinámica Split (Doble Columna con TAMAÑO ESTÁTICO FIJO y DESPLAZAMIENTO AL COSTADO) */}
        {/* REGLA DESIGN_RULES.md: Mantener altura invariable estática [680px]/[620px]/[490px] sin deformarse */}
        <div
          className="relative rounded-3xl border border-zinc-200/80 bg-white/95 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/95 overflow-hidden h-[680px] sm:h-[620px] lg:h-[490px] flex flex-col justify-between"
          style={{ contain: 'paint' }}
        >
          {/* Viewport de deslizamiento horizontal continuo */}
          <div className="relative flex-1 min-h-0 w-full overflow-hidden">
            <div
              className={`flex h-full w-full will-change-transform ${
                isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''
              }`}
              style={{
                transform:
                  heroItems.length <= 1
                    ? 'translate3d(0, 0, 0)'
                    : `translate3d(-${trackIndex * 100}%, 0, 0)`,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
              onTransitionEnd={handleTrackTransitionEnd}
            >
              {extendedHeroItems.map((item, slotIdx) => {
                const itemPhoto =
                  item.allImages?.[selectedPhotos[item.id] ?? 0] || item.imageUrl || null

                return (
                  <div
                    key={`${item.id}-${slotIdx}`}
                    className="w-full h-full shrink-0 p-5 sm:p-7 lg:p-8 flex flex-col justify-between select-none"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center flex-1 min-h-0">
                      {/* Columna Izquierda: Datos Comerciales de la Publicación y Campaña */}
                      <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-2.5 sm:space-y-3 min-w-0 py-1">
                        {/* Badges de Estado y Tipo de Publicación */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          {item.isPaidCampaign ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-3 py-1 text-xs font-black text-white shadow-xs">
                              <span>📢</span>
                              <span>{t.home.sponsoredBadge}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white shadow-xs">
                              <span>✨</span>
                              <span>{t.home.campaignActiveBadge}</span>
                            </span>
                          )}

                          <span className="rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            {item.type === 'service' ? '🔧 Servicio' : '📦 Producto'}
                          </span>

                          {item.city && (
                            <span className="text-xs font-medium text-zinc-500">
                              📍 {item.city}
                            </span>
                          )}
                        </div>

                        {/* Titular Principal y Descripción de la Campaña */}
                        <div className="min-w-0">
                          <h1
                            className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug line-clamp-2 break-words [overflow-wrap:anywhere]"
                            title={item.headline}
                          >
                            {item.headline}
                          </h1>

                          <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed break-words [overflow-wrap:anywhere]">
                            {item.description}
                          </p>
                        </div>

                        {/* Precio Formateado y Datos de Negocio */}
                        <div className="flex flex-wrap items-baseline gap-2 shrink-0">
                          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                            {item.price !== null
                              ? `$ ${item.price.toLocaleString('es-CO')} COP`
                              : 'Cotización Personalizada'}
                          </div>
                          {item.priceUnit && (
                            <span className="text-xs font-bold text-zinc-500">
                              / {item.priceUnit}
                            </span>
                          )}
                        </div>

                        {/* Información del Comercio Vendedor */}
                        <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-sm font-bold text-white shadow-xs">
                            {item.sellerName[0]?.toUpperCase() || 'C'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                                {item.sellerName}
                              </span>
                              {item.sellerVerified && (
                                <span
                                  title="Comercio Verificado Oficialmente"
                                  className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                >
                                  ✓ Verificado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                              <span className="text-amber-500 font-bold">★ {item.sellerRating.toFixed(1)}</span>
                              <span>•</span>
                              <span>Rubro: {item.categoryName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Atributos Clave Configurados de la Publicación */}
                        <div className="h-7 flex flex-wrap items-center gap-1.5 text-[10px] overflow-hidden shrink-0">
                          {item.attrs?.tiempo_entrega && (
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              ⏱️ {item.attrs.tiempo_entrega}
                            </span>
                          )}
                          {item.attrs?.disponibilidad && (
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              ✅ {item.attrs.disponibilidad}
                            </span>
                          )}
                          {item.attrs?.modalidad && (
                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                              📍 {item.attrs.modalidad}
                            </span>
                          )}
                          {item.attrs?.garantia && (
                            <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              🛡️ {item.attrs.garantia}
                            </span>
                          )}
                          {(!item.attrs || Object.keys(item.attrs).length === 0) && (
                            <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                              ⭐ Garantía y soporte directo del comercio
                            </span>
                          )}
                        </div>

                        {/* Botones de Acción Inmediata (WhatsApp y Detalle) */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 shrink-0">
                          {item.sellerWhatsapp ? (
                            <a
                              href={getWhatsappUrl(
                                item.sellerWhatsapp,
                                item.sellerName,
                                item.title,
                                locale
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => trackAdEvent(item, 'whatsapp')}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <span className="text-sm">💬</span>
                              <span>{t.home.contactWhatsappDirect}</span>
                            </a>
                          ) : (
                            <Link
                              href={`/catalogo/${item.listingId}`}
                              onClick={() => trackAdEvent(item, 'click')}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-colors"
                            >
                              <span>🛍️</span>
                              <span>{t.home.viewProductDetails}</span>
                            </Link>
                          )}

                          <Link
                            href={`/catalogo/${item.listingId}`}
                            onClick={() => trackAdEvent(item, 'click')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <span>{t.home.viewProductDetails}</span>
                            <span>↗</span>
                          </Link>

                          <Link
                            href={`/catalogo?seller=${item.sellerId}`}
                            className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline"
                          >
                            Más ofertas →
                          </Link>
                        </div>
                      </div>

                      {/* Columna Derecha: Imagen Principal con Miniaturas */}
                      <div className="lg:col-span-5 flex flex-col items-center justify-center h-full min-w-0">
                        <div className="relative w-full aspect-4/3 max-w-sm max-h-[250px] sm:max-h-[270px] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 shadow-lg border border-zinc-200/80 dark:border-zinc-700/80 group flex items-center justify-center">
                          {itemPhoto ? (
                            <img
                              src={itemPhoto}
                              alt={item.title}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-6 text-center select-none text-zinc-400">
                              <span className="text-6xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                                {item.type === 'service' ? '🛠️' : item.type === 'article' ? '📦' : '🛍️'}
                              </span>
                              {item.categoryName && (
                                <span className="mt-2 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                  {item.categoryName}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Top Badges coincidentes con el explorador de catálogo */}
                          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                            <span className="rounded-md border border-zinc-200/80 bg-white/90 px-2 py-0.5 text-[10px] font-bold backdrop-blur-md text-zinc-700 dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:text-zinc-200">
                              {item.type === 'service' ? '🛠️ Servicio' : item.type === 'article' ? '📦 Artículo (Usado)' : '🛍️ Producto (Nuevo)'}
                            </span>
                            {item.isPaidCampaign && (
                              <span className="rounded-md bg-purple-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                                📢 Patrocinado
                              </span>
                            )}
                          </div>

                          {/* Badge Flotante de Precio */}
                          <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-black/75 px-2.5 py-1 text-xs font-black text-white backdrop-blur-md">
                            {item.price !== null
                              ? `$ ${item.price.toLocaleString('es-CO')}`
                              : 'Cotización'}
                          </div>
                        </div>

                        {/* Fila de Miniaturas si la publicación tiene múltiples fotos */}
                        <div className="h-12 flex items-center justify-center gap-1.5 max-w-sm overflow-x-auto mt-2">
                          {item.allImages && item.allImages.length > 1 && (
                            item.allImages.slice(0, 5).map((img, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedPhotos((prev) => ({ ...prev, [item.id]: idx }))}
                                className={`h-10 w-10 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                                  (selectedPhotos[item.id] ?? 0) === idx
                                    ? 'border-purple-600 scale-105 shadow-md'
                                    : 'border-zinc-200 opacity-70 hover:opacity-100 dark:border-zinc-700'
                                }`}
                              >
                                <img src={img} alt="Miniatura" className="h-full w-full object-cover" />
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Indicadores Circulares de Diapositiva (Dots con tamaño estático que no fuerzan reflow) */}
          {heroItems.length > 1 && (
            <div className="pb-3 pt-1 flex items-center justify-center gap-2 shrink-0 bg-white/40 dark:bg-zinc-900/40">
              {heroItems.map((_, idx) => {
                const isActive = activeHeroIndex === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDotClick(idx)}
                    className="relative h-2.5 w-8 rounded-full overflow-hidden p-0 flex items-center justify-center cursor-pointer bg-zinc-200 dark:bg-zinc-800 transition-colors"
                    aria-label={`Diapositiva ${idx + 1}`}
                  >
                    <span
                      className={`absolute inset-0 rounded-full transition-transform duration-300 ease-out ${
                        isActive
                          ? 'bg-purple-600 dark:bg-purple-500 scale-x-100 opacity-100'
                          : 'scale-x-0 opacity-0'
                      }`}
                    />
                    <span
                      className={`h-1.5 w-1.5 rounded-full transition-opacity duration-200 ${
                        isActive ? 'opacity-0' : 'bg-zinc-400 dark:bg-zinc-600 opacity-100'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export const HeroRunway = memo(HeroRunwayComponent)
export default HeroRunway
