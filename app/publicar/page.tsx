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

export default async function PublicarPage() {
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
            <span>Cargando formulario y sincronizando inventario...</span>
          </div>
        }
      >
        <ListingForm categories={(categories as Category[]) || []} />
      </Suspense>
    </main>
  )
}
