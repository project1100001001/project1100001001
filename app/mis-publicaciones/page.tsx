// app/mis-publicaciones/page.tsx
// Panel del vendedor para gestionar sus publicaciones

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ListingWithRelations } from '@/lib/types'
import MyListingsClientView from '@/components/MyListingsClientView'

export const metadata = {
  title: 'Mis Publicaciones | Marketplace',
  description: 'Gestiona tus productos, servicios y artículos publicados.',
}

export default async function MisPublicacionesPage() {
  const supabase = await createClient()

  // Verificar usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/mis-publicaciones')
  }

  // Obtener negocio(s) del vendedor autenticado
  const { data: sellers } = await supabase
    .from('seller')
    .select('*')
    .eq('owner_user_id', user.id)

  if (!sellers || sellers.length === 0) {
    return (
      <main className="flex-1 bg-zinc-50/50 py-16 px-4 dark:bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-5xl">🛒</span>
          <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Cuenta de Comprador
          </h2>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Actualmente tu cuenta tiene rol de Comprador. Para publicar anuncios y gestionar tus productos o servicios, activa tu perfil de vendedor o registra los datos de tu emprendimiento.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/cuenta"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              👤 Ir a Mi Cuenta y Activar Perfil de Vendedor
            </Link>
            <Link
              href="/publicar"
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              ➕ Publicar anuncio y registrar negocio
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const sellerIds = sellers.map((s) => s.id)

  let listings: ListingWithRelations[] = []
  if (sellerIds.length > 0) {
    const { data: listingsData, error } = await supabase
      .from('listing')
      .select(`
        *,
        category:category_id(*),
        seller:seller_id(*),
        listing_media(*)
      `)
      .in('seller_id', sellerIds)
      .order('created_at', { ascending: false })

    if (!error && listingsData) {
      listings = listingsData as ListingWithRelations[]
    }
  }

  return <MyListingsClientView listings={listings} />
}
