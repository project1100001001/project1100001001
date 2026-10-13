// app/mis-servicios/page.tsx
// Panel independiente de Gestión de Servicios Profesionales para vendedores y administradores

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Category, ListingWithRelations, Seller } from '@/lib/types'
import ServicesManager from '@/components/ServicesManager'

export const metadata = {
  title: 'Gestión de Servicios | Marketplace',
  description: 'Panel independiente para administrar tus servicios profesionales, modalidades de atención, plazos de respuesta y tarifas.',
}

export default async function MisServiciosPage() {
  const supabase = await createClient()

  // 1. Verificar usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/mis-servicios')
  }

  // 2. Verificar rol en app_user
  const { data: profile } = await supabase
    .from('app_user')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  // 3. Obtener negocio(s) del vendedor (o todos si es admin)
  let sellers: Seller[] = []
  if (isAdmin) {
    const { data: allSellers } = await supabase
      .from('seller')
      .select('*')
      .order('business_name', { ascending: true })
    sellers = (allSellers as Seller[]) || []
  } else {
    const { data: ownSellers } = await supabase
      .from('seller')
      .select('*')
      .eq('owner_user_id', user.id)
    sellers = (ownSellers as Seller[]) || []
  }

  if (sellers.length === 0 && !isAdmin) {
    return (
      <main className="flex-1 bg-zinc-50/50 py-16 px-4 dark:bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-5xl">🛠️</span>
          <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Cuenta de Comprador
          </h2>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Actualmente tu cuenta tiene rol de Comprador. Para publicar servicios, gestionar modalidades de atención y tarifas, activa tu perfil de vendedor o registra tu negocio.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/cuenta"
              className="rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-500 transition-colors"
            >
              👤 Ir a Mi Cuenta y Activar Perfil de Vendedor
            </Link>
            <Link
              href="/publicar?type=service"
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              ➕ Publicar servicio y registrar negocio
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const sellerIds = sellers.map((s) => s.id)

  // 4. Consultar listado de servicios exclusivamente (type === 'service')
  let listings: ListingWithRelations[] = []
  if (sellerIds.length > 0) {
    const { data: listingsData, error: listingsError } = await supabase
      .from('listing')
      .select(`
        *,
        category:category_id(*),
        seller:seller_id(*),
        listing_media(*)
      `)
      .in('seller_id', sellerIds)
      .eq('type', 'service')
      .order('created_at', { ascending: false })

    if (!listingsError && listingsData) {
      listings = listingsData as ListingWithRelations[]
    }
  }

  // 5. Consultar categorías aplicables a servicios
  const { data: categoriesData } = await supabase
    .from('category')
    .select('*')
    .in('applies_to', ['service', 'both'])
    .order('name', { ascending: true })

  const categories = (categoriesData as Category[]) || []

  return (
    <main className="flex-1 bg-zinc-50/50 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-20 text-sm text-zinc-500">
              <span>Cargando panel de gestión de servicios...</span>
            </div>
          }
        >
          <ServicesManager
            initialListings={listings}
            sellers={sellers}
            categories={categories}
          />
        </Suspense>
      </div>
    </main>
  )
}
