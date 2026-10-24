// app/promocionar/page.tsx
// Vista para crear una orden publicitaria (ad_order) para un listing publicado

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PromotionForm from '@/components/PromotionForm'
import type { AdPackage, Listing, Seller, Advertiser, AdAccount } from '@/lib/types'

export const metadata = {
  title: 'Promocionar Publicación | Indie Clasificados',
  description: 'Crea una campaña publicitaria para destacar tu producto o servicio.',
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

import { OFFICIAL_AD_PLANS, normalizeToOfficialPackages } from '@/lib/adPolicies'

const DEFAULT_PACKAGES: AdPackage[] = OFFICIAL_AD_PLANS

export default async function PromocionarPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const listingIdParam = typeof resolvedSearchParams.listing_id === 'string'
    ? resolvedSearchParams.listing_id
    : undefined
  const tabParam = resolvedSearchParams.tab === 'campaign' || resolvedSearchParams.tab === 'recharge'
    ? (resolvedSearchParams.tab as 'recharge' | 'campaign')
    : undefined

  const supabase = await createClient()

  // 1. Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirectTo=/promocionar${listingIdParam ? `?listing_id=${listingIdParam}` : ''}`)
  }

  // 2. Verificar perfil de vendedor autenticado
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
            Para crear anuncios publicitarios necesitas tener configurado tu perfil de vendedor o negocio.
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

  // 3. Obtener publicaciones publicadas del vendedor
  const { data: publishedListings, error: listingsErr } = await supabase
    .from('listing')
    .select(`
      *,
      category:category_id(*),
      listing_media(*)
    `)
    .in('seller_id', sellerIds)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (listingsErr) {
    console.error('Error cargando listings publicados:', listingsErr.message)
  }

  if (!publishedListings || publishedListings.length === 0) {
    return (
      <main className="flex-1 bg-zinc-50/50 py-16 px-4 dark:bg-zinc-950 flex items-center justify-center">
        <div className="max-w-lg w-full rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-5xl">📢</span>
          <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            No tienes publicaciones aprobadas para promocionar
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Solo puedes crear campañas publicitarias para productos o servicios que ya hayan sido revisados y <strong>aprobados (publicados)</strong> en el catálogo.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/publicar"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              + Publicar Producto/Servicio
            </Link>
            <Link
              href="/mis-publicaciones"
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Ver mis publicaciones
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Identificar el vendedor correspondiente al listing preseleccionado o el primero
  const targetListing = publishedListings.find((l) => l.id === listingIdParam)
  const activeSeller =
    sellers.find((s) => s.id === targetListing?.seller_id) || sellers[0]

  // 4. Obtener advertiser y ad_account si existen
  const { data: advertisers } = await supabase
    .from('advertiser')
    .select('*')
    .eq('seller_id', activeSeller.id)
    .order('created_at', { ascending: false })

  const advertiser = advertisers && advertisers.length > 0 ? (advertisers[0] as Advertiser) : null

  let adAccount: AdAccount | null = null
  if (advertiser) {
    const { data: accs } = await supabase
      .from('ad_account')
      .select('*')
      .eq('advertiser_id', advertiser.id)
      .order('balance', { ascending: false })

    adAccount = (accs && accs.length > 0 ? (accs[0] as AdAccount) : null)
  }

  // 5. Obtener paquetes publicitarios activos
  let packages: AdPackage[] = []
  try {
    const { data: dbPackages, error: pkgErr } = await supabase
      .from('ad_package')
      .select('*')
      .eq('active', true)
      .order('price', { ascending: true })

    if (!pkgErr && dbPackages && dbPackages.length > 0) {
      packages = normalizeToOfficialPackages(dbPackages as AdPackage[])
    } else {
      packages = DEFAULT_PACKAGES
    }
  } catch {
    packages = DEFAULT_PACKAGES
  }

  // 6. Obtener solicitudes de recarga previas del vendedor
  let initialRechargeRequests: any[] = []
  try {
    const { data: reqs, error: reqsErr } = await supabase
      .from('ad_recharge_request')
      .select(`
        *,
        package:package_id(*)
      `)
      .in('seller_id', sellerIds)
      .order('created_at', { ascending: false })
    if (!reqsErr && reqs) {
      initialRechargeRequests = reqs
    }
  } catch (err: any) {
    console.warn('Aviso en consulta de ad_recharge_request:', err?.message || err)
  }

  return (
    <main className="flex-1 bg-zinc-50/50 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {tabParam === 'campaign' ? 'Configurar Campaña' : 'Recarga de Saldo'}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {tabParam === 'campaign'
              ? 'Personaliza y activa tu anuncio publicitario patrocinado con tu saldo disponible.'
              : 'Adquiere saldo publicitario mediante transferencia y comprobante de pago.'}
          </p>
        </div>

        <PromotionForm
          userId={user.id}
          seller={activeSeller as Seller}
          initialAdvertiser={(advertiser as Advertiser) || null}
          initialAdAccount={adAccount}
          initialRechargeRequests={initialRechargeRequests}
          publishedListings={publishedListings as Listing[]}
          preselectedListingId={listingIdParam}
          packages={packages}
          initialTab={tabParam}
        />
      </div>
    </main>
  )
}
