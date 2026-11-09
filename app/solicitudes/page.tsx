// app/solicitudes/page.tsx
// Módulo de Clasificados de Solicitudes (Demanda de Compradores: Servicios Prioritarios y Productos)

import React, { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import BuyerRequestsBoardClientView from '@/components/BuyerRequestsBoardClientView'
import AvantGardeLoader from '@/components/AvantGardeLoader'
import { decodeBuyerRequestsFromSlots } from '@/lib/buyerRequests'
import type { Category, Listing, Seller } from '@/lib/types'

export const metadata = {
  title: 'Clasificados de Solicitudes (Servicios y Productos) | Indie Clasificados',
  description:
    'Registra qué servicio o producto necesitas para que técnicos, profesionales y comercios verificados se postulen, realicen la atención y reciban tu calificación.',
}

export default async function SolicitudesPage() {
  const supabase = await createClient()

  // 1. Obtener slots para decodificar solicitudes registradas en servidor (o semillas por defecto)
  let slotsData: any[] = []
  try {
    const { data: slots } = await supabase.from('ad_slot').select('*')
    if (slots) slotsData = slots
  } catch {
    // Fallback seguro
  }
  const initialRequests = decodeBuyerRequestsFromSlots(slotsData)

  // 2. Obtener categorías
  const { data: categoriesData } = await supabase
    .from('category')
    .select('*')
    .order('name', { ascending: true })
  const categories = (categoriesData as Category[]) || []

  // 3. Obtener vendedores verificados y sus publicaciones activas para vincular postulaciones y calificaciones
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
          title="Clasificados de Solicitudes de Compradores"
          subtitle="Cargando requerimientos de servicios y productos, postulaciones de vendedores y sistema de calificación..."
        />
      }
    >
      <BuyerRequestsBoardClientView
        initialRequests={initialRequests}
        categories={categories}
        initialSellers={initialSellers}
        initialListings={initialListings}
      />
    </Suspense>
  )
}
