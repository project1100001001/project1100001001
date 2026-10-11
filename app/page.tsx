// app/page.tsx
// Portada principal del Marketplace

import { createClient } from '@/lib/supabase/server'
import HomeClientView from '@/components/HomeClientView'
import type { Category, ListingWithRelations } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  // 1. Obtener categorías
  const { data: categoriesData } = await supabase
    .from('category')
    .select('*')
    .order('name', { ascending: true })

  const categories = (categoriesData as Category[]) || []

  // 2. Obtener anuncios destacados / recientes
  const { data: recentListingsData } = await supabase
    .from('listing')
    .select(`
      *,
      category:category_id(*),
      seller:seller_id(*),
      listing_media(*)
    `)
    .order('created_at', { ascending: false })
    .limit(8)

  const recentListings = (recentListingsData as ListingWithRelations[]) || []

  return (
    <HomeClientView
      categories={categories}
      recentListings={recentListings}
    />
  )
}
