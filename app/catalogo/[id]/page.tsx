// app/catalogo/[id]/page.tsx
// Detalle de una publicación en el marketplace

import { createClient } from '@/lib/supabase/server'
import ListingDetailView from '@/components/ListingDetailView'
import type { ListingWithRelations } from '@/lib/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listing')
    .select('title, description')
    .eq('id', id)
    .single()

  if (!listing) {
    return {
      title: 'Publicación no encontrada | Marketplace',
    }
  }

  return {
    title: `${listing.title} | Marketplace`,
    description: listing.description || 'Detalles de la publicación en el Marketplace',
  }
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing, error } = await supabase
    .from('listing')
    .select(`
      *,
      category:category_id(*),
      seller:seller_id(*),
      listing_media(*)
    `)
    .eq('id', id)
    .single()

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-xl py-24 px-4 text-center">
        <span className="text-5xl">📦</span>
        <h2 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Publicación no encontrada
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          El anuncio que buscas no existe o aún no ha sido aprobado por el equipo de moderación.
        </p>
        <div className="mt-6">
          <Link
            href="/catalogo"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 bg-zinc-50/50 pb-16 dark:bg-zinc-950">
      <ListingDetailView listing={listing as ListingWithRelations} />
    </main>
  )
}
