// app/page.tsx
// Portada principal del Marketplace - Pasarelas de Presentación de Campañas y Publicaciones

import { createClient } from '@/lib/supabase/server'
import HomeClientView from '@/components/HomeClientView'
import type { Category, ListingWithRelations } from '@/lib/types'
import { decodeAdPageConfigFromSlots } from '@/lib/adPageConfig'

export default async function HomePage() {
  const supabase = await createClient()

  // 0. Obtener configuración administrativa de la página de publicidad desde ad_slot
  let adSlotsData: any[] = []
  try {
    const { data: slots } = await supabase.from('ad_slot').select('*')
    if (slots) {
      adSlotsData = slots
    }
  } catch {
    // Usar valores por defecto si ad_slot aún no está disponible
  }
  const adPageConfig = decodeAdPageConfigFromSlots(adSlotsData)

  // 1. Obtener categorías
  const { data: categoriesData } = await supabase
    .from('category')
    .select('*')
    .order('name', { ascending: true })

  const categories = (categoriesData as Category[]) || []

  // 2. Obtener órdenes publicitarias (campañas activas / pagadas)
  let campaignAdsData: any[] = []
  try {
    const { data: ads, error: adsError } = await supabase
      .from('ad_order')
      .select(`
        *,
        package:package_id(*),
        listing:listing_id(
          *,
          category:category_id(*),
          seller:seller_id(*),
          listing_media(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (!adsError && ads) {
      campaignAdsData = ads
    }
  } catch (err: any) {
    console.warn('Aviso cargando campañas activas en portada:', err?.message || err)
  }

  // 3. Obtener las publicaciones activas del catálogo respetando el límite administrativo configurado
  let publishedListingsData: any[] = []
  try {
    const { data: listings, error: listingsError } = await supabase
      .from('listing')
      .select(`
        *,
        category:category_id(*),
        seller:seller_id(*),
        listing_media(*)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(adPageConfig.maxTotalListingsFetched)

    if (!listingsError && listings) {
      publishedListingsData = listings
    }
  } catch (err: any) {
    console.warn('Aviso cargando publicaciones para la pasarela:', err?.message || err)
  }

  const allPublishedListings = (publishedListingsData as ListingWithRelations[]) || []

  return (
    <HomeClientView
      categories={categories}
      campaignAds={campaignAdsData}
      allPublishedListings={allPublishedListings}
      initialAdPageConfig={adPageConfig}
    />
  )
}
