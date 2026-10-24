// app/cuenta/page.tsx
// Visualización y edición de datos de la cuenta y perfil comercial

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AppUser, Seller, AdAccount, Advertiser, Sale } from '@/lib/types'
import AccountProfileView from '@/components/AccountProfileView'

export const metadata = {
  title: 'Mi Cuenta y Perfil | Indie Clasificados',
  description: 'Visualiza y actualiza la información de tu cuenta personal y datos comerciales.',
}

export default async function CuentaPage() {
  const supabase = await createClient()

  // 1. Verificar sesión de usuario
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/cuenta')
  }

  // 2. Obtener datos de public.app_user
  const { data: profileData } = await supabase
    .from('app_user')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = (profileData as AppUser) || null

  // 3. Obtener datos de public.seller (si es vendedor)
  const { data: sellerData } = await supabase
    .from('seller')
    .select('*')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const seller = (sellerData && sellerData.length > 0 ? (sellerData[0] as Seller) : null)

  // 4. Si tiene seller, obtener cuenta publicitaria (ad_account)
  let adAccount: AdAccount | null = null
  if (seller) {
    const { data: advData } = await supabase
      .from('advertiser')
      .select('id')
      .eq('seller_id', seller.id)
      .limit(1)

    if (advData && advData.length > 0) {
      const { data: accData } = await supabase
        .from('ad_account')
        .select('*')
        .eq('advertiser_id', advData[0].id)
        .limit(1)

      if (accData && accData.length > 0) {
        adAccount = accData[0] as AdAccount
      }
    }
  }

  // 5. Obtener compras realizadas por el usuario comprador (public.sale)
  let purchases: Sale[] = []
  try {
    const { data: salesData } = await supabase
      .from('sale')
      .select(`
        *,
        listing:listing_id (
          *,
          listing_media(*),
          category:category_id(*),
          seller:seller_id(*)
        )
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })

    if (salesData) {
      purchases = salesData as Sale[]
    }
  } catch (err: any) {
    console.warn('Aviso consultando purchases:', err?.message || err)
  }

  return (
    <AccountProfileView
      user={{
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
      }}
      initialProfile={profile}
      initialSeller={seller}
      initialAdAccount={adAccount}
      initialPurchases={purchases}
    />
  )
}
