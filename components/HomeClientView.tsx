// components/HomeClientView.tsx
'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Category, ListingWithRelations } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'
import HeroRunway, { type ShowcaseItem } from '@/components/HeroRunway'
import ServicesRunway from '@/components/ServicesRunway'
import ArticlesRunway from '@/components/ArticlesRunway'
import ProductsRunway from '@/components/ProductsRunway'
import MerchantsRunway, { type MerchantShowcase } from '@/components/MerchantsRunway'
import BuyerRequestsRunway from '@/components/BuyerRequestsRunway'
import {
  type BuyerClassifiedRequest,
  INITIAL_BUYER_REQUESTS,
  BUYER_REQUESTS_STORAGE_KEY,
  sanitizeBuyerRequestsList,
} from '@/lib/buyerRequests'
import {
  resolveAdOrderPlacement,
  extractSeasonalRunwayMeta,
  getListingFreeTrialStatus,
  resolveIndependentRunwayStates,
  INDEPENDENT_RUNWAY_OVERRIDES_KEY,
} from '@/lib/adPolicies'
import {
  type AdPageConfig,
  type DynamicRunwayConfig,
  DEFAULT_AD_PAGE_CONFIG,
  AD_PAGE_CONFIG_STORAGE_KEY,
  sanitizeAdPageConfig,
} from '@/lib/adPageConfig'
import {
  useGpuContinuousScroll,
  createLoopedItems,
  getWhatsappUrl,
  getListingReferenceCode,
  trackAdEvent,
} from '@/lib/useContinuousScroll'

function ExclusiveCatalogRunwayTrack({
  customRunway,
  items,
  exclusivePosition,
  locale,
  scrollSpeed = 0.65,
}: {
  customRunway: DynamicRunwayConfig
  items: ShowcaseItem[]
  exclusivePosition: number
  locale: string
  scrollSpeed?: number
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const loopedItems = useMemo(() => createLoopedItems(items), [items])
  const control = useGpuContinuousScroll({
    trackRef,
    itemCount: items.length,
    speed: customRunway.scrollSpeed || scrollSpeed,
  })

  if (items.length === 0) return null

  const rTitle = customRunway.title
  const rSubtitle = customRunway.subtitle
  const rBadge = customRunway.badge

  return (
    <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      {/* Cabecera Sutil y Exclusiva de la Pasarela de Temporada / Ofertas */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 pb-3 border-b border-zinc-200/70 dark:border-zinc-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-300 dark:bg-amber-400/15 dark:text-amber-300 dark:border dark:border-amber-400/30">
              ✦ Exclusivo #{exclusivePosition}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50/90 border border-amber-200/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-950/50 dark:border-amber-800/60 dark:text-amber-300">
              <span>{rBadge}</span>
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>{customRunway.icon}</span>
            <span>{rTitle}</span>
          </h2>
          {rSubtitle && (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {rSubtitle}
            </p>
          )}
        </div>

        {/* Controles de Desplazamiento Continuo y Manual */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all select-none border ${
              control.isPaused
                ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                : 'text-zinc-700 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                control.isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
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
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => control.stepManual('right')}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
            aria-label="Desplazar a la derecha"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Carrusel Continuo con Tarjetas Full-Bleed (Imagen al 100% del recuadro + Textos y Botones superpuestos) */}
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
            const refCode = getListingReferenceCode(item.listingId, item.attrs)
            const whatsappUrl = getWhatsappUrl(
              item.sellerWhatsapp,
              item.sellerName,
              item.title,
              locale,
              {
                listingId: item.listingId,
                referenceCode: refCode,
                type: item.type,
                categoryName: item.categoryName,
                price: item.price,
                priceUnit: item.priceUnit,
                city: item.city,
                attrs: item.attrs,
              }
            )

            return (
              <article
                key={`${customRunway.id}-${item.id}-${idx}`}
                onMouseEnter={control.pause}
                onMouseLeave={control.resume}
                className="group relative h-[350px] sm:h-[370px] w-72 sm:w-80 shrink-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-amber-400/70 dark:border-zinc-800"
              >
                {/* 1. Imagen cubriendo el 100% del recuadro de presentación */}
                <Link
                  href={`/catalogo/${item.listingId}`}
                  onClick={() => trackAdEvent(item, 'click')}
                  className="absolute inset-0 block h-full w-full"
                  aria-label={item.headline || item.title}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 via-indigo-950 to-purple-950 text-6xl">
                      <span className="opacity-35 transition-transform duration-500 group-hover:scale-110">
                        {item.type === 'service'
                          ? '🛠️'
                          : item.type === 'article'
                          ? '📦'
                          : '🛍️'}
                      </span>
                    </div>
                  )}

                  {/* Velos de contraste multicapa para garantizar legibilidad perfecta sobre cualquier foto */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 via-black/25 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-black/95 via-black/75 to-transparent" />
                </Link>

                {/* 2. Capa de Contenido Superpuesta con Alineación Fija Superior e Inferior */}
                <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between p-4">
                  {/* Fila Superior: Insignia de Temporada y Código de Referencia */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-extrabold text-amber-300 backdrop-blur-md border border-white/15 shadow-2xs truncate max-w-[65%]">
                      <span>{customRunway.icon}</span>
                      <span className="truncate">{rBadge}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[10px] font-bold text-white/95 backdrop-blur-md border border-white/15 shadow-2xs">
                      📌 {refCode}
                    </span>
                  </div>

                  {/* Bloque Inferior: Precio, Título, Vendedor y Botones perfectamente alineados */}
                  <div className="space-y-2.5">
                    {/* Precio y Categoría */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-lg bg-amber-400/95 px-2.5 py-0.5 text-xs font-black text-zinc-950 shadow-xs">
                        {item.price
                          ? `$${Number(item.price).toLocaleString('es-CO')} COP`
                          : 'Cotizar'}
                      </span>
                      {item.categoryName && (
                        <span className="truncate max-w-[45%] rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-zinc-100 backdrop-blur-md border border-white/15">
                          {item.categoryName}
                        </span>
                      )}
                    </div>

                    {/* Título con altura fija de 2 líneas para mantener la alineación entre todas las tarjetas */}
                    <div className="min-h-[2.6rem] flex items-end">
                      <Link
                        href={`/catalogo/${item.listingId}`}
                        onClick={() => trackAdEvent(item, 'click')}
                        className="pointer-events-auto block w-full"
                      >
                        <h3
                          className="text-sm sm:text-[15px] font-extrabold text-white leading-snug line-clamp-2 drop-shadow-xs group-hover:text-amber-200 transition-colors"
                          title={item.headline || item.title}
                        >
                          {item.headline || item.title}
                        </h3>
                      </Link>
                    </div>

                    {/* Vendedor, Ciudad y Calificación */}
                    <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-200/90 border-t border-white/15 pt-2">
                      <span className="truncate">
                        🏪 <strong className="font-semibold text-white">{item.sellerName}</strong>
                        {item.city ? ` • ${item.city}` : ''}
                      </span>
                      <span className="shrink-0 font-bold text-amber-400">
                        ★ {item.sellerRating.toFixed(1)}
                      </span>
                    </div>

                    {/* Botones de Acción Superpuestos con Efecto Cristal (Glassmorphism) */}
                    <div className="pointer-events-auto grid grid-cols-2 gap-2 pt-0.5">
                      {whatsappUrl ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackAdEvent(item, 'whatsapp')}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/95 px-3 text-xs font-extrabold text-white shadow-sm backdrop-blur-md hover:bg-emerald-400 transition-all"
                        >
                          <span>💬</span>
                          <span>WhatsApp</span>
                        </a>
                      ) : null}
                      <Link
                        href={`/catalogo/${item.listingId}`}
                        onClick={() => trackAdEvent(item, 'click')}
                        className={`inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-white/30 bg-white/15 px-3 text-xs font-bold text-white backdrop-blur-md hover:bg-white/25 transition-all ${
                          !whatsappUrl ? 'col-span-2' : ''
                        }`}
                      >
                        <span>Ver ficha</span>
                        <span>↗</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

interface HomeClientViewProps {
  categories: Category[]
  campaignAds: any[]
  allPublishedListings: ListingWithRelations[]
  initialAdPageConfig?: AdPageConfig
  initialBuyerRequests?: BuyerClassifiedRequest[]
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
  campaignAds,
  allPublishedListings,
  initialAdPageConfig,
  initialBuyerRequests,
}: HomeClientViewProps) {
  const { t, locale } = useTranslation()
  const [adPageConfig, setAdPageConfig] = useState<AdPageConfig>(() =>
    sanitizeAdPageConfig(initialAdPageConfig || DEFAULT_AD_PAGE_CONFIG)
  )
  const [buyerRequests, setBuyerRequests] = useState<BuyerClassifiedRequest[]>(() =>
    sanitizeBuyerRequestsList(initialBuyerRequests || INITIAL_BUYER_REQUESTS)
  )
  const [viewerRole, setViewerRole] = useState<'guest' | 'buyer' | 'seller' | 'admin'>('guest')
  const [selectedExclusiveRunwayId, setSelectedExclusiveRunwayId] = useState<string>('all')

  // Sincronizar con ajustes administrativos locales o eventos en vivo y detectar rol de sesión
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AD_PAGE_CONFIG_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setAdPageConfig(sanitizeAdPageConfig(parsed))
      }
    } catch {
      // Ignorar errores de almacenamiento local
    }

    try {
      const savedRequests = localStorage.getItem(BUYER_REQUESTS_STORAGE_KEY)
      if (savedRequests) {
        const parsedReqs = JSON.parse(savedRequests)
        if (Array.isArray(parsedReqs) && parsedReqs.length > 0) {
          setBuyerRequests(sanitizeBuyerRequestsList(parsedReqs))
        }
      }
    } catch {
      // Ignorar errores de almacenamiento local
    }

    async function detectViewerRole() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setViewerRole('guest')
          return
        }
        const { data: profile } = await supabase
          .from('app_user')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        if (profile?.role === 'admin') {
          setViewerRole('admin')
        } else if (profile?.role === 'seller') {
          setViewerRole('seller')
        } else {
          setViewerRole('buyer')
        }
      } catch {
        setViewerRole('guest')
      }
    }
    detectViewerRole()

    const handleConfigUpdate = (e: any) => {
      if (e?.detail) {
        setAdPageConfig(sanitizeAdPageConfig(e.detail))
      }
    }
    const handleRequestsUpdate = (e: any) => {
      if (e?.detail) {
        setBuyerRequests(sanitizeBuyerRequestsList(e.detail))
      }
    }
    window.addEventListener('ad-page-config-updated', handleConfigUpdate)
    window.addEventListener('buyer-requests-updated', handleRequestsUpdate)
    return () => {
      window.removeEventListener('ad-page-config-updated', handleConfigUpdate)
      window.removeEventListener('buyer-requests-updated', handleRequestsUpdate)
    }
  }, [])

  // 1. Transformar y unificar las campañas y publicaciones en elementos de pasarela
  const showcaseItems: ShowcaseItem[] = useMemo(() => {
    const items: ShowcaseItem[] = []
    const seenListingIds = new Set<string>()
    const maxPhotos = adPageConfig.maxPhotosPerItem || 5

    // Límite opcional por mismo vendedor desde configuraciones extensibles
    const maxPerSellerSetting = adPageConfig.customSettings?.find(
      (s) => s.key === 'max_featured_per_seller'
    )
    const maxPerSeller =
      maxPerSellerSetting && Number(maxPerSellerSetting.value) > 0
        ? Number(maxPerSellerSetting.value)
        : 999
    const sellerCounts = new Map<string, number>()

    // Prioridad 1: Campañas publicitarias activas o vigentes registradas en ad_order
    campaignAds.forEach((ad) => {
      const listing = ad.listing
      if (!listing) return
      if (listing.seller?.status === 'blocked' || listing.seller?.status === 'suspended') return

      // Si la orden fue rechazada, cancelada, pausada o finalizada, no se exhibe como campaña activa
      if (['rejected', 'cancelled', 'paused', 'ended'].includes(ad.status)) {
        return
      }

      // Cálculo de vigencia de campaña: si ends_at ya venció, caduca su exhibición patrocinada
      let daysLeft = 7
      if (ad.ends_at) {
        const diff = new Date(ad.ends_at).getTime() - Date.now()
        if (diff <= 0) {
          return
        }
        daysLeft = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
      } else if (ad.package?.duration_days) {
        daysLeft = ad.package.duration_days
      }

      const currentSellerCount = sellerCounts.get(listing.seller_id) || 0
      if (currentSellerCount >= maxPerSeller) return
      sellerCounts.set(listing.seller_id, currentSellerCount + 1)

      seenListingIds.add(listing.id)
      const override = listing.attrs?.campaign_overrides?.[ad.id] || {}
      const effectiveAd = {
        ...ad,
        headline: override.headline ?? ad.headline,
        body: override.body !== undefined ? override.body : ad.body,
        image_url:
          override.image_url !== undefined
            ? override.image_url
            : listing.attrs?.custom_campaign_image_url || ad.image_url,
        target_city:
          override.target_city !== undefined ? override.target_city : ad.target_city,
        target_category:
          override.target_category !== undefined
            ? override.target_category
            : ad.target_category,
      }

      const resolved = resolveAdOrderPlacement(effectiveAd)
      const placement = resolved.placement
      const seasonalMeta = extractSeasonalRunwayMeta(effectiveAd)

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
      if (
        isValidUserUploadedImage(effectiveAd.image_url) &&
        !mediaUrls.includes(effectiveAd.image_url)
      ) {
        mediaUrls.unshift(effectiveAd.image_url)
      }

      const limitedMedia = mediaUrls.slice(0, maxPhotos)
      const primaryImage = limitedMedia[0] || null

      items.push({
        id: `ad-${ad.id}`,
        listingId: listing.id,
        title: listing.title,
        headline: effectiveAd.headline || listing.title,
        description: effectiveAd.body || listing.description || '',
        imageUrl: primaryImage,
        allImages: limitedMedia,
        price: listing.price,
        priceUnit: listing.price_unit,
        type: listing.type || 'product',
        city:
          listing.city || effectiveAd.target_city || listing.seller?.city || null,
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
        attrs: {
          ...(listing.attrs || {}),
          ad_placement: placement,
          ...(seasonalMeta.specialRunwayId
            ? {
                special_runway_id: seasonalMeta.specialRunwayId,
                special_runway_title:
                  seasonalMeta.specialRunwayTitle || listing.attrs?.special_runway_title,
              }
            : {}),
        },
      })
    })

    // Prioridad 2: Publicaciones del catálogo (7 días iniciales con publicidad gratis + respaldo)
    if (adPageConfig.priorityMode !== 'only_paid_campaigns') {
      allPublishedListings.forEach((listing) => {
        if (seenListingIds.has(listing.id)) return
        if (listing.seller?.status === 'blocked' || listing.seller?.status === 'suspended') return

        const freeTrial = getListingFreeTrialStatus(listing)
        const isInFreePeriod = Boolean(
          freeTrial.isFreeTrialActive || (freeTrial as any).isInFreePeriod
        )

        if (
          adPageConfig.priorityMode === 'only_campaigns_and_free_trial' &&
          !isInFreePeriod
        ) {
          return
        }

        const currentSellerCount = sellerCounts.get(listing.seller_id) || 0
        if (currentSellerCount >= maxPerSeller) return
        sellerCounts.set(listing.seller_id, currentSellerCount + 1)

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

        const limitedMedia = mediaUrls.slice(0, maxPhotos)
        const primaryImage = limitedMedia[0] || null

        items.push({
          id: `listing-${listing.id}`,
          listingId: listing.id,
          title: listing.title,
          headline: listing.title,
          description: listing.description || '',
          imageUrl: primaryImage,
          allImages: limitedMedia,
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
          isPaidCampaign: isInFreePeriod,
          daysRemaining: isInFreePeriod ? freeTrial.daysRemaining : 7,
          campaignStatus: isInFreePeriod ? 'free_7days' : 'published',
          attrs: {
            ...(listing.attrs || {}),
            ad_placement: isInFreePeriod ? 'free_trial_7d' : 'organic',
          },
        })
      })
    }

    return items
  }, [campaignAds, allPublishedListings, adPageConfig])

  // Subconjuntos específicos para las pasarelas respetando los límites y el control independiente por pasarela
  const isItemEnabledInMedium = (
    item: ShowcaseItem,
    medium: 'vitrina' | 'pasarela' | 'proveedores'
  ): boolean => {
    const rawOrderId = item.id.startsWith('ad-') ? item.id.slice(3) : item.listingId
    let localOverrides: Record<string, any> = {}
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(INDEPENDENT_RUNWAY_OVERRIDES_KEY)
        if (raw) localOverrides = JSON.parse(raw)
      } catch {
        // Ignore
      }
    }
    const states = resolveIndependentRunwayStates(
      {
        id: rawOrderId,
        placement: (item.attrs?.ad_placement as any) || 'pasarela',
        attrs: item.attrs || null,
      },
      localOverrides
    )
    return states[medium].enabled
  }

  const isItemEnabledInCustomRunway = (item: ShowcaseItem, customRunwayId: string): boolean => {
    const rawOrderId = item.id.startsWith('ad-') ? item.id.slice(3) : item.listingId
    let localOverrides: Record<string, any> = {}
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(INDEPENDENT_RUNWAY_OVERRIDES_KEY)
        if (raw) localOverrides = JSON.parse(raw)
      } catch {
        // Ignore
      }
    }
    const states = resolveIndependentRunwayStates(
      {
        id: rawOrderId,
        placement: (item.attrs?.ad_placement as any) || 'pasarela',
        attrs: item.attrs || null,
      },
      localOverrides
    )
    const customState = states.customRunways?.[customRunwayId]
    if (customState !== undefined) {
      return customState.enabled && !customState.isExpired
    }
    return true
  }

  const heroItems = useMemo(() => {
    const limit = adPageConfig.maxHeroItems || 5
    const granVitrinaOrCombo = showcaseItems.filter(
      (i) =>
        isItemEnabledInMedium(i, 'vitrina') &&
        (i.attrs?.ad_placement === 'gran_vitrina' ||
          i.attrs?.ad_placement === 'combo' ||
          i.attrs?.ad_placement === 'free_trial_7d' ||
          i.attrs?.ad_placement === 'free_initial')
    )
    if (granVitrinaOrCombo.length >= limit) {
      return granVitrinaOrCombo.slice(0, limit)
    }
    const rest = showcaseItems.filter(
      (i) => !granVitrinaOrCombo.includes(i) && isItemEnabledInMedium(i, 'vitrina')
    )
    return [...granVitrinaOrCombo, ...rest].slice(0, limit)
  }, [showcaseItems, adPageConfig.maxHeroItems])

  const sortForRunway = (list: ShowcaseItem[]) => {
    const priorityOrder = (placement?: string) => {
      if (placement === 'combo' || placement === 'pasarela' || placement === 'pasarela_temporada') return 0
      if (placement === 'gran_vitrina') return 1
      if (placement === 'free_trial_7d' || placement === 'free_initial') return 2
      return 3
    }
    return list.slice().sort((a, b) => {
      const diff = priorityOrder(a.attrs?.ad_placement) - priorityOrder(b.attrs?.ad_placement)
      if (diff !== 0) return diff
      if (adPageConfig.prioritizeVerifiedSellers && a.sellerVerified !== b.sellerVerified) {
        return a.sellerVerified ? -1 : 1
      }
      return 0
    })
  }

  const serviceItems = useMemo(() => {
    return sortForRunway(
      showcaseItems.filter((i) => i.type === 'service' && isItemEnabledInMedium(i, 'pasarela'))
    ).slice(0, adPageConfig.maxServicesItems || 10)
  }, [showcaseItems, adPageConfig.maxServicesItems, adPageConfig.prioritizeVerifiedSellers])

  const articleItems = useMemo(() => {
    return sortForRunway(
      showcaseItems.filter((i) => i.type === 'article' && isItemEnabledInMedium(i, 'pasarela'))
    ).slice(0, adPageConfig.maxArticlesItems || 20)
  }, [showcaseItems, adPageConfig.maxArticlesItems, adPageConfig.prioritizeVerifiedSellers])

  const productItems = useMemo(() => {
    return sortForRunway(
      showcaseItems.filter((i) => i.type === 'product' && isItemEnabledInMedium(i, 'pasarela'))
    ).slice(0, adPageConfig.maxProductsItems || 20)
  }, [showcaseItems, adPageConfig.maxProductsItems, adPageConfig.prioritizeVerifiedSellers])

  // Comercios únicos para la Pasarela de Proveedores / Vendedores (Incluida en el pago y administrable independientemente)
  const merchantShowcases = useMemo(() => {
    const map = new Map<string, MerchantShowcase>()

    sortForRunway(showcaseItems).forEach((item) => {
      if (!isItemEnabledInMedium(item, 'proveedores')) return

      const placement = item.attrs?.ad_placement
      const isPromotedSeller =
        placement === 'pasarela' ||
        placement === 'pasarela_temporada' ||
        placement === 'combo' ||
        placement === 'gran_vitrina' ||
        placement === 'free_trial_7d' ||
        placement === 'free_initial'

      if (!map.has(item.sellerId)) {
        map.set(item.sellerId, {
          sellerId: item.sellerId,
          name: item.sellerName,
          city: item.city,
          verified: item.sellerVerified,
          rating: item.sellerRating,
          whatsapp: item.sellerWhatsapp,
          itemsCount: 1,
          sampleImages: [item.imageUrl].filter(Boolean) as string[],
          isPromoted: isPromotedSeller,
          // Etiqueta comercial pública (sin exponer tiempos de publicidad ni planes internos del vendedor)
          adBadge: item.sellerVerified
            ? '✓ Verificado'
            : item.isPaidCampaign
            ? '⭐ Destacado'
            : undefined,
        })
      } else {
        const m = map.get(item.sellerId)!
        m.itemsCount += 1
        if (isPromotedSeller && !m.isPromoted) {
          m.isPromoted = true
        }
        if (m.sampleImages.length < 3 && item.imageUrl && !m.sampleImages.includes(item.imageUrl)) {
          m.sampleImages.push(item.imageUrl)
        }
      }
    })

    return Array.from(map.values()).slice(0, adPageConfig.maxMerchantsItems || 10)
  }, [showcaseItems, adPageConfig.maxMerchantsItems, adPageConfig.prioritizeVerifiedSellers])

  const effectiveScrollSpeed =
    adPageConfig.runwayScrollSpeed && adPageConfig.runwayScrollSpeed > 0
      ? adPageConfig.runwayScrollSpeed
      : 0.65

  return (
    <main className="flex-1 bg-zinc-50/50 pb-20 dark:bg-zinc-950 overflow-hidden select-none">
      {/* Cintillo informativo opcional administrable desde /admin?section=adpage */}
      {adPageConfig.seasonalAnnouncementActive && adPageConfig.seasonalAnnouncementText && (
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 px-4 py-2.5 text-center text-xs font-bold text-white shadow-xs">
          {adPageConfig.seasonalAnnouncementText}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. PASARELA PRINCIPAL (GRAN VITRINA HERO RUNWAY - AISLADA)                */}
      {/* Su rotación automática no dispara re-renders en las demás pasarelas       */}
      {/* ========================================================================= */}
      {adPageConfig.showHeroRunway && (
        <HeroRunway
          heroItems={heroItems}
          locale={locale}
          t={t}
          autoRotate={adPageConfig.heroAutoRotate}
          rotationSeconds={adPageConfig.heroRotationSeconds}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. POSICIÓN EXCLUSIVA INMEDIATA DESPUÉS DE LA GRAN VITRINA DESTACADA:     */}
      {/*    PASARELAS DE CATÁLOGOS EXCLUSIVOS (CONSECUTIVAS: 1, 2, 3, ETC.)        */}
      {/* ========================================================================= */}
      {adPageConfig.customRunways &&
        adPageConfig.customRunways.filter((r) => r.active).length > 0 && (
          <div className="space-y-2">
            {/* Filtro rápido de Catálogos Exclusivos (visible para usuarios autenticados cuando hay más de una) */}
            {viewerRole !== 'guest' &&
              adPageConfig.customRunways.filter((r) => r.active).length > 1 && (
                <div className="w-full px-4 pt-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <span>⭐</span>
                        <span>
                          Posición Exclusiva Post-Gran Vitrina: Catálogos Exclusivos de Pasarela
                        </span>
                      </span>
                      {(viewerRole === 'seller' || viewerRole === 'admin') && (
                        <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full">
                          {viewerRole === 'admin'
                            ? '⚙️ Orden consecutivo administrable en Control Página Publicidad'
                            : '🏪 Habilitado según campaña activa'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedExclusiveRunwayId('all')}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          selectedExclusiveRunwayId === 'all'
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                            : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800'
                        }`}
                      >
                        <span>🌐</span>
                        <span>Todas las Pasarelas Exclusivas Consecutivas</span>
                      </button>
                      {adPageConfig.customRunways
                        .filter((r) => r.active && r.hasExclusiveCatalog !== false)
                        .map((cat, idx) => {
                          const isCurrent = selectedExclusiveRunwayId === cat.id
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setSelectedExclusiveRunwayId(cat.id)}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400'
                                  : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100/60 dark:bg-zinc-900 dark:text-amber-300 dark:border-amber-800'
                              }`}
                            >
                              <span>#{idx + 1}</span>
                              <span>{cat.icon}</span>
                              <span>{cat.title}</span>
                            </button>
                          )
                        })}
                    </div>
                  </div>
                </div>
              )}

            {adPageConfig.customRunways
              .filter((r) => {
                if (!r.active) return false
                if (r.endsAt && new Date(r.endsAt).getTime() <= Date.now()) return false
                return selectedExclusiveRunwayId === 'all' || r.id === selectedExclusiveRunwayId
              })
              .map((customRunway, idx) => {
                const rawMatched = showcaseItems.filter((item) => {
                  if (!isItemEnabledInCustomRunway(item, customRunway.id)) {
                    return false
                  }

                  const hasAuthorizedList =
                    Array.isArray(customRunway.authorizedSellerIds) &&
                    customRunway.authorizedSellerIds.length > 0
                  const isSellerAuthorized =
                    hasAuthorizedList &&
                    customRunway.authorizedSellerIds!.includes(item.sellerId)

                  if (
                    !item.isPaidCampaign &&
                    !isSellerAuthorized &&
                    customRunway.allowAllPaidSellers !== false
                  ) {
                    return false
                  }

                  if (
                    item.attrs?.special_runway_id === customRunway.id ||
                    customRunway.assignedListingIds?.includes(item.listingId)
                  ) {
                    return true
                  }
                  if (customRunway.filterType === 'service') return item.type === 'service'
                  if (customRunway.filterType === 'article') return item.type === 'article'
                  if (customRunway.filterType === 'product') return item.type === 'product'
                  if (customRunway.filterType === 'keyword' && customRunway.filterKeyword?.trim()) {
                    const kw = customRunway.filterKeyword.trim().toLowerCase()
                    return (
                      item.title.toLowerCase().includes(kw) ||
                      item.description.toLowerCase().includes(kw) ||
                      item.categoryName.toLowerCase().includes(kw)
                    )
                  }
                  return false
                })

                const matchedItems = sortForRunway(
                  rawMatched.length > 0
                    ? rawMatched
                    : customRunway.filterType === 'all'
                    ? showcaseItems
                    : []
                ).slice(0, customRunway.maxItems || 12)

                if (matchedItems.length === 0) return null

                return (
                  <ExclusiveCatalogRunwayTrack
                    key={customRunway.id}
                    customRunway={customRunway}
                    items={matchedItems}
                    exclusivePosition={idx + 1}
                    locale={locale}
                    scrollSpeed={effectiveScrollSpeed}
                  />
                )
              })}
          </div>
        )}

      {/* ========================================================================= */}
      {/* 3. PASARELA DE SERVICIOS Y SOLUCIONES (SERVICES RUNWAY - AISLADA)         */}
      {/* ========================================================================= */}
      {adPageConfig.showServicesRunway && (
        <ServicesRunway
          items={serviceItems}
          locale={locale}
          t={t}
          scrollSpeed={effectiveScrollSpeed}
        />
      )}

      {/* ========================================================================= */}
      {/* 4. PASARELA DE ARTÍCULOS USADOS (ARTICLES / PRE-OWNED RUNWAY - AISLADA)   */}
      {/* ========================================================================= */}
      {adPageConfig.showArticlesRunway && (
        <ArticlesRunway
          items={articleItems}
          locale={locale}
          t={t}
          scrollSpeed={effectiveScrollSpeed}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. PASARELA DE PRODUCTOS NUEVOS (NEW PRODUCTS RUNWAY - AISLADA)           */}
      {/* ========================================================================= */}
      {adPageConfig.showProductsRunway && (
        <ProductsRunway
          items={productItems}
          locale={locale}
          t={t}
          scrollSpeed={effectiveScrollSpeed}
        />
      )}

      {/* ========================================================================= */}
      {/* 6. PASARELA DE MARCAS Y COMERCIOS (MERCHANTS BRAND RUNWAY - AISLADA)      */}
      {/* ========================================================================= */}
      {adPageConfig.showMerchantsRunway && (
        <MerchantsRunway
          merchants={merchantShowcases}
          locale={locale}
          t={t}
          scrollSpeed={effectiveScrollSpeed}
        />
      )}

      {/* ========================================================================= */}
      {/* 7. PASARELA DE SOLICITUDES DE COMPRADORES (DEBAJO DE VENDEDORES)          */}
      {/* ========================================================================= */}
      <BuyerRequestsRunway
        requests={buyerRequests}
        locale={locale}
        scrollSpeed={effectiveScrollSpeed}
      />

      {/* ========================================================================= */}
      {/* 6. ACCESO RÁPIDO POR CATÁLOGOS: SERVICIOS, USADOS Y NUEVOS               */}
      {/* ========================================================================= */}
      {adPageConfig.showCatalogQuickCards && (
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
      )}

      {/* ========================================================================= */}
      {/* 7. BANNER INFORMATIVO DIFERENCIADO SEGÚN PERFIL (COMPRADOR VS VENDEDOR)   */}
      {/* ========================================================================= */}
      {adPageConfig.showPromotionalBanner && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {viewerRole === 'seller' || viewerRole === 'admin' ? (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 p-6 sm:p-10 text-white shadow-xl">
              <div className="relative z-10 max-w-2xl space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
                  <span>🚀</span>
                  <span>Exclusivo Vendedor • Campañas & Vitrina Comercial</span>
                </span>

                <h3 className="text-xl sm:text-3xl font-black tracking-tight">
                  {t.home.boostYourProductCta}
                </h3>

                <p className="text-xs sm:text-sm text-purple-100 leading-relaxed max-w-xl">
                  {t.home.boostYourProductDesc}
                </p>

                <div className="pt-2 flex items-center gap-2 text-xs text-purple-200">
                  <span className="font-semibold">💡 Gestión de vendedor:</span>
                  <span>
                    Administra el tiempo de publicidad y tus campañas patrocinadas desde{' '}
                    <strong className="text-white">Mis Campañas → Configurar Campaña</strong>.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 p-6 sm:p-10 text-white shadow-xl">
              <div className="relative z-10 max-w-2xl space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
                  <span>💬</span>
                  <span>Compra Directa sin Registro Obligatorio</span>
                </span>

                <h3 className="text-xl sm:text-3xl font-black tracking-tight">
                  {locale === 'en'
                    ? 'Contact Verified Local Businesses Directly on WhatsApp'
                    : 'Contacta directo por WhatsApp con comercios locales verificados'}
                </h3>

                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed max-w-xl">
                  {locale === 'en'
                    ? 'Explore products, used articles, and professional services freely without registration. Compare prices, check verified ratings, and chat directly with the seller.'
                    : 'Explora productos nuevos, artículos usados y servicios profesionales sin necesidad de registro previo. Consulta precios reales, reseñas verificadas y acuerda tu compra o servicio directamente con el comercio.'}
                </p>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
