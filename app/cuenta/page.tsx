// app/cuenta/page.tsx
// Visualización y edición de datos de la cuenta y perfil comercial

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AppUser, Seller, AdAccount, Advertiser } from '@/lib/types'
import AccountProfileView from '@/components/AccountProfileView'

export const metadata = {
  title: 'Mi Cuenta y Perfil | Marketplace',
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
    />
  )
}
