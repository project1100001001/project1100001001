// app/solicitudes/comprador/page.tsx
// Ventana Independiente del Comprador: Registro de Solicitudes y Seguimiento de Contratos Pactados

import React, { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import BuyerRequestsBoardClientView from '@/components/BuyerRequestsBoardClientView'
import AvantGardeLoader from '@/components/AvantGardeLoader'
import { decodeBuyerRequestsFromSlots } from '@/lib/buyerRequests'
import type { Category, Listing, Seller } from '@/lib/types'

export const metadata = {
  title: 'Ventana del Comprador: Mis Solicitudes y Contratos Pactados | Indie Clasificados',
  description:
    'Ventana independiente para usuarios con perfil comprador: registra solicitudes, acepta condiciones y realiza el seguimiento de tus contratos pactados.',
}

export default async function SolicitudesCompradorPage() {
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
          title="Ventana Independiente del Comprador"
          subtitle="Cargando tus solicitudes registradas, aceptación de condiciones y seguimiento de contratos pactados..."
        />
      }
    >
      <BuyerRequestsBoardClientView
        initialRequests={initialRequests}
        categories={categories}
        initialSellers={initialSellers}
        initialListings={initialListings}
        windowMode="buyer_window"
      />
    </Suspense>
  )
}
