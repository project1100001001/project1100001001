// app/inventario/page.tsx
// Redirección consolidada al panel unificado de Mis Publicaciones & Inventario

import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function InventarioPage({ searchParams }: Props) {
  const sp = await searchParams
  const query = new URLSearchParams()
  for (const [key, val] of Object.entries(sp || {})) {
    if (typeof val === 'string') {
      query.set(key, val)
    } else if (Array.isArray(val)) {
      val.forEach((v) => query.append(key, v))
    }
  }
  const queryString = query.toString()
  redirect(queryString ? `/mis-publicaciones?${queryString}` : '/mis-publicaciones')
}
