// app/mis-campanas/page.tsx
// Historial de campañas publicitarias (ad_order) del vendedor

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CampaignsList from '@/components/CampaignsList'
import type { AdOrderWithRelations } from '@/lib/types'

export const metadata = {
  title: 'Mis Campañas Publicitarias | Marketplace',
  description: 'Historial y estado de tus campañas publicitarias y promociones.',
}

export default async function MisCampanasPage() {
  const supabase = await createClient()

  // 1. Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/mis-campanas')
  }

  // 2. Verificar perfil(es) de vendedor autenticado
  const { data: sellers } = await supabase
    .from('seller')
    .select('*')
    .eq('owner_user_id', user.id)

  if (!sellers || sellers.length === 0) {
    return (
      <main className="flex-1 bg-zinc-50/50 py-16 px-4 dark:bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-5xl">🏪</span>
          <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Perfil de Vendedor Requerido
          </h2>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Para gestionar tus campañas publicitarias necesitas tener configurado tu perfil de vendedor o negocio.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/cuenta"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              👤 Activar Perfil de Vendedor en Mi Cuenta
            </Link>
            <Link
              href="/publicar"
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              ➕ Publicar Producto o Servicio
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const sellerIds = sellers.map((s) => s.id)

  // 3. Obtener advertiser(s) y ad_account(s)
  const { data: advertisers } = await supabase
    .from('advertiser')
    .select('*')
    .in('seller_id', sellerIds)

  let balance = 0
  let orders: AdOrderWithRelations[] = []
  const advertiserIds = (advertisers || []).map((a) => a.id)

  if (advertiserIds.length > 0) {
    const { data: adAccounts } = await supabase
      .from('ad_account')
      .select('*')
      .in('advertiser_id', advertiserIds)

    if (adAccounts && adAccounts.length > 0) {
      balance = adAccounts.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0)
      const adAccountIds = adAccounts.map((a) => a.id)

      // 4. Obtener ad_orders del anunciante
      const { data: adOrders, error: ordersErr } = await supabase
        .from('ad_order')
        .select(`
          *,
          package:package_id(*),
          listing:listing_id(*)
        `)
        .in('ad_account_id', adAccountIds)
        .order('created_at', { ascending: false })

      if (ordersErr) {
        console.warn('Aviso cargando ad_orders:', ordersErr.message)
      } else if (adOrders) {
        orders = adOrders as AdOrderWithRelations[]
      }
    }
  }

  return (
    <main className="flex-1 bg-zinc-50/50 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Mis Campañas Publicitarias
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Historial de anuncios patrocinados, estado de aprobación e inversión.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <Link
              href="/mis-publicaciones"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition-colors"
            >
              ← Volver a Mis Publicaciones
            </Link>
            <Link
              href="/promocionar"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-500 transition-colors"
            >
              <span>🚀</span>
              <span>+ Nueva Campaña</span>
            </Link>
          </div>
        </div>

        <CampaignsList
          initialOrders={orders}
          balance={balance}
          advertiserName={advertisers?.[0]?.legal_name || sellers[0].business_name}
        />
      </div>
    </main>
  )
}
