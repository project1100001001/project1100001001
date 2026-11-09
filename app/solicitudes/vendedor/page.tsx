// app/solicitudes/vendedor/page.tsx
// Ventana Independiente del Vendedor: Aceptación de Servicios, Registro de Ventas y Seguimiento de Contratos Pactados

import React, { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import BuyerRequestsBoardClientView from '@/components/BuyerRequestsBoardClientView'
import AvantGardeLoader from '@/components/AvantGardeLoader'
import { decodeBuyerRequestsFromSlots } from '@/lib/buyerRequests'
import type { Category, Listing, Seller } from '@/lib/types'

export const metadata = {
  title: 'Ventana del Vendedor: Servicios Aceptados y Contratos Pactados | Indie Clasificados',
  description:
    'Ventana independiente para usuarios con perfil vendedor: acepta solicitudes de compradores, registra ventas de servicio y realiza el seguimiento de contratos pactados.',
}

export default async function SolicitudesVendedorPage() {
  const supabase = await createClient()

  let slotsData: any[] = []
  try {
    const { data: slots } = await supabase.from('ad_slot').select('*')
    if (slots) slotsData = slots
  } catch {
    // Fallback seguro
  }
  const initialRequests = decodeBuyerRequestsFromSlots(slotsData)

  const { data: categoriesData } = await supabase
    .from('category')
    .select('*')
    .order('name', { ascending: true })
  const categories = (categoriesData as Category[]) || []

  const { data: sellersData } = await supabase
    .from('seller')
    .select('*')
    .order('rating_avg', { ascending: false })
  const initialSellers = (sellersData as Seller[]) || []

  const { data: listingsData } = await supabase
    .from('listing')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(120)
  const initialListings = (listingsData as Listing[]) || []

  return (
    <Suspense
      fallback={
        <AvantGardeLoader
          title="Ventana Independiente del Vendedor"
          subtitle="Cargando contratos pactados, aceptación de servicios y registros de ventas de atención..."
        />
      }
    >
      <BuyerRequestsBoardClientView
        initialRequests={initialRequests}
        categories={categories}
        initialSellers={initialSellers}
        initialListings={initialListings}
        windowMode="seller_window"
      />
    </Suspense>
  )
}
