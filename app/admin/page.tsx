// app/admin/page.tsx
// Panel de control y moderación de publicaciones para administradores

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminModerationPanel from '@/components/AdminModerationPanel'
import type { ListingWithRelations } from '@/lib/types'

export const metadata = {
  title: 'Panel de Moderación | Admin Marketplace',
  description: 'Panel administrativo para revisar y aprobar publicaciones del catálogo.',
}

export default async function AdminPage() {
  const supabase = await createClient()

  // 1. Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/admin')
  }

  // 2. Verificar rol en app_user
  const { data: profile } = await supabase
    .from('app_user')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    return (
      <main className="flex-1 bg-zinc-50/50 py-16 px-4 dark:bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-5xl">🚫</span>
          <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Acceso Restringido a Administradores
          </h2>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Esta sección está reservada exclusivamente para moderadores y administradores del marketplace.
          </p>
          <div className="mt-4 rounded-xl bg-zinc-100 p-3 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Usuario actual: <strong>{user.email}</strong>
            <br />
            Rol asignado: <strong>{profile?.role || 'buyer'}</strong>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/login?redirectTo=/admin"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              Iniciar sesión con cuenta de Administrador
            </Link>
            <Link
              href="/catalogo"
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Volver al Catálogo
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // 3. Como admin, la política RLS "listing_admin_all" permite obtener todos los listings
  const { data: listingsData, error } = await supabase
    .from('listing')
    .select(`
      *,
      category:category_id(*),
      seller:seller_id(*),
      listing_media(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error cargando cola de moderación:', error.message)
  }

  return (
    <main className="flex-1 bg-zinc-50/50 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AdminModerationPanel initialListings={(listingsData as ListingWithRelations[]) || []} />
      </div>
    </main>
  )
}
