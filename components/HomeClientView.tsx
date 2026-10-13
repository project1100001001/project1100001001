'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import type { Category, ListingWithRelations } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface HomeClientViewProps {
  categories: Category[]
  campaignAds: any[]
  allPublishedListings: ListingWithRelations[]
}

interface ShowcaseItem {
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

const categoryIcons: Record<string, string> = {
  alimentos: '🍲',
  'servicios-hogar': '🔧',
  belleza: '💇',
  'ropa-accesorios': '👗',
  'clases-educacion': '📚',
  otros: '✨',
}

// Filtra rigurosamente imágenes de prueba externas para mostrar íconos/emojis reales como en el catálogo
const isValidUserUploadedImage = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim().toLowerCase()
  if (
    trimmed === '' ||
    trimmed === '/placeholder.png' ||
    trimmed.includes('placeholder') ||
    trimmed.includes('unsplash.com') ||
    trimmed.includes('picsum.photos') ||
    trimmed.includes('dummyimage') ||
    trimmed.includes('via.placeholder') ||
    trimmed.includes('example.com')
  ) {
    return false
  }
  return true
}

export default function HomeClientView({
  categories,
  campaignAds,
  allPublishedListings,
}: HomeClientViewProps) {
  const { t, locale } = useTranslation()

  // 1. Transformar y unificar las campañas y publicaciones en elementos de pasarela
  const showcaseItems: ShowcaseItem[] = useMemo(() => {
    const items: ShowcaseItem[] = []
    const seenListingIds = new Set<string>()

    // Prioridad 1: Campañas publicitarias activas o registradas en ad_order
    campaignAds.forEach((ad) => {
      const listing = ad.listing
      if (!listing) return

      seenListingIds.add(listing.id)

      // Cálculo de vigencia de campaña
      let daysLeft = 7
      if (ad.ends_at) {
        const diff = new Date(ad.ends_at).getTime() - Date.now()
        daysLeft = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
      } else if (ad.package?.duration_days) {
        daysLeft = ad.package.duration_days
      }

      // Obtener exclusivamente imágenes legítimas cargadas por el usuario (mismo criterio que en /catalogo)
      const mediaUrls: string[] = []
      if (listing.listing_media && Array.isArray(listing.listing_media)) {
        listing.listing_media
          .slice()
          .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
          .forEach((m: any) => {
            if (isValidUserUploadedImage(m?.url) && !mediaUrls.includes(m.url)) {
              mediaUrls.push(m.url)
            }
          })
      }

      // Si la campaña adjuntó una imagen personalizada real (no test/unsplash)
      if (isValidUserUploadedImage(ad.image_url) && !mediaUrls.includes(ad.image_url)) {
        mediaUrls.unshift(ad.image_url)
      }

      const primaryImage = mediaUrls[0] || null

      items.push({
        id: `ad-${ad.id}`,
        listingId: listing.id,
        title: listing.title,
        headline: ad.headline || listing.title,
        description: ad.body || listing.description || '',
        imageUrl: primaryImage,
        allImages: mediaUrls,
        price: listing.price,
        priceUnit: listing.price_unit,
        type: listing.type || 'product',
        city: listing.city || ad.target_city || listing.seller?.city || null,
        categoryName: listing.category?.name || 'Catálogo',
        categorySlug: listing.category?.slug || '',
        sellerName: listing.seller?.business_name || 'Comercio Local',
        sellerWhatsapp: listing.seller?.whatsapp || null,
        sellerPhone: listing.seller?.phone || null,
        sellerVerified: Boolean(listing.seller?.verified),
        sellerRating: Number(listing.seller?.rating_avg || 5.0),
        sellerId: listing.seller_id,
        isPaidCampaign: true,
        daysRemaining: daysLeft,
        campaignStatus: ad.status,
        attrs: listing.attrs || {},
      })
    })

    // Prioridad 2: Publicaciones del catálogo (Vitrina de respaldo y complemento)
    allPublishedListings.forEach((listing) => {
      if (seenListingIds.has(listing.id)) return

      const mediaUrls: string[] = []
      if (listing.listing_media && Array.isArray(listing.listing_media)) {
        listing.listing_media
          .slice()
          .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
          .forEach((m: any) => {
            if (isValidUserUploadedImage(m?.url) && !mediaUrls.includes(m.url)) {
              mediaUrls.push(m.url)
            }
          })
      }

      const primaryImage = mediaUrls[0] || null

      items.push({
        id: `listing-${listing.id}`,
        listingId: listing.id,
        title: listing.title,
        headline: listing.title,
        description: listing.description || '',
        imageUrl: primaryImage,
        allImages: mediaUrls,
        price: listing.price,
        priceUnit: listing.price_unit,
        type: listing.type || 'product',
        city: listing.city || listing.seller?.city || null,
        categoryName: listing.category?.name || 'Catálogo',
        categorySlug: listing.category?.slug || '',
        sellerName: listing.seller?.business_name || 'Comercio Local',
        sellerWhatsapp: listing.seller?.whatsapp || null,
        sellerPhone: listing.seller?.phone || null,
        sellerVerified: Boolean(listing.seller?.verified),
        sellerRating: Number(listing.seller?.rating_avg || 5.0),
        sellerId: listing.seller_id,
        isPaidCampaign: false,
        daysRemaining: 15,
        campaignStatus: 'published',
        attrs: listing.attrs || {},
      })
    })

    return items
  }, [campaignAds, allPublishedListings])

  // Subconjuntos específicos para las pasarelas
  const heroItems = useMemo(() => {
    return showcaseItems.slice(0, 5)
  }, [showcaseItems])

  const serviceItems = useMemo(() => {
    return showcaseItems.filter((i) => i.type === 'service')
  }, [showcaseItems])

  const articleItems = useMemo(() => {
    return showcaseItems.filter((i) => i.type === 'article')
  }, [showcaseItems])

  const productItems = useMemo(() => {
    return showcaseItems.filter((i) => i.type === 'product')
  }, [showcaseItems])

  // Comercios únicos para la pasarela de marcas
  const merchantShowcases = useMemo(() => {
    const map = new Map<string, {
      sellerId: string
      name: string
      city: string | null
      verified: boolean
      rating: number
      whatsapp: string | null
      itemsCount: number
      sampleImages: string[]
    }>()

    showcaseItems.forEach((item) => {
      if (!map.has(item.sellerId)) {
        map.set(item.sellerId, {
          sellerId: item.sellerId,
          name: item.sellerName,
          city: item.city,
          verified: item.sellerVerified,
          rating: item.sellerRating,
          whatsapp: item.sellerWhatsapp,
          itemsCount: 1,
          sampleImages: [item.imageUrl].filter(Boolean),
        })
      } else {
        const m = map.get(item.sellerId)!
        m.itemsCount += 1
        if (m.sampleImages.length < 3 && item.imageUrl && !m.sampleImages.includes(item.imageUrl)) {
          m.sampleImages.push(item.imageUrl)
        }
      }
    })

    return Array.from(map.values())
  }, [showcaseItems])

  // Listas con repetición simétrica para ciclo infinito continuo en carrusel
  const loopedServiceItems = useMemo(() => {
    if (serviceItems.length === 0) return []
    const base = serviceItems.length < 4 ? [...serviceItems, ...serviceItems] : serviceItems
    return [...base, ...base]
  }, [serviceItems])

  const loopedArticleItems = useMemo(() => {
    if (articleItems.length === 0) return []
    const base = articleItems.length < 4 ? [...articleItems, ...articleItems] : articleItems
    return [...base, ...base]
  }, [articleItems])

  const loopedProductItems = useMemo(() => {
    if (productItems.length === 0) return []
    const base = productItems.length < 4 ? [...productItems, ...productItems] : productItems
    return [...base, ...base]
  }, [productItems])

  const loopedMerchantShowcases = useMemo(() => {
    if (merchantShowcases.length === 0) return []
    const base = merchantShowcases.length < 4 ? [...merchantShowcases, ...merchantShowcases] : merchantShowcases
    return [...base, ...base]
  }, [merchantShowcases])

  // Estado de la Gran Vitrina Principal (Hero Runway)
  const [heroIndex, setHeroIndex] = useState(0)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

  // Navegación manual de la Gran Vitrina Principal
  const handlePrevHero = () => {
    if (heroItems.length <= 1) return
    setHeroIndex((prev) => (prev === 0 ? heroItems.length - 1 : prev - 1))
    setSelectedPhotoIndex(0)
  }

  const handleNextHero = () => {
    if (heroItems.length <= 1) return
    setHeroIndex((prev) => (prev + 1) % heroItems.length)
    setSelectedPhotoIndex(0)
  }

  // Rotación automática de la Gran Vitrina Hero (fija cada 5.0s continuo en sentido inverso)
  useEffect(() => {
    if (heroItems.length <= 1) return

    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev === 0 ? heroItems.length - 1 : prev - 1))
      setSelectedPhotoIndex(0)
    }, 5000)

    return () => clearInterval(timer)
  }, [heroItems.length])

  // Referencias para desplazamiento horizontal de pasarelas
  const servicesScrollRef = useRef<HTMLDivElement>(null)
  const articlesScrollRef = useRef<HTMLDivElement>(null)
  const productsScrollRef = useRef<HTMLDivElement>(null)
  const merchantsScrollRef = useRef<HTMLDivElement>(null)

  // Hook para desplazamiento horizontal continuo fluido en bucle infinito con pausa al interactuar (en sentido inverso)
  const useContinuousScroll = (
    ref: React.RefObject<HTMLDivElement | null>,
    itemCount: number,
    speed: number = 0.65
  ) => {
    const [isPaused, setIsPaused] = useState(false)
    const isPausedRef = useRef(false)
    const resumeTimerRef = useRef<NodeJS.Timeout | null>(null)

    const pause = useCallback(() => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current)
        resumeTimerRef.current = null
      }
      isPausedRef.current = true
      setIsPaused(true)
    }, [])

    const resume = useCallback(() => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current)
        resumeTimerRef.current = null
      }
      isPausedRef.current = false
      setIsPaused(false)
    }, [])

    const pauseTemporarily = useCallback((ms: number = 2500) => {
      pause()
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = setTimeout(() => {
        resume()
      }, ms)
    }, [pause, resume])

    useEffect(() => {
      if (itemCount <= 1) return

      // Inicializar el scroll en la segunda mitad para permitir desplazamiento continuo en sentido inverso de inmediato
      if (ref.current && ref.current.scrollLeft === 0) {
        const half = ref.current.scrollWidth / 2
        if (half > 0) {
          ref.current.scrollLeft = half
        }
      }

      let animId: number
      let lastTime: number | null = null

      const step = (time: number) => {
        if (!ref.current) {
          animId = requestAnimationFrame(step)
          return
        }

        if (lastTime === null) {
          lastTime = time
        }
        const delta = Math.min(time - lastTime, 50)
        lastTime = time

        if (!isPausedRef.current) {
          const el = ref.current
          const halfScroll = el.scrollWidth / 2

          if (halfScroll > 0) {
            // Si llega o está en el extremo izquierdo (<= 0), reposicionar a la mitad para mantener bucle continuo
            if (el.scrollLeft <= 0) {
              el.scrollLeft += halfScroll
            }

            // Movimiento continuo suave en sentido contrario (disminuyendo scrollLeft)
            const px = (speed * delta) / 16.67
            el.scrollLeft -= px

            // Bucle infinito continuo sin cortes perceptibles en sentido contrario
            if (el.scrollLeft <= 0) {
              el.scrollLeft += halfScroll
            }
          }
        }

        animId = requestAnimationFrame(step)
      }

      animId = requestAnimationFrame(step)

      return () => {
        cancelAnimationFrame(animId)
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      }
    }, [ref, itemCount, speed])

    return { isPaused, pause, resume, pauseTemporarily }
  }

  // Controladores de desplazamiento continuo para cada pasarela
  const servicesControl = useContinuousScroll(servicesScrollRef, serviceItems.length, 0.65)
  const articlesControl = useContinuousScroll(articlesScrollRef, articleItems.length, 0.65)
  const productsControl = useContinuousScroll(productsScrollRef, productItems.length, 0.65)
  const merchantsControl = useContinuousScroll(merchantsScrollRef, merchantShowcases.length, 0.65)

  // Desplazamiento manual asistido (botones ◀ y ▶) con pausa temporal
  const scrollCarousel = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: 'left' | 'right',
    pauseFn?: (ms?: number) => void
  ) => {
    if (!ref.current) return
    const el = ref.current
    const card = el.firstElementChild as HTMLElement | null
    const cardWidth = card ? card.offsetWidth + 20 : 340
    const halfScroll = el.scrollWidth / 2

    // Pausar temporalmente para que el usuario pueda interactuar con el resultado manual
    if (pauseFn) {
      pauseFn(2500)
    }

    if (direction === 'right') {
      if (halfScroll > 0 && el.scrollLeft >= halfScroll - 10) {
        el.scrollTo({ left: Math.max(0, el.scrollLeft - halfScroll), behavior: 'instant' as ScrollBehavior })
      }
      el.scrollBy({ left: cardWidth, behavior: 'smooth' })
    } else {
      if (halfScroll > 0 && el.scrollLeft <= 10) {
        el.scrollTo({ left: el.scrollLeft + halfScroll, behavior: 'instant' as ScrollBehavior })
      }
      el.scrollBy({ left: -cardWidth, behavior: 'smooth' })
    }
  }

  const handleLoopScroll = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return
    const el = ref.current
    const halfScroll = el.scrollWidth / 2
    if (halfScroll > 0) {
      if (el.scrollLeft >= halfScroll) {
        el.scrollLeft -= halfScroll
      } else if (el.scrollLeft <= 0) {
        el.scrollLeft += halfScroll
      }
    }
  }

  // Generador de enlace WhatsApp con mensaje predeterminado
  const getWhatsappUrl = (phoneRaw: string | null, sellerName: string, title: string) => {
    if (!phoneRaw) return ''
    let cleaned = phoneRaw.replace(/\D/g, '')
    if (cleaned.length === 10) {
      cleaned = `57${cleaned}`
    }
    const msg =
      locale === 'en'
        ? `Hello ${sellerName}, I saw your featured publication "${title}" on the Marketplace and would like more details.`
        : `Hola ${sellerName}, vi su publicación destacada "${title}" en la vitrina del Marketplace y me gustaría solicitar información.`
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`
  }

  const currentHero = heroItems[heroIndex] || heroItems[0]
  const currentHeroPhoto =
    currentHero?.allImages?.[selectedPhotoIndex] || currentHero?.imageUrl || null

  // Registro analítico de eventos de campaña en tiempo real
  const trackAdEvent = (item: ShowcaseItem, eventType: 'impression' | 'click' | 'whatsapp') => {
    if (!item) return
    try {
      fetch('/api/ad-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adOrderId: item.id,
          eventType,
          listingId: item.listingId,
        }),
      }).catch(() => {})
    } catch {
      // Non-blocking
    }
  }

  // Registrar impresión en la vitrina
  useEffect(() => {
    if (currentHero) {
      trackAdEvent(currentHero, 'impression')
    }
  }, [currentHero?.id])

  return (
    <main className="flex-1 bg-zinc-50/50 pb-20 dark:bg-zinc-950 overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* 1. PASARELA PRINCIPAL (GRAN VITRINA HERO RUNWAY)                           */}
      {/* Sustituye al campo de búsqueda tradicional por la vitrina de campañas     */}
      {/* ========================================================================= */}
      {currentHero && (
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

            {/* Tarjeta de Exhibición Dinámica Split (Doble Columna) */}
            <div className="relative rounded-3xl border border-zinc-200/80 bg-white/90 p-6 sm:p-10 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90 transition-all duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Columna Izquierda: Datos Comerciales de la Publicación y Campaña */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Badges de Estado y Tipo de Publicación */}
                  <div className="flex flex-wrap items-center gap-2">
                    {currentHero.isPaidCampaign ? (
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
                      {currentHero.type === 'service' ? '🔧 Servicio' : '📦 Producto'}
                    </span>

                    {currentHero.city && (
                      <span className="text-xs font-medium text-zinc-500">
                        📍 {currentHero.city}
                      </span>
                    )}
                  </div>

                  {/* Titular Principal y Descripción de la Campaña */}
                  <div>
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                      {currentHero.headline}
                    </h1>

                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                      {currentHero.description}
                    </p>
                  </div>

                  {/* Precio Formateado y Datos de Negocio */}
                  <div className="flex flex-wrap items-baseline gap-3 pt-1">
                    <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                      {currentHero.price !== null
                        ? `$ ${currentHero.price.toLocaleString('es-CO')} COP`
                        : 'Cotización Personalizada'}
                    </div>
                    {currentHero.priceUnit && (
                      <span className="text-sm font-bold text-zinc-500">
                        / {currentHero.priceUnit}
                      </span>
                    )}
                  </div>

                  {/* Información del Comercio Vendedor */}
                  <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3.5 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-base font-bold text-white shadow-xs">
                      {currentHero.sellerName[0]?.toUpperCase() || 'C'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                          {currentHero.sellerName}
                        </span>
                        {currentHero.sellerVerified && (
                          <span
                            title="Comercio Verificado Oficialmente"
                            className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          >
                            ✓ Verificado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <span className="text-amber-500 font-bold">★ {currentHero.sellerRating.toFixed(1)}</span>
                        <span>•</span>
                        <span>Rubro: {currentHero.categoryName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Atributos Clave Configurados de la Publicación */}
                  {currentHero.attrs && Object.keys(currentHero.attrs).length > 0 && (
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {currentHero.attrs.tiempo_entrega && (
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          ⏱️ Entrega: {currentHero.attrs.tiempo_entrega}
                        </span>
                      )}
                      {currentHero.attrs.disponibilidad && (
                        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          ✅ {currentHero.attrs.disponibilidad}
                        </span>
                      )}
                      {currentHero.attrs.modalidad && (
                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                          📍 Modalidad: {currentHero.attrs.modalidad}
                        </span>
                      )}
                      {currentHero.attrs.garantia && (
                        <span className="rounded-lg bg-zinc-100 px-2.5 py-1 font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          🛡️ Garantía: {currentHero.attrs.garantia}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Botones de Acción Inmediata (WhatsApp y Detalle) */}
                  <div className="flex flex-wrap items-center gap-3 pt-3">
                    {currentHero.sellerWhatsapp ? (
                      <a
                        href={getWhatsappUrl(
                          currentHero.sellerWhatsapp,
                          currentHero.sellerName,
                          currentHero.title
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackAdEvent(currentHero, 'whatsapp')}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span className="text-base">💬</span>
                        <span>{t.home.contactWhatsappDirect}</span>
                      </a>
                    ) : (
                      <Link
                        href={`/catalogo/${currentHero.listingId}`}
                        onClick={() => trackAdEvent(currentHero, 'click')}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-colors"
                      >
                        <span>🛍️</span>
                        <span>{t.home.viewProductDetails}</span>
                      </Link>
                    )}

                    <Link
                      href={`/catalogo/${currentHero.listingId}`}
                      onClick={() => trackAdEvent(currentHero, 'click')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <span>{t.home.viewProductDetails}</span>
                      <span>↗</span>
                    </Link>

                    <Link
                      href={`/catalogo?seller=${currentHero.sellerId}`}
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline"
                    >
                      Ver más ofertas del vendedor →
                    </Link>
                  </div>
                </div>

                {/* Columna Derecha: Imagen Principal con Miniaturas */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="relative w-full aspect-4/3 max-w-md overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 shadow-xl border border-zinc-200/80 dark:border-zinc-700/80 group flex items-center justify-center">
                    {currentHeroPhoto ? (
                      <img
                        src={currentHeroPhoto}
                        alt={currentHero.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center select-none text-zinc-400">
                        <span className="text-7xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                          {currentHero.type === 'service' ? '🛠️' : currentHero.type === 'article' ? '📦' : '🛍️'}
                        </span>
                        {currentHero.categoryName && (
                          <span className="mt-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                            {currentHero.categoryName}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Top Badges coincidentes con el explorador de catálogo */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="rounded-md border border-zinc-200/80 bg-white/90 px-2 py-0.5 text-[11px] font-bold backdrop-blur-md text-zinc-700 dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:text-zinc-200">
                        {currentHero.type === 'service' ? '🛠️ Servicio' : currentHero.type === 'article' ? '📦 Artículo (Usado)' : '🛍️ Producto (Nuevo)'}
                      </span>
                      {currentHero.isPaidCampaign && (
                        <span className="rounded-md bg-purple-600 px-2 py-0.5 text-[11px] font-extrabold text-white shadow-xs">
                          📢 Patrocinado
                        </span>
                      )}
                    </div>

                    {/* Badge Flotante de Precio */}
                    <div className="absolute bottom-3 left-3 rounded-xl bg-black/75 px-3 py-1.5 text-xs font-black text-white backdrop-blur-md">
                      {currentHero.price !== null
                        ? `$ ${currentHero.price.toLocaleString('es-CO')}`
                        : 'Cotización'}
                    </div>
                  </div>

                  {/* Fila de Miniaturas si la publicación tiene múltiples fotos */}
                  {currentHero.allImages && currentHero.allImages.length > 1 && (
                    <div className="mt-3 flex items-center justify-center gap-2 max-w-md overflow-x-auto p-1">
                      {currentHero.allImages.slice(0, 5).map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedPhotoIndex(idx)}
                          className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                            selectedPhotoIndex === idx
                              ? 'border-purple-600 scale-105 shadow-md'
                              : 'border-zinc-200 opacity-70 hover:opacity-100 dark:border-zinc-700'
                          }`}
                        >
                          <img src={img} alt="Miniatura" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Indicadores Circulares de Diapositiva (Dots) */}
              {heroItems.length > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  {heroItems.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setHeroIndex(idx)
                        setSelectedPhotoIndex(0)
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        heroIndex === idx
                          ? 'w-8 bg-purple-600 dark:bg-purple-500'
                          : 'w-2 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700'
                      }`}
                      aria-label={`Diapositiva ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. PASARELA DE SERVICIOS Y SOLUCIONES (SERVICES RUNWAY)                   */}
      {/* Segundo orden: destaca tiempos de respuesta, ejecución y cotización rápida */}
      {/* ========================================================================= */}
      {serviceItems.length > 0 && (
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
                  servicesControl.isPaused
                    ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                    : 'text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900'
                }`}
                title={servicesControl.isPaused ? 'Desplazamiento pausado por interacción' : 'Desplazamiento continuo fluido activo'}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${servicesControl.isPaused ? 'bg-amber-500' : 'bg-purple-500 animate-pulse'}`} />
                <span className="hidden sm:inline">{servicesControl.isPaused ? 'Pausado' : 'Continuo'}</span>
              </span>

              <button
                type="button"
                onClick={() => scrollCarousel(servicesScrollRef, 'left', servicesControl.pauseTemporarily)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
                aria-label="Desplazar a la izquierda"
                title="Servicio anterior"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel(servicesScrollRef, 'right', servicesControl.pauseTemporarily)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
                aria-label="Desplazar a la derecha"
                title="Siguiente servicio"
              >
                ▶
              </button>
            </div>
          </div>

          <div
            ref={servicesScrollRef}
            onScroll={() => handleLoopScroll(servicesScrollRef)}
            onMouseEnter={servicesControl.pause}
            onMouseLeave={servicesControl.resume}
            onTouchStart={servicesControl.pause}
            onTouchEnd={() => servicesControl.pauseTemporarily(2500)}
            className="flex gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar select-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loopedServiceItems.map((item, idx) => {
              const whatsappUrl = getWhatsappUrl(item.sellerWhatsapp, item.sellerName, item.title)

              return (
                <div
                  key={`${item.id}-${idx}`}
                  onMouseEnter={servicesControl.pause}
                  onMouseLeave={servicesControl.resume}
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
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. PASARELA DE ARTÍCULOS USADOS (ARTICLES / PRE-OWNED RUNWAY)             */}
      {/* División de productos: Artículos usados y de segunda mano primero        */}
      {/* ========================================================================= */}
      {articleItems.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📦</span>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {t.home.articlesRunwayTitle}
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {t.home.articlesRunwaySubtitle}
              </p>
            </div>

            {/* Controles de Desplazamiento y Estado de Rotación */}
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all select-none border ${
                  articlesControl.isPaused
                    ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                    : 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                }`}
                title={articlesControl.isPaused ? 'Desplazamiento pausado por interacción' : 'Desplazamiento continuo fluido activo'}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${articlesControl.isPaused ? 'bg-amber-500' : 'bg-amber-500 animate-pulse'}`} />
                <span className="hidden sm:inline">{articlesControl.isPaused ? 'Pausado' : 'Continuo'}</span>
              </span>

              <button
                type="button"
                onClick={() => scrollCarousel(articlesScrollRef, 'left', articlesControl.pauseTemporarily)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
                aria-label="Desplazar a la izquierda"
                title="Artículo anterior"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel(articlesScrollRef, 'right', articlesControl.pauseTemporarily)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
                aria-label="Desplazar a la derecha"
                title="Siguiente artículo"
              >
                ▶
              </button>
            </div>
          </div>

          {/* Contenedor Carrusel Deslizante en Loop */}
          <div
            ref={articlesScrollRef}
            onScroll={() => handleLoopScroll(articlesScrollRef)}
            onMouseEnter={articlesControl.pause}
            onMouseLeave={articlesControl.resume}
            onTouchStart={articlesControl.pause}
            onTouchEnd={() => articlesControl.pauseTemporarily(2500)}
            className="flex gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar select-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loopedArticleItems.map((item, idx) => {
              const whatsappUrl = getWhatsappUrl(item.sellerWhatsapp, item.sellerName, item.title)
              const conditionLabel = item.attrs?.condition || 'Usado'

              return (
                <div
                  key={`${item.id}-${idx}`}
                  onMouseEnter={articlesControl.pause}
                  onMouseLeave={articlesControl.resume}
                  className="w-72 sm:w-80 shrink-0 flex flex-col justify-between rounded-2xl border border-amber-200/70 bg-white p-4 shadow-xs hover:shadow-lg transition-all dark:border-amber-900/30 dark:bg-zinc-900 group"
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
                            📦
                          </span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                        <span className="rounded-md border border-amber-300 bg-amber-50/95 px-2 py-0.5 text-[10px] font-bold backdrop-blur-md text-amber-800 dark:border-amber-800 dark:bg-amber-950/90 dark:text-amber-200">
                          📦 Artículo (Usado)
                        </span>
                        {item.isPaidCampaign && (
                          <span className="rounded-md bg-purple-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                            📢 Patrocinado
                          </span>
                        )}
                      </div>

                      {/* Bottom Condition Badge */}
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className="rounded-md bg-zinc-900/80 px-2 py-0.5 text-[10px] font-semibold text-amber-300 backdrop-blur-md">
                          ♻️ {conditionLabel}
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
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
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

                    {/* Precio y Método */}
                    <div className="mt-3 flex items-baseline justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {item.price !== null
                          ? `$ ${item.price.toLocaleString('es-CO')}`
                          : 'Cotización'}
                      </span>
                      {item.attrs?.delivery_method && (
                        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                          🚚 {item.attrs.delivery_method}
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
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. PASARELA DE PRODUCTOS NUEVOS (NEW PRODUCTS RUNWAY)                     */}
      {/* Luego productos nuevos a estrenar                                         */}
      {/* ========================================================================= */}
      {productItems.length > 0 && (
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
                  productsControl.isPaused
                    ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                    : 'text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900'
                }`}
                title={productsControl.isPaused ? 'Desplazamiento pausado por interacción' : 'Desplazamiento continuo fluido activo'}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${productsControl.isPaused ? 'bg-amber-500' : 'bg-blue-500 animate-pulse'}`} />
                <span className="hidden sm:inline">{productsControl.isPaused ? 'Pausado' : 'Continuo'}</span>
              </span>

              <button
                type="button"
                onClick={() => scrollCarousel(productsScrollRef, 'left', productsControl.pauseTemporarily)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
                aria-label="Desplazar a la izquierda"
                title="Producto anterior"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel(productsScrollRef, 'right', productsControl.pauseTemporarily)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
                aria-label="Desplazar a la derecha"
                title="Siguiente producto"
              >
                ▶
              </button>
            </div>
          </div>

          {/* Contenedor Carrusel Deslizante en Loop */}
          <div
            ref={productsScrollRef}
            onScroll={() => handleLoopScroll(productsScrollRef)}
            onMouseEnter={productsControl.pause}
            onMouseLeave={productsControl.resume}
            onTouchStart={productsControl.pause}
            onTouchEnd={() => productsControl.pauseTemporarily(2500)}
            className="flex gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar select-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loopedProductItems.map((item, idx) => {
              const whatsappUrl = getWhatsappUrl(item.sellerWhatsapp, item.sellerName, item.title)

              return (
                <div
                  key={`${item.id}-${idx}`}
                  onMouseEnter={productsControl.pause}
                  onMouseLeave={productsControl.resume}
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
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. PASARELA DE MARCAS Y COMERCIOS (MERCHANTS BRAND RUNWAY)                */}
      {/* Muestra los comercios con campañas y sus catálogos activos                */}
      {/* ========================================================================= */}
      {merchantShowcases.length > 0 && (
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
                  merchantsControl.isPaused
                    ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                    : 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900'
                }`}
                title={merchantsControl.isPaused ? 'Desplazamiento pausado por interacción' : 'Desplazamiento continuo fluido activo'}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${merchantsControl.isPaused ? 'bg-amber-500' : 'bg-indigo-500 animate-pulse'}`} />
                <span className="hidden sm:inline">{merchantsControl.isPaused ? 'Pausado' : 'Continuo'}</span>
              </span>

              <button
                type="button"
                onClick={() => scrollCarousel(merchantsScrollRef, 'left', merchantsControl.pauseTemporarily)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
                aria-label="Desplazar a la izquierda"
                title="Comercio anterior"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel(merchantsScrollRef, 'right', merchantsControl.pauseTemporarily)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
                aria-label="Desplazar a la derecha"
                title="Siguiente comercio"
              >
                ▶
              </button>
            </div>
          </div>

          <div
            ref={merchantsScrollRef}
            onScroll={() => handleLoopScroll(merchantsScrollRef)}
            onMouseEnter={merchantsControl.pause}
            onMouseLeave={merchantsControl.resume}
            onTouchStart={merchantsControl.pause}
            onTouchEnd={() => merchantsControl.pauseTemporarily(2500)}
            className="flex gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar select-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loopedMerchantShowcases.map((merchant, idx) => (
              <div
                key={`${merchant.sellerId}-${idx}`}
                onMouseEnter={merchantsControl.pause}
                onMouseLeave={merchantsControl.resume}
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
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. ACCESO RÁPIDO POR CATÁLOGOS: SERVICIOS, USADOS Y NUEVOS               */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>🏷️</span>
            <span>
              {locale === 'en'
                ? 'Explore by Catalog: Services, Used & New'
                : 'Explora por Catálogo: Servicios, Usados y Nuevos'}
            </span>
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {locale === 'en'
              ? 'Direct access to independent catalogs with specialized filters and modalities.'
              : 'Acceso directo a las ventanas independientes de catálogo con sus propios filtros y modalidades especializadas.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. SERVICIOS */}
          <Link
            href="/catalogo?type=service"
            className="group flex flex-col justify-between rounded-2xl border border-purple-200 bg-white p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-purple-500 hover:shadow-md dark:border-purple-900/50 dark:bg-zinc-900"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl transition-transform group-hover:scale-110 dark:bg-purple-950/60">
                  🛠️
                </span>
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
                  {locale === 'en' ? 'Services' : 'Servicios'}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                {locale === 'en' ? 'Professional Services' : 'Servicios Profesionales'}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {locale === 'en'
                  ? 'Quotes on request, on-site or remote assistance, and expert response times.'
                  : 'Cotizaciones a solicitud, asesorías, modalidades presenciales o virtuales y tiempos de respuesta.'}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-purple-100 dark:border-purple-900/30 flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-300">
              <span>{locale === 'en' ? 'Explore Services' : 'Ver Catálogo de Servicios'}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>

          {/* 2. ARTÍCULOS USADOS */}
          <Link
            href="/catalogo?type=article"
            className="group flex flex-col justify-between rounded-2xl border border-amber-200 bg-white p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-amber-500 hover:shadow-md dark:border-amber-900/50 dark:bg-zinc-900"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl transition-transform group-hover:scale-110 dark:bg-amber-950/60">
                  📦
                </span>
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                  {locale === 'en' ? 'Used Articles' : 'Artículos Usados'}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                {locale === 'en' ? 'Used Articles' : 'Artículos Usados'}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {locale === 'en'
                  ? 'Second-hand deals, pre-owned opportunities and verified local merchant inventory.'
                  : 'Oportunidades únicas de segunda mano, liquidaciones y artículos de comercios locales.'}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-amber-100 dark:border-amber-900/30 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
              <span>{locale === 'en' ? 'Explore Used Articles' : 'Ver Catálogo de Usados'}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>

          {/* 3. PRODUCTOS NUEVOS */}
          <Link
            href="/catalogo?type=product"
            className="group flex flex-col justify-between rounded-2xl border border-blue-200 bg-white p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-blue-500 hover:shadow-md dark:border-blue-900/50 dark:bg-zinc-900"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl transition-transform group-hover:scale-110 dark:bg-blue-950/60">
                  ✨
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                  {locale === 'en' ? 'New Products' : 'Productos Nuevos'}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                {locale === 'en' ? 'New Products' : 'Productos Nuevos'}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {locale === 'en'
                  ? 'Brand-new factory items with seller warranty and fast shipping or store pickup.'
                  : 'Productos a estrenar de fábrica con garantía de vendedor y métodos de entrega inmediata.'}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-blue-100 dark:border-blue-900/30 flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
              <span>{locale === 'en' ? 'Explore New Products' : 'Ver Catálogo de Nuevos'}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. BANNER PARA VENDEDORES: IMPULSA TU CAMPAÑA                             */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 p-6 sm:p-10 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
              <span>🚀</span>
              <span>Campañas & Vitrina Comercial</span>
            </span>

            <h3 className="text-xl sm:text-3xl font-black tracking-tight">
              {t.home.boostYourProductCta}
            </h3>

            <p className="text-xs sm:text-sm text-purple-100 leading-relaxed max-w-xl">
              {t.home.boostYourProductDesc}
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-purple-200">
              <span className="font-semibold">💡 Tip para vendedores:</span>
              <span>
                Activa y administra tus campañas patrocinadas desde el menú lateral izquierdo en{' '}
                <strong className="text-white">Mis Campañas → Configurar Campaña</strong>.
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
