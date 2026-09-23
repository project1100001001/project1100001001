// app/mis-publicaciones/page.tsx
// Panel del vendedor para gestionar sus publicaciones

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ListingWithRelations } from '@/lib/types'

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

  // Obtener negocio(s) del vendedor
  const { data: sellers } = await supabase
    .from('seller')
    .select('*')
    .eq('owner_user_id', user.id)

  const sellerIds = (sellers || []).map((s) => s.id)

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

  const statusBadges: Record<string, { label: string; color: string }> = {
    draft: { label: 'Borrador', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
    submitted: { label: 'En revisión (moderación)', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    pending_review: { label: 'En revisión', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    published: { label: 'Publicado', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
    rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
    paused: { label: 'Pausado', color: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200' },
    archived: { label: 'Archivado', color: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200' },
  }

  return (
    <main className="flex-1 bg-zinc-50/50 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Mis Publicaciones
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Revisa el estado de tus anuncios, edita borradores o supervisa la aprobación.
            </p>
          </div>

          <Link
            href="/publicar"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors self-start sm:self-auto"
          >
            <span>+ Publicar nuevo anuncio</span>
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="my-12 rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-4xl">📝</span>
            <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Aún no tienes publicaciones
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
              Comienza creando tu primera publicación para dar a conocer tu catálogo en el marketplace.
            </p>
            <div className="mt-6">
              <Link
                href="/publicar"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Crear primera publicación
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 font-semibold">Anuncio</th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">Tipo</th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">Precio</th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">Estado</th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">Fecha</th>
                    <th scope="col" className="px-6 py-3.5 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {listings.map((l) => {
                    const badge = statusBadges[l.status] || {
                      label: l.status,
                      color: 'bg-zinc-100 text-zinc-700',
                    }
                    const primaryMedia = l.listing_media?.sort((a, b) => a.position - b.position)[0]

                    return (
                      <tr key={l.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                              {primaryMedia ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={primaryMedia.url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-lg">
                                  📦
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold">{l.title}</div>
                              <div className="text-xs text-zinc-500">{l.category?.name || 'Categoría'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 capitalize">{l.type}</td>
                        <td className="px-6 py-4">
                          {l.price !== null
                            ? `$ ${l.price.toLocaleString('es-CO')} ${l.price_unit ? `/${l.price_unit}` : ''}`
                            : 'Cotización'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {new Date(l.created_at).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/catalogo/${l.id}`}
                            className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                          >
                            Ver anuncio →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
