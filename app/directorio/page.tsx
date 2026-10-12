// app/directorio/page.tsx
// Directorio de Vendedores y Comercios para Compradores

import { createClient } from '@/lib/supabase/server'
import SellersDirectoryClientView, {
  type SellerWithListings,
} from '@/components/SellersDirectoryClientView'

export const metadata = {
  title: 'Directorio de Vendedores y Comercios | Marketplace',
  description:
    'Encuentra información de contacto directo, WhatsApp y catálogo de vendedores y emprendedores registrados.',
}

interface DirectorioPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DirectorioPage({ searchParams }: DirectorioPageProps) {
  const resolvedParams = searchParams ? await searchParams : {}
  const initialFilter = typeof resolvedParams.filter === 'string' ? resolvedParams.filter : ''
  const initialCity = typeof resolvedParams.city === 'string' ? resolvedParams.city : ''
  const initialQuery = typeof resolvedParams.q === 'string' ? resolvedParams.q : ''

  const supabase = await createClient()

  // 1. Obtener vendedores registrados en el sistema
  let sellersData: any[] = []
  try {
    const { data: sellers, error: sellersError } = await supabase
      .from('seller')
      .select('*')
      .order('verified', { ascending: false })
      .order('business_name', { ascending: true })

    if (sellersError) {
      console.warn('Aviso consultando seller en Directorio:', sellersError.message)
    } else if (sellers) {
      sellersData = sellers
    }
  } catch (err: any) {
    console.warn('Error cargando vendedores en Directorio:', err?.message || err)
  }

  // 2. Obtener publicaciones activas para enriquecer los datos de cada vendedor
  let listingsData: any[] = []
  try {
    const { data: listings, error: listingsError } = await supabase
      .from('listing')
      .select(`
        id,
        seller_id,
        title,
        type,
        price,
        price_unit,
        status,
        listing_media(url)
      `)
      .eq('status', 'published')

    if (listingsError) {
      console.warn('Aviso consultando listings en Directorio:', listingsError.message)
    } else if (listings) {
      listingsData = listings
    }
  } catch (err: any) {
    console.warn('Error cargando listings en Directorio:', err?.message || err)
  }

  // 3. Vincular publicaciones a cada vendedor
  const sellersWithListings: SellerWithListings[] = sellersData.map((seller) => {
    const sellerListings = listingsData.filter((l) => l.seller_id === seller.id)
    return {
      ...seller,
      listings: sellerListings,
      listingsCount: sellerListings.length,
    }
  })

  return (
    <main className="flex-1 bg-zinc-50/50 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SellersDirectoryClientView
          initialSellers={sellersWithListings}
          initialFilter={initialFilter}
          initialCity={initialCity}
          initialQuery={initialQuery}
        />
      </div>
    </main>
  )
}
