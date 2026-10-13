// app/publicar/page.tsx
// Página de publicación para el vendedor

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ListingForm from '@/components/ListingForm'
import type { Category } from '@/lib/types'

export const metadata = {
  title: 'Publicar Producto o Servicio | Marketplace',
  description: 'Publica un nuevo artículo, producto o servicio en el catálogo del marketplace',
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PublicarPage({ searchParams }: PageProps) {
  const params = await searchParams
  const rawType = typeof params.type === 'string' ? params.type.trim() : ''
  const fixedType: 'product' | 'service' = rawType === 'service' ? 'service' : 'product'
  const initialCondition = rawType === 'article' ? 'Usado - Buen estado' : ''
  const editId = typeof params.edit_id === 'string' ? params.edit_id : typeof params.edit === 'string' ? params.edit : ''
  const inventoryId = typeof params.inventory_id === 'string' ? params.inventory_id : ''

  const supabase = await createClient()

  // Obtener categorías directamente desde la base de datos
  const { data: categories, error } = await supabase
    .from('category')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error cargando categorías:', error)
  }

  return (
    <main className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 pb-16">
      <Suspense
        fallback={
          <div className="flex justify-center items-center py-20 text-sm text-zinc-500">
            <span>Cargando formulario de publicación...</span>
          </div>
        }
      >
        <ListingForm
          categories={(categories as Category[]) || []}
          fixedType={fixedType}
          initialCondition={initialCondition}
          initialInventoryId={inventoryId}
          initialEditId={editId}
        />
      </Suspense>
    </main>
  )
}
