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

interface AdminPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedParams = searchParams ? await searchParams : {}
  const rawSection = resolvedParams.section || resolvedParams.tab
  const defaultSection =
    rawSection === 'users' || rawSection === 'ads' || rawSection === 'balances' || rawSection === 'listings'
      ? (rawSection as 'listings' | 'ads' | 'balances' | 'users')
      : 'listings'

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

  // 3. Como admin, obtener listings para moderar
  const { data: listingsData, error: listingsError } = await supabase
    .from('listing')
    .select(`
      *,
      category:category_id(*),
      seller:seller_id(*),
      listing_media(*)
    `)
    .order('created_at', { ascending: false })

  if (listingsError) {
    console.error('Error cargando cola de moderación de listings:', listingsError.message)
  }

  // 4. Como admin, obtener órdenes publicitarias (ad_order) para moderar
  let adOrdersData: any[] = []
  try {
    const { data: ads, error: adsError } = await supabase
      .from('ad_order')
      .select(`
        *,
        package:package_id(*),
        listing:listing_id(*)
      `)
      .order('created_at', { ascending: false })

    if (adsError) {
      console.warn('Aviso: public.ad_order pendiente de schema cache en PostgREST:', adsError.message)
    } else if (ads) {
      adOrdersData = ads
    }
  } catch (err: any) {
    console.warn('Aviso en consulta de ad_orders:', err?.message || err)
  }

  // 5. Cuentas publicitarias y balances prepago (deduplicadas por vendedor)
  let adAccountsData: any[] = []
  try {
    const { data: accounts, error: accError } = await supabase
      .from('ad_account')
      .select(`
        *,
        advertiser:advertiser_id (
          *,
          seller:seller_id (*)
        )
      `)
      .order('balance', { ascending: false })

    if (accError) {
      console.warn('Aviso: public.ad_account en PostgREST:', accError.message)
    } else if (accounts) {
      // Deduplicar por vendedor para mostrar una sola cuenta y evitar confusión
      const seenSellers = new Set<string>()
      const uniqueAccounts: any[] = []
      for (const acc of accounts) {
        const sId = acc.advertiser?.seller_id || acc.id
        if (!seenSellers.has(sId)) {
          seenSellers.add(sId)
          uniqueAccounts.push(acc)
        }
      }
      adAccountsData = uniqueAccounts
    }
  } catch (err: any) {
    console.warn('Aviso en consulta de ad_account:', err?.message || err)
  }

  // 6. Lista de vendedores registrados (un solo vendedor para pruebas)
  let sellersData: any[] = []
  try {
    const { data: sellers, error: sellersError } = await supabase
      .from('seller')
      .select('*')
      .order('business_name', { ascending: true })

    if (sellersError) {
      console.warn('Aviso: public.seller en PostgREST:', sellersError.message)
    } else if (sellers && sellers.length > 0) {
      // Dejar un solo vendedor principal para evitar confusiones durante pruebas
      const mainSeller =
        sellers.find((s) => s.business_name?.toLowerCase().includes('panadería')) ||
        sellers[0]
      sellersData = mainSeller ? [mainSeller] : sellers
    }
  } catch (err: any) {
    console.warn('Aviso en consulta de seller:', err?.message || err)
  }

  // 7. Transacciones recientes de billetera (recargas, cobros, reembolsos)
  let recentTransactionsData: any[] = []
  try {
    const { data: txs, error: txsError } = await supabase
      .from('wallet_transaction')
      .select(`
        *,
        ad_account:ad_account_id (
          *,
          advertiser:advertiser_id (
            *,
            seller:seller_id (*)
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(60)

    if (txsError) {
      console.warn('Aviso: public.wallet_transaction en PostgREST:', txsError.message)
    } else if (txs) {
      recentTransactionsData = txs
    }
  } catch (err: any) {
    console.warn('Aviso en consulta de wallet_transaction:', err?.message || err)
  }

  // 8. Solicitudes de recarga de paquetes de anunciantes
  let rechargeRequestsData: any[] = []
  try {
    const { data: reqs, error: reqsError } = await supabase
      .from('ad_recharge_request')
      .select(`
        *,
        package:package_id(*),
        seller:seller_id(*),
        ad_account:ad_account_id(*)
      `)
      .order('created_at', { ascending: false })

    if (reqsError) {
      console.warn('Aviso: public.ad_recharge_request en PostgREST:', reqsError.message)
    } else if (reqs) {
      rechargeRequestsData = reqs
    }
  } catch (err: any) {
    console.warn('Aviso en consulta de ad_recharge_request:', err?.message || err)
  }

  // 9. Usuarios registrados para administración de roles y permisos
  let usersData: any[] = []
  try {
    const { data: users, error: usersError } = await supabase
      .from('app_user')
      .select(`
        *,
        seller:seller(*)
      `)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.warn('Aviso: public.app_user con seller en PostgREST:', usersError.message)
      const { data: simpleUsers, error: simpleErr } = await supabase
        .from('app_user')
        .select('*')
        .order('created_at', { ascending: false })
      if (!simpleErr && simpleUsers) {
        usersData = simpleUsers
      }
    } else if (users) {
      usersData = users
    }
  } catch (err: any) {
    console.warn('Aviso en consulta de app_user:', err?.message || err)
  }

  return (
    <main className="flex-1 bg-zinc-50/50 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AdminModerationPanel
          initialListings={(listingsData as ListingWithRelations[]) || []}
          initialAdOrders={(adOrdersData as any[]) || []}
          initialAdAccounts={adAccountsData}
          initialSellers={sellersData}
          initialTransactions={recentTransactionsData}
          initialRechargeRequests={rechargeRequestsData}
          initialUsers={usersData}
          defaultSection={defaultSection}
        />
      </div>
    </main>
  )
}
