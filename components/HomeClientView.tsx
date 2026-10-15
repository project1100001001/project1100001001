// components/HomeClientView.tsx
'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import type { Category, ListingWithRelations } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'
import HeroRunway, { type ShowcaseItem } from '@/components/HeroRunway'
import ServicesRunway from '@/components/ServicesRunway'
import ArticlesRunway from '@/components/ArticlesRunway'
import ProductsRunway from '@/components/ProductsRunway'
import MerchantsRunway, { type MerchantShowcase } from '@/components/MerchantsRunway'

interface HomeClientViewProps {
  categories: Category[]
  campaignAds: any[]
  allPublishedListings: ListingWithRelations[]
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
    return showcaseItems.filter((i) => i.type === 'service').slice(0, 10)
  }, [showcaseItems])

  const articleItems = useMemo(() => {
    return showcaseItems.filter((i) => i.type === 'article').slice(0, 20)
  }, [showcaseItems])

  const productItems = useMemo(() => {
    return showcaseItems.filter((i) => i.type === 'product').slice(0, 20)
  }, [showcaseItems])

  // Comercios únicos para la pasarela de marcas (exactamente 10 comerciantes)
  const merchantShowcases = useMemo(() => {
    const map = new Map<string, MerchantShowcase>()

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
          sampleImages: [item.imageUrl].filter(Boolean) as string[],
        })
      } else {
        const m = map.get(item.sellerId)!
        m.itemsCount += 1
        if (m.sampleImages.length < 3 && item.imageUrl && !m.sampleImages.includes(item.imageUrl)) {
          m.sampleImages.push(item.imageUrl)
        }
      }
    })

    return Array.from(map.values()).slice(0, 10)
  }, [showcaseItems])

  return (
    <main className="flex-1 bg-zinc-50/50 pb-20 dark:bg-zinc-950 overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* 1. PASARELA PRINCIPAL (GRAN VITRINA HERO RUNWAY - AISLADA)                */}
      {/* Su rotación automática no dispara re-renders en las demás pasarelas       */}
      {/* ========================================================================= */}
      <HeroRunway heroItems={heroItems} locale={locale} t={t} />

      {/* ========================================================================= */}
      {/* 2. PASARELA DE SERVICIOS Y SOLUCIONES (SERVICES RUNWAY - AISLADA)         */}
      {/* ========================================================================= */}
      <ServicesRunway items={serviceItems} locale={locale} t={t} />

      {/* ========================================================================= */}
      {/* 3. PASARELA DE ARTÍCULOS USADOS (ARTICLES / PRE-OWNED RUNWAY - AISLADA)   */}
      {/* ========================================================================= */}
      <ArticlesRunway items={articleItems} locale={locale} t={t} />

      {/* ========================================================================= */}
      {/* 4. PASARELA DE PRODUCTOS NUEVOS (NEW PRODUCTS RUNWAY - AISLADA)           */}
      {/* ========================================================================= */}
      <ProductsRunway items={productItems} locale={locale} t={t} />

      {/* ========================================================================= */}
      {/* 5. PASARELA DE MARCAS Y COMERCIOS (MERCHANTS BRAND RUNWAY - AISLADA)      */}
      {/* ========================================================================= */}
      <MerchantsRunway merchants={merchantShowcases} locale={locale} t={t} />

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
