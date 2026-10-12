'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type {
  Listing,
  AdPackage,
  AdAccount,
  Advertiser,
  Seller,
  AdRechargeRequest,
} from '@/lib/types'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

interface PromotionFormProps {
  userId: string
  seller: Seller
  initialAdvertiser: Advertiser | null
  initialAdAccount: AdAccount | null
  initialRechargeRequests?: AdRechargeRequest[]
  publishedListings: Listing[]
  preselectedListingId?: string
  packages: AdPackage[]
  initialTab?: 'recharge' | 'campaign'
}

export default function PromotionForm({
  userId,
  seller,
  initialAdvertiser,
  initialAdAccount,
  initialRechargeRequests = [],
  publishedListings,
  preselectedListingId,
  packages,
  initialTab,
}: PromotionFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { t, locale } = useTranslation()

  // Advertiser & Account state
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(initialAdvertiser)
  const [adAccount, setAdAccount] = useState<AdAccount | null>(initialAdAccount)
  const [loadingAccount, setLoadingAccount] = useState(!initialAdAccount)
  const [refreshingBalance, setRefreshingBalance] = useState(false)

  // Recharge requests state
  const [rechargeRequests, setRechargeRequests] = useState<AdRechargeRequest[]>(
    initialRechargeRequests || []
  )

  // Package for recharge
  const [selectedRechargePackageId, setSelectedRechargePackageId] = useState<string>(
    packages[0]?.id || ''
  )
  const selectedRechargePackage =
    packages.find((p) => p.id === selectedRechargePackageId) || packages[0]

  // Payment proof form state
  const [paymentMethod, setPaymentMethod] = useState<'nequi' | 'daviplata' | 'bancolombia' | 'transferencia' | 'efectivo'>('nequi')
  const [referenceCode, setReferenceCode] = useState('')
  const [proofImageUrl, setProofImageUrl] = useState('')
  const [rechargeNotes, setRechargeNotes] = useState('')
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [submittingRecharge, setSubmittingRecharge] = useState(false)
  const [rechargeSuccessMsg, setRechargeSuccessMsg] = useState<string | null>(null)
  const [rechargeErrorMsg, setRechargeErrorMsg] = useState<string | null>(null)

  // Campaign builder state
  const [selectedCampaignPackageId, setSelectedCampaignPackageId] = useState<string>(
    packages[0]?.id || ''
  )
  const selectedCampaignPackage =
    packages.find((p) => p.id === selectedCampaignPackageId) || packages[0]

  const [selectedListingId, setSelectedListingId] = useState<string>(
    preselectedListingId || (publishedListings[0]?.id || '')
  )
  const selectedListing = publishedListings.find((l) => l.id === selectedListingId)

  const [headline, setHeadline] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [targetCity, setTargetCity] = useState('')
  const [targetCategory, setTargetCategory] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  // Campaign submit state
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [orderErrorMsg, setOrderErrorMsg] = useState<string | null>(null)
  const [successOrder, setSuccessOrder] = useState<any | null>(null)

  // Active tab state: 'recharge' | 'campaign'
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams ? searchParams.get('tab') : null

  const currentBalance = adAccount?.balance || 0
  const minRequiredPrice = packages[0]?.price || 30000
  const hasApprovedBalance = currentBalance >= (selectedCampaignPackage?.price || minRequiredPrice)

  const [activeTab, setActiveTab] = useState<'recharge' | 'campaign'>(() => {
    if (initialTab) return initialTab
    if (tabFromUrl === 'campaign') return 'campaign'
    if (tabFromUrl === 'recharge') return 'recharge'
    return initialAdAccount && initialAdAccount.balance >= minRequiredPrice ? 'campaign' : 'recharge'
  })

  useEffect(() => {
    if (tabFromUrl === 'campaign') {
      setActiveTab('campaign')
    } else if (tabFromUrl === 'recharge') {
      setActiveTab('recharge')
    }
  }, [tabFromUrl])

  // Auto-fill ad creative content when listing changes
  useEffect(() => {
    if (selectedListing) {
      if (!headline) {
        setHeadline(selectedListing.title.slice(0, 60))
      }
      if (!body && selectedListing.description) {
        setBody(selectedListing.description.slice(0, 120))
      }
      if (!targetCity && selectedListing.city) {
        setTargetCity(selectedListing.city)
      }
      if (!imageUrl && (selectedListing as any).listing_media?.[0]?.url) {
        setImageUrl((selectedListing as any).listing_media[0].url)
      }
    }
  }, [selectedListing])

  // Ensure advertiser and ad_account exist automatically
  useEffect(() => {
    async function ensureAdAccount() {
      if (adAccount && advertiser) {
        setLoadingAccount(false)
        return
      }

      setLoadingAccount(true)
      try {
        let currentAdv = advertiser

        // 1. Check or create advertiser
        if (!currentAdv) {
          const { data: existingAdvs } = await supabase
            .from('advertiser')
            .select('*')
            .eq('seller_id', seller.id)
            .order('created_at', { ascending: false })

          if (existingAdvs && existingAdvs.length > 0) {
            currentAdv = existingAdvs[0] as Advertiser
            setAdvertiser(existingAdvs[0] as Advertiser)
          } else {
            const { data: newAdv, error: advErr } = await supabase
              .from('advertiser')
              .insert({
                seller_id: seller.id,
                legal_name: seller.business_name,
                status: 'active',
              })
              .select()
              .single()

            if (advErr) throw advErr
            currentAdv = newAdv as Advertiser
            setAdvertiser(newAdv as Advertiser)
          }
        }

        // 2. Check or create ad_account
        if (currentAdv) {
          const { data: existingAccs } = await supabase
            .from('ad_account')
            .select('*')
            .eq('advertiser_id', currentAdv.id)
            .order('balance', { ascending: false })

          if (existingAccs && existingAccs.length > 0) {
            setAdAccount(existingAccs[0] as AdAccount)
          } else {
            const { data: newAcc, error: accErr } = await supabase
              .from('ad_account')
              .insert({
                advertiser_id: currentAdv.id,
                balance: 0,
              })
              .select()
              .single()

            if (accErr) throw accErr
            setAdAccount(newAcc as AdAccount)
          }
        }
      } catch (err: any) {
        console.error('Error inicializando cuenta publicitaria:', err)
      } finally {
        setLoadingAccount(false)
      }
    }

    ensureAdAccount()
  }, [seller.id, seller.business_name, advertiser, adAccount, supabase])

  // Refresh balance and recharge requests on demand
  const handleRefreshBalance = useCallback(async () => {
    setRefreshingBalance(true)
    try {
      if (advertiser) {
        const { data: accsData } = await supabase
          .from('ad_account')
          .select('*')
          .eq('advertiser_id', advertiser.id)
          .order('balance', { ascending: false })
        if (accsData && accsData.length > 0) {
          setAdAccount(accsData[0] as AdAccount)
        }
      } else if (adAccount) {
        const { data: accData } = await supabase
          .from('ad_account')
          .select('*')
          .eq('id', adAccount.id)
          .maybeSingle()
        if (accData) {
          setAdAccount(accData as AdAccount)
        }
      }

      const { data: reqsData } = await supabase
        .from('ad_recharge_request')
        .select(`
          *,
          package:package_id(*)
        `)
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false })

      if (reqsData) {
        setRechargeRequests(reqsData as AdRechargeRequest[])
      }
    } catch (err) {
      console.error('Error al actualizar saldo:', err)
    } finally {
      setRefreshingBalance(false)
    }
  }, [adAccount, seller.id, supabase])

  // Image file upload for proof receipt
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingReceipt(true)
    setRechargeErrorMsg(null)

    try {
      const cleanName = `${Date.now()}_receipt_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const filePath = `${userId}/receipts/${cleanName}`

      const { data, error } = await supabase.storage
        .from('listings')
        .upload(filePath, file, { upsert: true })

      if (error) {
        throw new Error(`Error al subir comprobante: ${error.message}`)
      }

      const { data: urlData } = supabase.storage
        .from('listings')
        .getPublicUrl(data.path)

      if (urlData?.publicUrl) {
        setProofImageUrl(urlData.publicUrl)
      }
    } catch (err: any) {
      setRechargeErrorMsg(err.message || 'No se pudo subir la imagen del comprobante.')
    } finally {
      setUploadingReceipt(false)
      e.target.value = ''
    }
  }

  // Submit Recharge Request
  const handleSubmitRechargeRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setRechargeErrorMsg(null)
    setRechargeSuccessMsg(null)

    if (!adAccount) {
      setRechargeErrorMsg('Tu cuenta publicitaria se está inicializando. Por favor intenta de nuevo en unos segundos.')
      return
    }

    const amountToRecharge = selectedRechargePackage ? selectedRechargePackage.price : 0
    if (amountToRecharge <= 0) {
      setRechargeErrorMsg('Selecciona un paquete publicitario válido.')
      return
    }

    if (!referenceCode.trim() && !proofImageUrl.trim()) {
      setRechargeErrorMsg('Por favor ingresa el código de referencia o adjunta el comprobante del pago.')
      return
    }

    setSubmittingRecharge(true)
    try {
      const { data: newReq, error: reqErr } = await supabase
        .from('ad_recharge_request')
        .insert({
          ad_account_id: adAccount.id,
          seller_id: seller.id,
          package_id: selectedRechargePackage?.id || null,
          amount: amountToRecharge,
          payment_method: paymentMethod,
          reference_code: referenceCode.trim() || null,
          proof_image_url: proofImageUrl.trim() || null,
          notes: rechargeNotes.trim() || null,
          status: 'pending',
        })
        .select(`
          *,
          package:package_id(*)
        `)
        .single()

      if (reqErr) throw reqErr

      setRechargeRequests((prev) => [newReq as AdRechargeRequest, ...prev])
      setRechargeSuccessMsg(
        `¡Comprobante enviado con éxito! Tu solicitud de recarga por $${amountToRecharge.toLocaleString('es-CO')} COP está pendiente de aprobación por el administrador. En cuanto sea verificada, tu saldo se acreditará y la configuración de campaña se habilitará automáticamente.`
      )
      setReferenceCode('')
      setProofImageUrl('')
      setRechargeNotes('')
    } catch (err: any) {
      setRechargeErrorMsg(err.message || 'Error al enviar la solicitud de recarga.')
    } finally {
      setSubmittingRecharge(false)
    }
  }

  // Upload ad banner image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setOrderErrorMsg(null)

    try {
      const cleanName = `${Date.now()}_ad_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const filePath = `${userId}/ads/${cleanName}`

      const { data, error } = await supabase.storage
        .from('listings')
        .upload(filePath, file, { upsert: true })

      if (error) {
        throw new Error(
          `No se pudo subir la imagen al bucket (${error.message}). Puedes ingresar la URL directa abajo.`
        )
      }

      const { data: urlData } = supabase.storage
        .from('listings')
        .getPublicUrl(data.path)

      if (urlData?.publicUrl) {
        setImageUrl(urlData.publicUrl)
      }
    } catch (err: any) {
      setOrderErrorMsg(err.message)
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  // Submit Campaign Order (with approved balance)
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setOrderErrorMsg(null)

    if (!adAccount) {
      setOrderErrorMsg('No se encontró la cuenta publicitaria.')
      return
    }

    if (!selectedCampaignPackage) {
      setOrderErrorMsg('Debes seleccionar un paquete publicitario.')
      return
    }

    if (!headline.trim()) {
      setOrderErrorMsg('El titular del anuncio es obligatorio.')
      return
    }

    if (!imageUrl.trim()) {
      setOrderErrorMsg('La imagen del anuncio es obligatoria.')
      return
    }

    // Strict balance check
    if (currentBalance < selectedCampaignPackage.price) {
      setOrderErrorMsg(
        `Saldo insuficiente. Cuentas con $${currentBalance.toLocaleString('es-CO')} COP y el paquete cuesta $${selectedCampaignPackage.price.toLocaleString('es-CO')} COP. Por favor recarga saldo en el Paso 1 y espera la aprobación del administrador.`
      )
      return
    }

    setSubmittingOrder(true)

    try {
      const startsAt = new Date().toISOString()
      const endsAt = new Date(
        Date.now() + selectedCampaignPackage.duration_days * 24 * 60 * 60 * 1000
      ).toISOString()

      // 1. Insert ad_order with status 'submitted'
      const { data: orderData, error: orderErr } = await supabase
        .from('ad_order')
        .insert({
          ad_account_id: adAccount.id,
          package_id: selectedCampaignPackage.id,
          listing_id: selectedListingId || null,
          headline: headline.trim(),
          body: body.trim() || null,
          image_url: imageUrl.trim(),
          cta_label: 'Ver más',
          target_city: targetCity.trim() || null,
          target_category: targetCategory.trim() || null,
          status: 'submitted',
          starts_at: startsAt,
          ends_at: endsAt,
          price_paid: selectedCampaignPackage.price,
          submitted_at: startsAt,
          clicks_count: 0,
          impressions_count: 0,
          contacts_count: 0,
        })
        .select()
        .single()

      if (orderErr) {
        throw orderErr
      }

      // 2. Deduct balance from ad_account
      const newBalance = Math.max(0, currentBalance - selectedCampaignPackage.price)
      const { error: accUpdErr } = await supabase
        .from('ad_account')
        .update({ balance: newBalance })
        .eq('id', adAccount.id)

      if (accUpdErr) {
        console.warn('Aviso debitando saldo en ad_account:', accUpdErr.message)
      } else {
        setAdAccount((prev) => (prev ? { ...prev, balance: newBalance } : null))
      }

      // 3. Log wallet spend transaction
      try {
        await supabase.from('wallet_transaction').insert({
          ad_account_id: adAccount.id,
          kind: 'spend',
          amount: selectedCampaignPackage.price,
          balance_after: newBalance,
          ref_type: 'ad_order',
          ref_id: orderData.id,
          idempotency_key: `order_spend_${orderData.id}`,
        })
      } catch (txErr) {
        console.warn('Aviso registrando wallet_transaction:', txErr)
      }

      setSuccessOrder(orderData)
    } catch (err: any) {
      setOrderErrorMsg(err.message || 'Error al crear la orden publicitaria')
    } finally {
      setSubmittingOrder(false)
    }
  }

  // Pending request count
  const pendingRequests = rechargeRequests.filter((r) => r.status === 'pending')
  const latestPending = pendingRequests[0]

  if (successOrder) {
    return (
      <div className="max-w-xl mx-auto my-12 rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
          <span className="text-4xl">🚀</span>
        </div>
        <h2 className="mt-4 text-2xl font-black text-zinc-900 dark:text-zinc-50">
          ¡Campaña Publicitaria Creada!
        </h2>
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
          Tu anuncio ha sido recibido y enviado a revisión de creatividad (estado <strong>submitted</strong>).
          El monto de la campaña fue debitado de tu saldo aprobado.
        </p>

        <div className="mt-6 rounded-2xl bg-zinc-50 p-4 border border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700 text-left text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-zinc-500">Titular:</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{successOrder.headline}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Inversión debitada:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              ${Number(successOrder.price_paid).toLocaleString('es-CO')} COP
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Nuevo Saldo disponible:</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              ${Number(adAccount?.balance || 0).toLocaleString('es-CO')} COP
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-400">
            <span>ID de Campaña:</span>
            <span className="font-mono">{successOrder.id}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/mis-campanas"
            className="rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-500 transition-colors"
          >
            Ver mis campañas →
          </Link>
          <Link
            href="/mis-publicaciones"
            className="rounded-xl border border-zinc-300 px-5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            Volver a mis publicaciones
          </Link>
        </div>
      </div>
    )
  }

  const isCampaignUnlocked = currentBalance >= selectedCampaignPackage.price

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 1. Header: Saldo Aprobado y Estado de Cuenta */}
      <div className="rounded-3xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50/70 to-purple-50 p-6 shadow-sm dark:border-purple-900/60 dark:from-purple-950/40 dark:via-zinc-900 dark:to-purple-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-white font-black text-2xl shadow-md">
              💳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  Cuenta de Anunciante: {advertiser?.legal_name || seller.business_name}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Activa
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  {t.promotions.approvedBalance}:
                </span>
                <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {loadingAccount
                    ? t.common.loading
                    : `$${currentBalance.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')} COP`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleRefreshBalance}
              disabled={refreshingBalance}
              className="flex items-center gap-1.5 rounded-xl border border-purple-300 bg-white px-3.5 py-2 text-xs font-bold text-purple-700 shadow-xs hover:bg-purple-50 dark:border-purple-800 dark:bg-zinc-800 dark:text-purple-300 disabled:opacity-50 transition-colors"
              title="Actualizar saldo"
            >
              <span className={refreshingBalance ? 'animate-spin' : ''}>🔄</span>
              <span>{refreshingBalance ? t.common.loading : t.promotions.refreshBalance}</span>
            </button>
          </div>
        </div>

        {/* Banner de Solicitud Pendiente en Revisión */}
        {latestPending && (
          <div className="mt-4 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200 flex items-start gap-3 animate-in fade-in duration-200">
            <span className="text-xl shrink-0">🕒</span>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <strong>{locale === 'en' ? 'Recharge request under review by administrator:' : 'Solicitud de recarga en revisión por el administrador:'}</strong>
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  {t.common.inReview}
                </span>
              </div>
              <p>
                {locale === 'en' ? 'Amount' : 'Monto'}: <strong>${Number(latestPending.amount).toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')} COP</strong> ({latestPending.payment_method.toUpperCase()}) — Ref: {latestPending.reference_code || 'Adjunto'}.
                {locale === 'en' ? ' The admin is verifying your receipt. As soon as it is approved, your balance will update and campaign setup will unlock.' : ' El administrador está validando tu comprobante. En cuanto sea aprobado, tu saldo se reflejará aquí y se desbloqueará la configuración de tu campaña.'}
              </p>
            </div>
          </div>
        )}
      </div>



      {/* ======================================================== */}
      {/* PESTAÑA 1: PROCESO INDEPENDIENTE DE RECARGA DE SALDO     */}
      {/* ======================================================== */}
      {activeTab === 'recharge' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Tarjeta explicativa del flujo independiente */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
              <span>ℹ️</span>
              <span>Proceso de Recarga y Habilitación de Campañas</span>
            </h3>
            <p className="mt-1 text-xs text-blue-800/90 dark:text-blue-300 leading-relaxed">
              El proceso de recarga es <strong>independiente</strong> de la creación del anuncio. 
              Selecciona el paquete publicitario que deseas adquirir, transfiere el valor correspondiente a nuestras cuentas oficiales y sube el comprobante. 
              Una vez aprobado por el administrador, el saldo se acreditará inmediatamente en tu cuenta y se habilitará la ventana de configuración del anuncio publicitario.
            </p>
          </div>

          {rechargeSuccessMsg && (
            <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200 animate-in fade-in">
              {rechargeSuccessMsg}
            </div>
          )}

          {rechargeErrorMsg && (
            <div className="rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-800 border border-red-200 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200 animate-in fade-in">
              {rechargeErrorMsg}
            </div>
          )}

          <form onSubmit={handleSubmitRechargeRequest} className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-8">
            {/* Paso 1.1: Selección del paquete a adquirir */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  1. Elige el Paquete Publicitario que deseas Recargar *
                </label>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                  Precios oficiales
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {packages.map((pkg) => {
                  const isSelected = selectedRechargePackageId === pkg.id
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedRechargePackageId(pkg.id)}
                      className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-600 shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400">
                        ⏱️ {pkg.duration_days} días de visibilidad
                      </span>
                      <span className="mt-1 text-sm font-bold text-zinc-900 dark:text-zinc-50">
                        {pkg.name}
                      </span>
                      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-baseline justify-between">
                        <span className="text-base font-black text-zinc-900 dark:text-zinc-100">
                          ${Number(pkg.price).toLocaleString('es-CO')}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold">COP</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Paso 1.2: Cuentas Oficiales para Transferir */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <span>🏦</span>
                <span>2. Canales Oficiales para Transferir el Pago</span>
              </h4>
              <p className="text-xs text-zinc-500">
                Transfiere exactamente <strong>${Number(selectedRechargePackage?.price || 0).toLocaleString('es-CO')} COP</strong> a cualquiera de las siguientes opciones oficiales:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Nequi */}
                <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-700 dark:bg-zinc-800 shadow-2xs">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block">
                    🟣 Nequi
                  </span>
                  <div className="mt-1 text-sm font-extrabold text-zinc-900 dark:text-zinc-100 font-mono select-all">
                    300 123 4567
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    Titular: Administrador Marketplace
                  </span>
                </div>

                {/* Daviplata */}
                <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-700 dark:bg-zinc-800 shadow-2xs">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 block">
                    🔴 Daviplata
                  </span>
                  <div className="mt-1 text-sm font-extrabold text-zinc-900 dark:text-zinc-100 font-mono select-all">
                    300 123 4567
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    Titular: Administrador Marketplace
                  </span>
                </div>

                {/* Bancolombia */}
                <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-700 dark:bg-zinc-800 shadow-2xs">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                    🟡 Bancolombia (Ahorros)
                  </span>
                  <div className="mt-1 text-sm font-extrabold text-zinc-900 dark:text-zinc-100 font-mono select-all">
                    123-456789-01
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    Ahorros / Sucursal Virtual
                  </span>
                </div>
              </div>
            </div>

            {/* Paso 1.3: Registro de Comprobante */}
            <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800 space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                3. Registrar Comprobante de Transferencia
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Medio de Pago */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    Medio de Pago Utilizado *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="nequi">Nequi</option>
                    <option value="daviplata">Daviplata</option>
                    <option value="bancolombia">Bancolombia (Transferencia / QR)</option>
                    <option value="transferencia">Transferencia Bancaria (Otro Banco)</option>
                    <option value="efectivo">Efectivo / En Punto Físico</option>
                  </select>
                </div>

                {/* Código de Referencia */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    Número de Comprobante / Referencia *
                  </label>
                  <input
                    type="text"
                    required
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    placeholder="Ej. M98374281 o Nro de aprobación..."
                    className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 font-mono"
                  />
                </div>
              </div>

              {/* Adjuntar Imagen de Comprobante */}
              <div>
                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                  Captura de Pantalla o Foto del Comprobante
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 shrink-0">
                    <span>📎</span>
                    <span>{uploadingReceipt ? 'Subiendo comprobante...' : 'Adjuntar Comprobante'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      disabled={uploadingReceipt}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="url"
                    value={proofImageUrl}
                    onChange={(e) => setProofImageUrl(e.target.value)}
                    placeholder="O pega la URL de la imagen del comprobante..."
                    className="flex-1 rounded-xl border border-zinc-300 px-3.5 py-2 text-xs text-zinc-900 focus:border-purple-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                {proofImageUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="relative h-16 w-24 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={proofImageUrl} alt="Comprobante adjunto" className="h-full w-full object-cover" />
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Comprobante listo para enviar
                    </span>
                  </div>
                )}
              </div>

              {/* Notas opcionales */}
              <div>
                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                  Notas Adicionales (Opcional)
                </label>
                <input
                  type="text"
                  value={rechargeNotes}
                  onChange={(e) => setRechargeNotes(e.target.value)}
                  placeholder="Ej. Transferido desde la cuenta a nombre de Juan Pérez a las 11:30 AM"
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-purple-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Botón de Enviar Solicitud */}
            <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-zinc-500">
                Monto a autorizar: <strong className="text-zinc-900 dark:text-zinc-100">${Number(selectedRechargePackage?.price || 0).toLocaleString('es-CO')} COP</strong>
              </div>

              <button
                type="submit"
                disabled={submittingRecharge || uploadingReceipt}
                className="w-full sm:w-auto rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {submittingRecharge ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Enviando comprobante...</span>
                  </>
                ) : (
                  <span>📤 Enviar Comprobante para Aprobación</span>
                )}
              </button>
            </div>
          </form>

          {/* Historial de Solicitudes de Recarga */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Historial de Solicitudes de Recarga de Saldo
              </h4>
              <button
                type="button"
                onClick={handleRefreshBalance}
                className="text-xs text-purple-600 hover:underline dark:text-purple-400 font-medium"
              >
                Actualizar lista
              </button>
            </div>

            {rechargeRequests.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500">
                Aún no has enviado solicitudes de recarga. Selecciona un paquete arriba para recargar.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {rechargeRequests.map((req) => (
                  <div key={req.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                          ${Number(req.amount).toLocaleString('es-CO')} COP
                        </span>
                        <span className="text-zinc-400">•</span>
                        <span className="uppercase text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                          {req.payment_method}
                        </span>
                        {req.reference_code && (
                          <span className="font-mono text-[11px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            Ref: {req.reference_code}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Enviada el {new Date(req.created_at).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      {req.admin_notes && (
                        <div className="text-[11px] text-red-600 dark:text-red-400">
                          Nota del Administrador: {req.admin_notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {req.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          <span>🕒</span>
                          <span>Pendiente de Aprobación</span>
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <span>✅</span>
                          <span>Aprobada y Acreditada</span>
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-800 dark:bg-red-950/60 dark:text-red-300">
                          <span>❌</span>
                          <span>Rechazada</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: CONFIGURACIÓN DE CAMPAÑA (BLOQUEADA / HABILITADA) */}
      {/* ======================================================== */}
      {activeTab === 'campaign' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {!isCampaignUnlocked ? (
            /* ================================================== */
            /* ESTADO BLOQUEADO (LOCKED STATE)                   */
            /* ================================================== */
            <div className="rounded-3xl border-2 border-dashed border-zinc-300 bg-white p-8 sm:p-12 text-center dark:border-zinc-700 dark:bg-zinc-900 space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 shadow-sm animate-bounce-subtle">
                <span className="text-4xl">🔒</span>
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                  Configuración de Campaña Bloqueada
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Para diseñar y publicar tu anuncio publicitario, primero debes contar con saldo aprobado por el administrador.
                </p>
              </div>

              {/* Detalle de Saldo */}
              <div className="max-w-md mx-auto rounded-2xl bg-zinc-50 p-4 border border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700 text-left text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Saldo Aprobado Actual:</span>
                  <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                    ${currentBalance.toLocaleString('es-CO')} COP
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Inversión Mínima Requerida:</span>
                  <span className="font-extrabold text-purple-600 dark:text-purple-400">
                    ${selectedCampaignPackage.price.toLocaleString('es-CO')} COP ({selectedCampaignPackage.name})
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Faltante para Desbloquear:</span>
                  <span className="font-black text-red-600 dark:text-red-400">
                    ${Math.max(0, selectedCampaignPackage.price - currentBalance).toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>

              {/* Si hay una solicitud pendiente en revisión */}
              {latestPending ? (
                <div className="max-w-md mx-auto rounded-2xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <span>🕒</span>
                    <span>Tu comprobante está en revisión por el Administrador</span>
                  </div>
                  <p>
                    Tienes una solicitud de <strong>${Number(latestPending.amount).toLocaleString('es-CO')} COP</strong> en espera. 
                    Tan pronto como el administrador verifique el pago en su panel de administración, esta ventana se desbloqueará de inmediato.
                  </p>
                  <button
                    type="button"
                    onClick={handleRefreshBalance}
                    disabled={refreshingBalance}
                    className="mt-2 w-full rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-500 disabled:opacity-50 transition-colors"
                  >
                    {refreshingBalance ? 'Comprobando...' : '🔄 Comprobar si ya fue aprobada'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 p-3.5 text-xs text-purple-900 dark:text-purple-200">
                    <span>👈 Para adquirir saldo y desbloquear la campaña, utiliza la opción <strong>Recarga de Saldo</strong> en el menú lateral izquierdo.</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ================================================== */
            /* ESTADO DESBLOQUEADO (UNLOCKED CREATIVE BUILDER)    */
            /* ================================================== */
            <form onSubmit={handleSubmitOrder} className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-8">
              {/* Banner de Saldo Aprobado Disponible */}
              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-bold">
                  <span className="text-lg">✅</span>
                  <span>
                    Saldo Aprobado Disponible: <strong>${currentBalance.toLocaleString('es-CO')} COP</strong>
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  Ventana de Campaña Desbloqueada
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Configurar Creatividad y Lanzar Anuncio
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Personaliza cómo se verá tu anuncio publicitario patrocinado en el marketplace.
                </p>
              </div>

              {orderErrorMsg && (
                <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900">
                  {orderErrorMsg}
                </div>
              )}

              {/* 1. Seleccionar Producto/Servicio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                  1. Publicación a Promocionar *
                </label>
                <select
                  value={selectedListingId}
                  onChange={(e) => setSelectedListingId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {publishedListings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} — ({l.type}) {l.price ? `$${Number(l.price).toLocaleString('es-CO')}` : 'Cotización'}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Seleccionar Paquete Publicitario */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                  2. Paquete a Aplicar con tu Saldo Aprobado *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {packages.map((pkg) => {
                    const isSelected = selectedCampaignPackageId === pkg.id
                    const canAfford = currentBalance >= pkg.price
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedCampaignPackageId(pkg.id)}
                        className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/30 ring-2 ring-purple-600 shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                        } ${!canAfford ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400">
                            ⏱️ {pkg.duration_days} días
                          </span>
                          {!canAfford && (
                            <span className="text-[10px] text-red-500 font-bold">Saldo bajo</span>
                          )}
                        </div>
                        <span className="mt-1 text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          {pkg.name}
                        </span>
                        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-baseline justify-between">
                          <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                            ${Number(pkg.price).toLocaleString('es-CO')}
                          </span>
                          <span className="text-[10px] text-zinc-400">COP</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. Creatividad del Anuncio (Headline & Body) */}
              <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800 space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  3. Mensaje Publicitario
                </label>

                {/* Headline (máx 60 caracteres) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Titular del Anuncio (Headline) *
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        headline.length > 60 ? 'text-red-600 font-bold' : 'text-zinc-400'
                      }`}
                    >
                      {headline.length} / 60
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Ej. ¡20% de descuento en repostería artesanal este fin de semana!"
                    className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                {/* Body (máx 120 caracteres) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Texto secundario (Body)
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        body.length > 120 ? 'text-red-600 font-bold' : 'text-zinc-400'
                      }`}
                    >
                      {body.length} / 120
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={120}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Ej. Elaborado con ingredientes frescos de la más alta calidad. Envíos a todo el país."
                    className="w-full rounded-xl border border-zinc-300 p-3 text-xs text-zinc-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* 4. Imagen Publicitaria */}
              <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  4. Imagen del Anuncio *
                </label>
                <p className="text-xs text-zinc-500">
                  Sube una imagen promocional para tu anuncio o usa la URL de la foto de tu publicación.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 shrink-0">
                    <span>📷</span>
                    <span>{uploadingImage ? 'Subiendo...' : 'Subir imagen propia'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded-xl border border-zinc-300 px-3.5 py-2 text-xs text-zinc-900 focus:border-purple-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                {imageUrl && (
                  <div className="mt-3">
                    <span className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase">
                      Vista Previa del Anuncio Patrocinado:
                    </span>
                    <div className="max-w-sm rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 flex gap-3 items-center">
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="Vista previa del anuncio" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="inline-block rounded-md bg-purple-100 px-1.5 py-0.5 text-[9px] font-black text-purple-700 uppercase tracking-wider dark:bg-purple-950 dark:text-purple-300">
                          Patrocinado
                        </span>
                        <div className="mt-0.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {headline || 'Titular de tu anuncio'}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate">
                          {body || 'Descripción del anuncio promocional'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Segmentación opcional */}
              <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Ciudad objetivo (target_city) - Opcional
                  </label>
                  <input
                    type="text"
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    placeholder="Ej. Bogotá, Medellín, Todas"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Categoría objetivo (target_category) - Opcional
                  </label>
                  <input
                    type="text"
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                    placeholder="Ej. Alimentos, Servicios"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:border-purple-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Botón de Enviar Campaña */}
              <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-zinc-500">
                  Costo: <strong>${Number(selectedCampaignPackage.price).toLocaleString('es-CO')} COP</strong> (se descontará de tu saldo de ${currentBalance.toLocaleString('es-CO')}).
                </div>

                <div className="w-full sm:w-auto">

                  <button
                    type="submit"
                    disabled={submittingOrder || uploadingImage || currentBalance < selectedCampaignPackage.price}
                    className="w-full sm:w-auto rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {submittingOrder ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Publicando campaña...</span>
                      </>
                    ) : (
                      <span>🚀 Publicar Campaña con Saldo Aprobado</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
