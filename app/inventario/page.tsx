// app/inventario/page.tsx
// Panel de administración de inventario y ventas para vendedores y administradores

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ListingWithRelations, Sale, Seller } from '@/lib/types'
import InventoryManager from '@/components/InventoryManager'

export const metadata = {
  title: 'Control de Inventario & Ventas | Marketplace',
  description: 'Gestiona el stock de productos, tiempos de servicio y visualiza las ventas realizadas por tu negocio.',
}

export default async function InventarioPage() {
  const supabase = await createClient()

  // 1. Verificar sesión de usuario
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/inventario')
  }

  // 2. Verificar rol en app_user
  const { data: profile } = await supabase
    .from('app_user')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  // 3. Obtener negocio(s) del usuario (o todos si es admin)
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

  // Si el usuario es comprador y no tiene negocio creado
  if (sellers.length === 0 && !isAdmin) {
    return (
      <main className="flex-1 bg-zinc-50/50 py-16 px-4 dark:bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-5xl">📦</span>
          <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Control de Inventario para Vendedores
          </h2>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Tu cuenta actualmente no tiene un perfil comercial activo. Para administrar stock, tiempos de servicio y registrar ventas, activa tu perfil de vendedor en tu cuenta.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/cuenta"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
            >
              👤 Ir a Mi Cuenta y Activar Negocio
            </Link>
            <Link
              href="/publicar"
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              ➕ Publicar tu primer artículo
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const sellerIds = sellers.map((s) => s.id)

  // 4. Consultar listado de artículos (productos y servicios)
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
      .order('created_at', { ascending: false })

    if (!listingsError && listingsData) {
      listings = listingsData as ListingWithRelations[]
    }
  }

  // 5. Consultar ventas y pedidos realizados
  let sales: Sale[] = []
  if (sellerIds.length > 0) {
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sale')
        .select(`
          *,
          listing:listing_id (
            *,
            listing_media(*),
            category:category_id(*)
          )
        `)
        .in('seller_id', sellerIds)
        .order('created_at', { ascending: false })

      if (salesError) {
        console.warn('Aviso: public.sale pendiente de ejecución de migración SQL:', salesError.message)
      } else if (salesData) {
        sales = salesData as Sale[]
      }
    } catch (err: any) {
      console.warn('Aviso en consulta de sales:', err?.message || err)
    }
  }

  return (
    <main className="flex-1 bg-zinc-50/50 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <InventoryManager
          initialListings={listings}
          initialSales={sales}
          sellers={sellers}
        />
      </div>
    </main>
  )
}
