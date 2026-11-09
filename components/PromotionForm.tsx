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
import {
  normalizeToOfficialPackages,
  getListingFreeTrialStatus,
  MIN_AD_PLAN_PRICE,
  FREE_INITIAL_AD_DAYS,
  PLAN_PASARELA_PRICE,
  PLAN_GRAN_VITRINA_PRICE,
  PLAN_COMBO_PRICE,
  PLAN_COMBO_SAVINGS,
} from '@/lib/adPolicies'
import {
  type DynamicRunwayConfig,
  DEFAULT_AD_PAGE_CONFIG,
  AD_PAGE_CONFIG_STORAGE_KEY,
  AD_PAGE_CONFIG_SLOT_ID,
  sanitizeAdPageConfig,
  decodeAdPageConfigFromSlots,
  encodeAdPageConfigToSlot,
  getListingSpecialClassification,
} from '@/lib/adPageConfig'
import { useRegisterGlobalLoadPhase } from './AvantGardeLoader'

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
  packages: rawPackages,
  initialTab,
}: PromotionFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { t, locale } = useTranslation()
  const packages = normalizeToOfficialPackages(rawPackages)

  // Advertiser & Account state
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(initialAdvertiser)
  const [adAccount, setAdAccount] = useState<AdAccount | null>(initialAdAccount)
  const [loadingAccount, setLoadingAccount] = useState(!initialAdAccount)
  const [refreshingBalance, setRefreshingBalance] = useState(false)

  useRegisterGlobalLoadPhase(loadingAccount)

  // Recharge requests state
  const [rechargeRequests, setRechargeRequests] = useState<AdRechargeRequest[]>(
    initialRechargeRequests || []
  )

  // Lista administrada de Clasificaciones de Pasarela y Catálogos Exclusivos
  const [availableRunways, setAvailableRunways] = useState<DynamicRunwayConfig[]>(
    DEFAULT_AD_PAGE_CONFIG.customRunways
  )

  // Package & Seasonal Runway for recharge (Tab 1)
  // Permite elegir un Plan Original, o 'none' (Solo Pasarela de Temporada), o sumar ambos
  const [selectedRechargePackageId, setSelectedRechargePackageId] = useState<string>(
    packages[0]?.id || ''
  )
  const [selectedRechargeRunwayId, setSelectedRechargeRunwayId] = useState<string>('')
  const selectedRechargePackage =
    selectedRechargePackageId === 'none'
      ? null
      : packages.find((p) => p.id === selectedRechargePackageId) || packages[0] || null
  const selectedRechargeRunway =
    availableRunways.find((r) => r.id === selectedRechargeRunwayId) || null
  const rechargeAmountCop =
    (selectedRechargePackage ? Number(selectedRechargePackage.price || 0) : 0) +
    (selectedRechargeRunway ? Number(selectedRechargeRunway.campaignCostCop || 0) : 0)

  // Payment proof form state
  const [paymentMethod, setPaymentMethod] = useState<'nequi' | 'daviplata' | 'bancolombia' | 'transferencia' | 'efectivo'>('nequi')
  const [referenceCode, setReferenceCode] = useState('')
  const [proofImageUrl, setProofImageUrl] = useState('')
  const [rechargeNotes, setRechargeNotes] = useState('')
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [submittingRecharge, setSubmittingRecharge] = useState(false)
  const [rechargeSuccessMsg, setRechargeSuccessMsg] = useState<string | null>(null)
  const [rechargeErrorMsg, setRechargeErrorMsg] = useState<string | null>(null)

  // Campaign builder state (Tab 2)
  // Permite elegir un Plan Original, o 'none' (Solo Pasarela de Temporada), o sumar ambos
  const [selectedCampaignPackageId, setSelectedCampaignPackageId] = useState<string>(
    packages[0]?.id || ''
  )
  const selectedCampaignPackage =
    selectedCampaignPackageId === 'none'
      ? null
      : packages.find((p) => p.id === selectedCampaignPackageId) || null

  const [selectedListingId, setSelectedListingId] = useState<string>(
    preselectedListingId || (publishedListings[0]?.id || '')
  )
  const selectedListing = publishedListings.find((l) => l.id === selectedListingId)

  const [selectedSpecialRunwayId, setSelectedSpecialRunwayId] = useState<string>('')
  const selectedSpecialRunway =
    availableRunways.find((r) => r.id === selectedSpecialRunwayId) || null

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
  const minSeasonalCost =
    availableRunways.length > 0
      ? Math.min(
          ...availableRunways
            .filter((r) => r.active !== false && Number(r.campaignCostCop) > 0)
            .map((r) => Number(r.campaignCostCop))
        )
      : MIN_AD_PLAN_PRICE
  const minRequiredPrice = Math.min(
    packages[0]?.price || MIN_AD_PLAN_PRICE,
    Number.isFinite(minSeasonalCost) && minSeasonalCost > 0 ? minSeasonalCost : MIN_AD_PLAN_PRICE
  )

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

  useEffect(() => {
    async function loadRunwayClassifications() {
      try {
        const localRaw = localStorage.getItem(AD_PAGE_CONFIG_STORAGE_KEY)
        if (localRaw) {
          const parsed = sanitizeAdPageConfig(JSON.parse(localRaw))
          setAvailableRunways(parsed.customRunways || DEFAULT_AD_PAGE_CONFIG.customRunways)
        }
      } catch {
        // Ignorar error local
      }
      try {
        const { data: slotsData } = await supabase
          .from('ad_slot')
          .select('*')
          .eq('id', AD_PAGE_CONFIG_SLOT_ID)
        if (slotsData && slotsData.length > 0) {
          const decoded = decodeAdPageConfigFromSlots(slotsData)
          setAvailableRunways(decoded.customRunways || DEFAULT_AD_PAGE_CONFIG.customRunways)
        }
      } catch {
        // Usar configuración local
      }
    }
    loadRunwayClassifications()
  }, [supabase])

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
      if (selectedListing.attrs?.special_runway_id) {
        setSelectedSpecialRunwayId(String(selectedListing.attrs.special_runway_id))
        if (selectedListing.attrs?.ad_placement === 'pasarela_temporada') {
          setSelectedCampaignPackageId('none')
        }
      } else {
        setSelectedSpecialRunwayId('')
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

    const amountToRecharge = rechargeAmountCop
    if (amountToRecharge <= 0) {
      setRechargeErrorMsg('Selecciona un Plan Original, una Pasarela de Temporada, o ambos para recargar.')
      return
    }

    if (!referenceCode.trim() && !proofImageUrl.trim()) {
      setRechargeErrorMsg('Por favor ingresa el código de referencia o adjunta el comprobante del pago.')
      return
    }

    const rTitle =
      selectedRechargeRunway?.title ||
      (selectedRechargeRunway as any)?.titleEs ||
      'Pasarela de Temporada'
    const planSummaryPrefix =
      !selectedRechargePackage && selectedRechargeRunway
        ? `[SOLO_TEMPORADA:${selectedRechargeRunway.id}] Solo Pasarela de Temporada: ${rTitle}`
        : selectedRechargePackage && selectedRechargeRunway
        ? `[PLAN_MAS_TEMPORADA:${selectedRechargeRunway.id}:${selectedRechargePackage.placement}] ${selectedRechargePackage.name} + Pasarela: ${rTitle}`
        : ''
    const combinedRechargeNotes = [planSummaryPrefix, rechargeNotes.trim()]
      .filter(Boolean)
      .join(' | ')

    setSubmittingRecharge(true)
    try {
      const { data: newReq, error: reqErr } = await supabase
        .from('ad_recharge_request')
        .insert({
          ad_account_id: adAccount.id,
          seller_id: seller.id,
          package_id: selectedRechargePackage?.id || packages[0]?.id || null,
          amount: amountToRecharge,
          payment_method: paymentMethod,
          reference_code: referenceCode.trim() || null,
          proof_image_url: proofImageUrl.trim() || null,
          notes: combinedRechargeNotes || null,
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
        `¡Comprobante enviado con éxito! Tu solicitud de recarga por $${amountToRecharge.toLocaleString('es-CO')} COP está pendiente de aprobación por el administrador. En cuanto sea verificada, tu saldo se acreditará y la pasarela se activará con las mismas condiciones vigentes.`
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

  // Costo de Plan Original (puede ser $0 si el usuario eligió únicamente Pasarela de Temporada) + Costo de Pasarela de Temporada
  const basePlanCost = selectedCampaignPackage ? Number(selectedCampaignPackage.price || 0) : 0
  const extraCatalogCost = selectedSpecialRunway ? Number(selectedSpecialRunway.campaignCostCop || 0) : 0
  const totalCampaignPrice = basePlanCost + extraCatalogCost

  // Submit Campaign Order (with approved balance)
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setOrderErrorMsg(null)

    if (!adAccount) {
      setOrderErrorMsg('No se encontró la cuenta publicitaria.')
      return
    }

    if (!selectedCampaignPackage && !selectedSpecialRunway) {
      setOrderErrorMsg(
        'Debes elegir un Plan Original, una Pasarela de Temporada / Adicional, o ambos.'
      )
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

    // Strict balance check (Plan Original si aplica + Pasarela de Temporada si aplica)
    if (currentBalance < totalCampaignPrice) {
      const breakdownText =
        selectedCampaignPackage && selectedSpecialRunway
          ? `Plan ${selectedCampaignPackage.name} $${basePlanCost.toLocaleString('es-CO')} + Pasarela de Temporada $${extraCatalogCost.toLocaleString('es-CO')}`
          : selectedSpecialRunway
          ? `Solo Pasarela de Temporada $${extraCatalogCost.toLocaleString('es-CO')}`
          : `Plan ${selectedCampaignPackage?.name} $${basePlanCost.toLocaleString('es-CO')}`
      setOrderErrorMsg(
        `Saldo insuficiente. Cuentas con $${currentBalance.toLocaleString('es-CO')} COP y el costo total de la campaña es $${totalCampaignPrice.toLocaleString('es-CO')} COP (${breakdownText}). Por favor recarga saldo en el Paso 1 y espera la aprobación del administrador.`
      )
      return
    }

    setSubmittingOrder(true)

    try {
      const effectiveDurationDays = selectedCampaignPackage
        ? Number(selectedCampaignPackage.duration_days || 7)
        : Number(selectedSpecialRunway?.defaultDurationDays || 7)
      const startsAt = new Date().toISOString()
      const endsAt = new Date(
        Date.now() + effectiveDurationDays * 24 * 60 * 60 * 1000
      ).toISOString()

      const specialTitle =
        selectedSpecialRunway?.title ||
        (selectedSpecialRunway as any)?.titleEs ||
        'Pasarela de Temporada'
      const specialBadge = selectedSpecialRunway
        ? `${selectedSpecialRunway.icon || '🎄'} ${
            selectedSpecialRunway.badge || (selectedSpecialRunway as any).badgeEs || 'Temporada'
          }`
        : ''

      const resolvedTargetCategory =
        !selectedCampaignPackage && selectedSpecialRunway
          ? `[SOLO_TEMPORADA:${selectedSpecialRunway.id}] ${specialTitle}${
              targetCategory.trim() ? ` | ${targetCategory.trim()}` : ''
            }`
          : selectedCampaignPackage && selectedSpecialRunway
          ? `[PLAN_MAS_TEMPORADA:${selectedSpecialRunway.id}:${selectedCampaignPackage.placement}] ${specialTitle}${
              targetCategory.trim() ? ` | ${targetCategory.trim()}` : ''
            }`
          : targetCategory.trim() || null

      // 1. Insert ad_order with status 'submitted'
      const { data: orderData, error: orderErr } = await supabase
        .from('ad_order')
        .insert({
          ad_account_id: adAccount.id,
          package_id: selectedCampaignPackage?.id || packages[0]?.id,
          listing_id: selectedListingId || null,
          headline: headline.trim(),
          body: body.trim() || null,
          image_url: imageUrl.trim(),
          cta_label: 'Ver más',
          target_city: targetCity.trim() || null,
          target_category: resolvedTargetCategory,
          status: 'submitted',
          starts_at: startsAt,
          ends_at: endsAt,
          price_paid: totalCampaignPrice,
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

      // 1.B Actualizar ubicación y/o Pasarela de Temporada en el artículo y sincronizar con las mismas condiciones que las pasarelas originales
      if (selectedListingId && selectedListing) {
        try {
          const currentAttrs: Record<string, any> = { ...(selectedListing.attrs || {}) }
          currentAttrs.ad_placement =
            !selectedCampaignPackage && selectedSpecialRunway
              ? 'pasarela_temporada'
              : selectedCampaignPackage?.placement || 'pasarela'

          if (selectedSpecialRunway) {
            currentAttrs.special_runway_id = selectedSpecialRunway.id
            currentAttrs.special_runway_title = specialTitle
            currentAttrs.special_runway_badge = specialBadge
            currentAttrs.special_catalog_cost = extraCatalogCost
            currentAttrs.runway_independent_status = {
              ...(currentAttrs.runway_independent_status || {}),
              customRunways: {
                ...(currentAttrs.runway_independent_status?.customRunways || {}),
                [selectedSpecialRunway.id]: {
                  enabled: true,
                  endsAt,
                },
              },
            }
          } else {
            delete currentAttrs.special_runway_id
            delete currentAttrs.special_runway_title
            delete currentAttrs.special_runway_badge
            delete currentAttrs.special_catalog_cost
          }
          await supabase
            .from('listing')
            .update({ attrs: currentAttrs })
            .eq('id', selectedListingId)

          // Sincronizar también en la lista de pasarelas/catálogos exclusivos (habilitar vendedor por pago realizado y asignar artículo)
          const rawConfig = localStorage.getItem(AD_PAGE_CONFIG_STORAGE_KEY)
          const baseConfig = rawConfig
            ? sanitizeAdPageConfig(JSON.parse(rawConfig))
            : DEFAULT_AD_PAGE_CONFIG
          const nextCustomRunways = baseConfig.customRunways.map((r) => {
            const withoutListing = r.assignedListingIds.filter((id) => id !== selectedListingId)
            if (selectedSpecialRunway && r.id === selectedSpecialRunway.id) {
              const nextSellers = r.authorizedSellerIds.includes(seller.id)
                ? r.authorizedSellerIds
                : [...r.authorizedSellerIds, seller.id]
              return {
                ...r,
                authorizedSellerIds: nextSellers,
                assignedListingIds: [...withoutListing, selectedListingId],
              }
            }
            return { ...r, assignedListingIds: withoutListing }
          })
          const nextConfig = sanitizeAdPageConfig({
            ...baseConfig,
            customRunways: nextCustomRunways,
            updatedAt: new Date().toISOString(),
          })
          localStorage.setItem(AD_PAGE_CONFIG_STORAGE_KEY, JSON.stringify(nextConfig))
          window.dispatchEvent(new CustomEvent('ad-page-config-updated', { detail: nextConfig }))
          try {
            const encodedSlot = encodeAdPageConfigToSlot(nextConfig)
            await supabase.from('ad_slot').upsert([encodedSlot], { onConflict: 'id' })
          } catch {
            // Ignorar si tabla ad_slot no requiere actualización
          }
        } catch (syncErr) {
          console.warn('Aviso sincronizando clasificación de catálogo exclusivo:', syncErr)
        }
      }

      // 2. Deduct balance from ad_account
      const newBalance = Math.max(0, currentBalance - totalCampaignPrice)
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
          amount: totalCampaignPrice,
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
          Tu anuncio ha sido registrado exitosamente. En <strong>Mis Campañas</strong> puedes visualizar todos sus campos y editarlos en cualquier momento (incluida la imagen cargada).
        </p>

        {/* Vista previa de la imagen y campos de la campaña recién creada */}
        <div className="mt-6 rounded-2xl bg-zinc-50 p-4 border border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700 text-left text-xs space-y-3">
          {successOrder.image_url && (
            <div className="flex items-center gap-3.5 pb-3 border-b border-zinc-200 dark:border-zinc-700">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={successOrder.image_url}
                  alt={successOrder.headline || 'Imagen de la campaña'}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <span className="inline-block rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-black uppercase text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Vista previa de creatividad
                </span>
                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  {successOrder.headline}
                </div>
                {successOrder.body && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {successOrder.body}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Titular:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-right">
                {successOrder.headline}
              </span>
            </div>
            {successOrder.body && (
              <div className="flex justify-between gap-2">
                <span className="text-zinc-500">Descripción:</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300 text-right max-w-xs truncate">
                  {successOrder.body}
                </span>
              </div>
            )}
            {selectedListing && (
              <div className="flex justify-between gap-2">
                <span className="text-zinc-500">Publicación vinculada:</span>
                <span className="font-semibold text-purple-700 dark:text-purple-300 text-right truncate max-w-xs">
                  {selectedListing.title}
                </span>
              </div>
            )}
            {successOrder.target_city && (
              <div className="flex justify-between gap-2">
                <span className="text-zinc-500">Ciudad objetivo:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {successOrder.target_city}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Inversión debitada:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                ${Number(successOrder.price_paid).toLocaleString('es-CO')} COP
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Nuevo Saldo disponible:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                ${Number(adAccount?.balance || 0).toLocaleString('es-CO')} COP
              </span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-400">
              <span>ID de Campaña:</span>
              <span className="font-mono">{successOrder.id}</span>
            </div>
          </div>
        </div>

        {/* Únicamente el botón de ir a las campañas */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/mis-campanas"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-purple-500 transition-colors"
          >
            <span>📢</span>
            <span>Ir a Mis Campañas →</span>
          </Link>
        </div>
      </div>
    )
  }

  const isCampaignUnlocked = currentBalance >= minRequiredPrice
  const selectedListingFreeTrial = selectedListing
    ? getListingFreeTrialStatus(selectedListing)
    : null

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 0. Cuadro Oficial de Políticas de Publicidad (Cliente) */}
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50/90 via-white to-purple-50/80 p-5 sm:p-6 shadow-xs dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-purple-950/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-emerald-200/70 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white text-lg shadow-xs">
              📜
            </span>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50">
                {locale === 'en'
                  ? 'Official Marketplace Advertising Policies'
                  : 'Políticas y Tarifas Oficiales de Publicidad'}
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {locale === 'en'
                  ? 'Every new product or service includes 7 initial days of free advertising, followed by our Individual or Combo plans.'
                  : 'Cuando creas un producto o servicio dura inicialmente 7 días con publicidad gratis. Luego puedes elegir plan individual o en combo:'}
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            🎁 {FREE_INITIAL_AD_DAYS} {locale === 'en' ? 'Initial Days Free' : 'Días Iniciales Gratis'}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Regla 1: 7 días gratis iniciales */}
          <div className="rounded-2xl border border-emerald-200 bg-white/90 p-3.5 dark:border-emerald-900/60 dark:bg-zinc-900/90">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {locale === 'en' ? 'Initial Benefit' : 'Al Crear Publicación'}
              </span>
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                GRATIS
              </span>
            </div>
            <div className="mt-1 font-extrabold text-zinc-900 dark:text-zinc-50">
              {locale === 'en' ? '7 Days Free Ad' : '7 Días Publicidad Gratis'}
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              {locale === 'en'
                ? 'Automatic upon creating any product or service.'
                : 'Automático al crear cualquier producto o servicio.'}
            </p>
          </div>

          {/* Plan Individual: Pasarela */}
          <div className="rounded-2xl border border-zinc-200 bg-white/90 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/90">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
              {locale === 'en' ? 'Individual Plan' : 'Plan Individual'}
            </span>
            <div className="mt-1 font-extrabold text-zinc-900 dark:text-zinc-50">
              Pasarela + 🏪 Proveedor
            </div>
            <div className="mt-1 text-base font-black text-blue-600 dark:text-blue-400">
              ${PLAN_PASARELA_PRICE.toLocaleString('es-CO')} <span className="text-[10px] font-bold text-zinc-400">COP</span>
            </div>
            <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
              Incluye publicación del proveedor en la Pasarela de Proveedores.
            </p>
          </div>

          {/* Plan Individual: Gran Vitrina */}
          <div className="rounded-2xl border border-zinc-200 bg-white/90 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/90">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
              {locale === 'en' ? 'Individual Plan' : 'Plan Individual'}
            </span>
            <div className="mt-1 font-extrabold text-zinc-900 dark:text-zinc-50">
              Gran Vitrina + 🏪 Proveedor
            </div>
            <div className="mt-1 text-base font-black text-purple-600 dark:text-purple-400">
              ${PLAN_GRAN_VITRINA_PRICE.toLocaleString('es-CO')} <span className="text-[10px] font-bold text-zinc-400">COP</span>
            </div>
            <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
              Incluye publicación del proveedor en la Pasarela de Proveedores.
            </p>
          </div>

          {/* Plan en Combo: Las dos + Proveedor */}
          <div className="rounded-2xl border-2 border-amber-400/80 bg-amber-50/60 p-3.5 dark:border-amber-700 dark:bg-amber-950/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                {locale === 'en' ? 'Combo Plan' : 'Plan en Combo'}
              </span>
              <span className="rounded-md bg-amber-200/80 px-1.5 py-0.5 text-[9px] font-black text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                -${PLAN_COMBO_SAVINGS.toLocaleString('es-CO')}
              </span>
            </div>
            <div className="mt-1 font-extrabold text-zinc-900 dark:text-zinc-50">
              {locale === 'en' ? 'Showcase + Runway + Provider' : 'Vitrina + Pasarela + 🏪 Proveedor'}
            </div>
            <div className="mt-1 text-base font-black text-amber-700 dark:text-amber-400">
              ${PLAN_COMBO_PRICE.toLocaleString('es-CO')} <span className="text-[10px] font-bold text-zinc-500">COP</span>
            </div>
            <p className="mt-0.5 text-[10px] text-amber-900/80 dark:text-amber-200/80">
              Incluye publicación destacada en la Pasarela de Proveedores.
            </p>
          </div>
        </div>
      </div>

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
              <span>Proceso de Recarga: Planes Originales y Pasarelas de Temporada (Independientes o Combinados)</span>
            </h3>
            <p className="mt-1 text-xs text-blue-800/90 dark:text-blue-300 leading-relaxed">
              Al crear un producto o servicio tienes <strong>7 días iniciales con publicidad gratis</strong>. Para promocionar tus anuncios puedes elegir: <strong>(1) Solo un Plan Original</strong> (Pasarela $10.000, Gran Vitrina $20.000 o Combo $25.000), <strong>(2) Únicamente una Pasarela de Temporada</strong> (sin plan original), o <strong>(3) Un Plan Original + Pasarela de Temporada</strong>. Todas se activan apenas se valida el pago con las mismas condiciones de vigencia.
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
            {/* Paso 1.1: Selección del paquete a adquirir (Original, Solo Temporada, o Ambos) */}
            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    1.A Planes Originales (Opcional si solo deseas una Pasarela de Temporada)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRechargePackageId('none')
                      if (!selectedRechargeRunwayId && availableRunways.length > 0) {
                        setSelectedRechargeRunwayId(availableRunways[0].id)
                      }
                    }}
                    className={`rounded-xl px-3 py-1 text-[11px] font-bold border transition-all cursor-pointer ${
                      selectedRechargePackageId === 'none'
                        ? 'border-amber-600 bg-amber-600 text-white shadow-2xs'
                        : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                    }`}
                  >
                    🎄 Quiero únicamente Pasarela de Temporada (Sin plan original)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  {packages.map((pkg) => {
                    const isSelected = selectedRechargePackageId === pkg.id
                    const isCombo = pkg.categoryType === 'combo'
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() =>
                          setSelectedRechargePackageId(
                            isSelected && selectedRechargeRunwayId ? 'none' : pkg.id
                          )
                        }
                        className={`relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-600 shadow-sm'
                            : isCombo
                            ? 'border-amber-300 bg-amber-50/20 dark:border-amber-800/70 dark:bg-amber-950/10 hover:border-amber-400'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                isCombo
                                  ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              }`}
                            >
                              {locale === 'en' ? pkg.badgeEn : pkg.badgeEs}
                            </span>
                            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                              ⏱️ {pkg.duration_days}d
                            </span>
                          </div>

                          <div className="mt-2 text-xs font-black text-zinc-900 dark:text-zinc-50">
                            {locale === 'en' ? pkg.nameEn : pkg.nameEs}
                          </div>
                          <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                            {locale === 'en' ? pkg.subtitleEn : pkg.subtitleEs}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-zinc-200/70 dark:border-zinc-800 flex items-baseline justify-between">
                          <div>
                            <span className="text-base font-black text-zinc-900 dark:text-zinc-100">
                              ${Number(pkg.price).toLocaleString('es-CO')}
                            </span>
                            <span className="ml-1 text-[10px] text-zinc-400 font-bold">COP</span>
                          </div>
                          {isCombo && (
                            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">
                              -$5.000
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}

                  {/* Opción explícita: Sin Plan Original (Solo Pasarela de Temporada) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRechargePackageId('none')
                      if (!selectedRechargeRunwayId && availableRunways.length > 0) {
                        setSelectedRechargeRunwayId(availableRunways[0].id)
                      }
                    }}
                    className={`relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedRechargePackageId === 'none'
                        ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-600 shadow-sm'
                        : 'border-dashed border-amber-300 bg-amber-50/20 hover:border-amber-400 dark:border-amber-800/70 dark:bg-amber-950/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                          🎄 Solo Temporada
                        </span>
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                          Independiente
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-black text-zinc-900 dark:text-zinc-50">
                        Sin Plan Original (Únicamente Pasarela de Temporada)
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                        Elige esta opción si solo deseas publicar en una Pasarela de Temporada sin adquirir los planes originales.
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-amber-200/70 dark:border-amber-800/60 flex items-baseline justify-between">
                      <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
                        $0 Plan Original
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        Elige pasarela abajo ↓
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Paso 1.B: Selección de Pasarela de Temporada (Sola o Adicional) en Recarga */}
              <div className="rounded-2xl border border-amber-300 bg-amber-50/40 p-4 dark:border-amber-900/60 dark:bg-amber-950/20 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                      🎄 1.B Pasarela de Temporada / Catálogo Exclusivo (Única o Adicional)
                    </label>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                      Puedes escoger <strong>únicamente una Pasarela de Temporada</strong> (marcando arriba &ldquo;Sin Plan Original&rdquo;) o <strong>adicionarla a tu Plan Original</strong>. Se activa con las mismas condiciones apenas se valida el pago.
                    </p>
                  </div>
                  {selectedRechargeRunway && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 dark:bg-amber-900/70 px-2.5 py-1 text-[10px] font-black text-amber-900 dark:text-amber-200">
                      {selectedRechargePackageId === 'none' ? 'Valor Pasarela:' : 'Adicional:'} $
                      {Number(selectedRechargeRunway.campaignCostCop || 0).toLocaleString('es-CO')} COP
                    </span>
                  )}
                </div>

                <select
                  value={selectedRechargeRunwayId}
                  onChange={(e) => {
                    const nextId = e.target.value
                    setSelectedRechargeRunwayId(nextId)
                    if (!nextId && selectedRechargePackageId === 'none') {
                      setSelectedRechargePackageId(packages[0]?.id || '')
                    }
                  }}
                  className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-amber-800 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="">
                    — Sin Pasarela de Temporada (Solo Plan Original seleccionado arriba) — $0 COP —
                  </option>
                  {availableRunways.map((r) => {
                    const costCop = Number(r.campaignCostCop || 0)
                    const rTitle = r.title || (r as any).titleEs || 'Pasarela de Temporada'
                    const rBadge = r.badge || (r as any).badgeEs || 'Temporada'
                    return (
                      <option key={r.id} value={r.id}>
                        {r.icon || '🎄'} {rTitle} ({rBadge}) — ${costCop.toLocaleString('es-CO')} COP (Vigencia: {r.defaultDurationDays || 7} días + Pasarela de Proveedores)
                      </option>
                    )
                  })}
                </select>

                {selectedRechargeRunway && selectedRechargePackageId !== 'none' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-amber-900 dark:text-amber-200">
                    <span>
                      Actualmente estás sumando <strong>{selectedRechargePackage?.name}</strong> +{' '}
                      <strong>{selectedRechargeRunway.title || (selectedRechargeRunway as any).titleEs}</strong>.
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedRechargePackageId('none')}
                      className="underline font-bold text-amber-800 dark:text-amber-300 hover:text-amber-600 cursor-pointer"
                    >
                      Usar únicamente esta Pasarela de Temporada (${Number(selectedRechargeRunway.campaignCostCop || 0).toLocaleString('es-CO')} COP)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Paso 1.2: Cuentas Oficiales para Transferir */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <span>🏦</span>
                <span>2. Canales Oficiales para Transferir el Pago</span>
              </h4>
              <p className="text-xs text-zinc-500">
                Transfiere exactamente <strong>${Number(rechargeAmountCop).toLocaleString('es-CO')} COP</strong> a cualquiera de las siguientes opciones oficiales:
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
                    Titular: Indie Clasificados
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
                    Titular: Indie Clasificados
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
              <div className="text-xs text-zinc-500 space-y-0.5">
                <div>
                  Monto a autorizar:{' '}
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    ${Number(rechargeAmountCop).toLocaleString('es-CO')} COP
                  </strong>
                </div>
                <div className="text-[11px] text-zinc-400">
                  {!selectedRechargePackage && selectedRechargeRunway
                    ? `Únicamente Pasarela de Temporada: "${selectedRechargeRunway.title || (selectedRechargeRunway as any).titleEs}"`
                    : selectedRechargePackage && selectedRechargeRunway
                    ? `${selectedRechargePackage.name} ($${Number(selectedRechargePackage.price).toLocaleString('es-CO')}) + "${selectedRechargeRunway.title || (selectedRechargeRunway as any).titleEs}" ($${Number(selectedRechargeRunway.campaignCostCop).toLocaleString('es-CO')})`
                    : selectedRechargePackage
                    ? `Plan Original: ${selectedRechargePackage.name}`
                    : 'Selecciona al menos un plan o pasarela'}
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingRecharge || uploadingReceipt || rechargeAmountCop <= 0}
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
                  Para diseñar y publicar tu anuncio en un Plan Original o en una Pasarela de Temporada, primero debes contar con saldo aprobado por el administrador.
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
                  <span className="text-zinc-500">Monto Mínimo Disponible:</span>
                  <span className="font-extrabold text-purple-600 dark:text-purple-400">
                    ${minRequiredPrice.toLocaleString('es-CO')} COP
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Faltante para Desbloquear:</span>
                  <span className="font-black text-red-600 dark:text-red-400">
                    ${Math.max(0, minRequiredPrice - currentBalance).toLocaleString('es-CO')} COP
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
                    <span>👈 Para adquirir saldo y desbloquear tu campaña (en un Plan Original o únicamente en una Pasarela de Temporada), utiliza la opción <strong>Recarga de Saldo</strong> en el menú lateral izquierdo.</span>
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
                  Configurar Plan de Publicidad y Lanzar Anuncio
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Puedes elegir <strong>un Plan Original</strong> (Pasarela $10.000, Gran Vitrina $20.000 o Combo $25.000), <strong>únicamente una Pasarela de Temporada</strong> (sin ligarla a un plan original), o <strong>combinar ambos</strong>. Todas se activan apenas se valida el pago y las condiciones de la pasarela.
                </p>
              </div>

              {orderErrorMsg && (
                <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900">
                  {orderErrorMsg}
                </div>
              )}

              {/* 1. Seleccionar Producto/Servicio + Estado de sus 7 días gratis iniciales */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  1. Publicación (Producto o Servicio) a Promocionar *
                </label>
                <select
                  value={selectedListingId}
                  onChange={(e) => setSelectedListingId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {publishedListings.map((l) => {
                    const ft = getListingFreeTrialStatus(l)
                    return (
                      <option key={l.id} value={l.id}>
                        {l.title} — ({l.type === 'service' ? 'Servicio' : l.type === 'article' ? 'Usado' : 'Producto'}) {l.price ? `$${Number(l.price).toLocaleString('es-CO')}` : 'Cotización'} [{ft.isFreeTrialActive ? `🎁 ${ft.daysRemaining}d gratis restantes` : 'Periodo gratis finalizado'}]
                      </option>
                    )
                  })}
                </select>

                {/* Indicador de Política de 7 Días Gratis del Producto/Servicio Seleccionado */}
                {selectedListing && selectedListingFreeTrial && (
                  <div
                    className={`rounded-2xl p-4 border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      selectedListingFreeTrial.isFreeTrialActive
                        ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
                        : 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg shrink-0">
                        {selectedListingFreeTrial.isFreeTrialActive ? '🎁' : '⏰'}
                      </span>
                      <div>
                        <div className="font-bold">
                          {selectedListingFreeTrial.isFreeTrialActive
                            ? `Beneficio Inicial Activo: ${selectedListingFreeTrial.daysRemaining} días y ${selectedListingFreeTrial.hoursRemaining}h restantes de publicidad gratis`
                            : 'El periodo inicial de 7 días de publicidad gratis ha concluido'}
                        </div>
                        <p className="mt-0.5 text-[11px] opacity-90">
                          {selectedListingFreeTrial.isFreeTrialActive
                            ? 'Tu producto o servicio fue creado recientemente y goza de 7 días iniciales gratis. Puedes adquirir un Plan Original o una Pasarela de Temporada ahora para multiplicar su alcance.'
                            : 'Activa a continuación un Plan Original, una Pasarela de Temporada independiente, o ambos para mantener tu anuncio destacado.'}
                        </p>
                      </div>
                    </div>
                    <span className="self-start sm:self-center shrink-0 rounded-full bg-white/80 dark:bg-zinc-900/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider border border-current/20">
                      {selectedListingFreeTrial.isFreeTrialActive
                        ? `Vence: ${new Date(selectedListingFreeTrial.endsAt).toLocaleDateString('es-CO')}`
                        : 'Listo para Plan Pago'}
                    </span>
                  </div>
                )}
              </div>

              {/* 2.A Seleccionar Paquete Publicitario Original (Opcional si solo se elige Pasarela de Temporada) */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    2.A Plan Publicitario Original (O elige &ldquo;Solo Pasarela de Temporada&rdquo;)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCampaignPackageId('none')
                      if (!selectedSpecialRunwayId && availableRunways.length > 0) {
                        setSelectedSpecialRunwayId(availableRunways[0].id)
                      }
                    }}
                    className={`rounded-xl px-3 py-1 text-[11px] font-bold border transition-all cursor-pointer ${
                      selectedCampaignPackageId === 'none'
                        ? 'border-amber-600 bg-amber-600 text-white shadow-2xs'
                        : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                    }`}
                  >
                    🎄 Usar únicamente Pasarela de Temporada (Sin plan original)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  {packages.map((pkg) => {
                    const isSelected = selectedCampaignPackageId === pkg.id
                    const canAfford = currentBalance >= pkg.price
                    const isCombo = pkg.categoryType === 'combo'
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() =>
                          setSelectedCampaignPackageId(
                            isSelected && selectedSpecialRunwayId ? 'none' : pkg.id
                          )
                        }
                        className={`flex flex-col justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-600 shadow-sm'
                            : isCombo
                            ? 'border-amber-300 bg-amber-50/20 dark:border-amber-800/70 dark:bg-amber-950/10 hover:border-amber-400'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                        } ${!canAfford ? 'opacity-60' : ''}`}
                      >
                        <div>
                          <div className="flex items-center justify-between w-full gap-1">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                                isCombo
                                  ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              }`}
                            >
                              {locale === 'en' ? pkg.badgeEn : pkg.badgeEs}
                            </span>
                            {!canAfford ? (
                              <span className="text-[10px] text-red-500 font-bold">Saldo insuf.</span>
                            ) : (
                              <span className="text-[11px] font-semibold text-zinc-500">
                                ⏱️ {pkg.duration_days}d
                              </span>
                            )}
                          </div>
                          <span className="mt-2 block text-xs font-black text-zinc-900 dark:text-zinc-50">
                            {locale === 'en' ? pkg.nameEn : pkg.nameEs}
                          </span>
                          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                            {locale === 'en' ? pkg.subtitleEn : pkg.subtitleEs}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-baseline justify-between">
                          <div>
                            <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                              ${Number(pkg.price).toLocaleString('es-CO')}
                            </span>
                            <span className="ml-1 text-[10px] text-zinc-400">COP</span>
                          </div>
                          {isCombo && (
                            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">
                              -$5.000
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}

                  {/* Tarjeta 4: Sin Plan Original (Únicamente Pasarela de Temporada) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCampaignPackageId('none')
                      if (!selectedSpecialRunwayId && availableRunways.length > 0) {
                        setSelectedSpecialRunwayId(availableRunways[0].id)
                      }
                    }}
                    className={`flex flex-col justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedCampaignPackageId === 'none'
                        ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-600 shadow-sm'
                        : 'border-dashed border-amber-300 bg-amber-50/20 hover:border-amber-400 dark:border-amber-800/70 dark:bg-amber-950/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between w-full gap-1">
                        <span className="inline-flex items-center rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                          🎄 Solo Temporada
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                          Independiente
                        </span>
                      </div>
                      <span className="mt-2 block text-xs font-black text-zinc-900 dark:text-zinc-50">
                        Sin Plan Original (Solo Pasarela de Temporada)
                      </span>
                      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        Activa tu anuncio únicamente en la Pasarela de Temporada elegida abajo (+ Pasarela de Proveedores), con las mismas condiciones de las pasarelas originales.
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-amber-200/70 dark:border-amber-800/60 flex items-baseline justify-between">
                      <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
                        $0 Plan Base
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        Ver 2.B ↓
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2.B Clasificación Especial de Pasarela de Temporada y Catálogo Exclusivo (Independiente o Adicional) */}
              <div className="rounded-2xl border border-amber-300 bg-amber-50/40 p-4 dark:border-amber-900/60 dark:bg-amber-950/20 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                      🎄 2.B Pasarela de Temporada y Catálogo Exclusivo (Única o Adicional al Plan Original)
                    </label>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                      La elección de Pasarela de Temporada <strong>no está obligatoriamente ligada a los planes originales</strong>: puedes elegir únicamente una Pasarela de Temporada o sumarla a un Plan Original. Apenas se valida el pago y las condiciones, se activa igual que las pasarelas originales.
                    </p>
                  </div>
                  {selectedSpecialRunway && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 dark:bg-amber-900/70 px-2.5 py-1 text-[10px] font-black text-amber-900 dark:text-amber-200">
                      {selectedCampaignPackageId === 'none' ? 'Costo Único:' : 'Costo Adicional:'} $
                      {Number(selectedSpecialRunway.campaignCostCop || 0).toLocaleString('es-CO')} COP
                    </span>
                  )}
                </div>

                <select
                  value={selectedSpecialRunwayId}
                  onChange={(e) => {
                    const nextId = e.target.value
                    setSelectedSpecialRunwayId(nextId)
                    if (!nextId && selectedCampaignPackageId === 'none') {
                      setSelectedCampaignPackageId(packages[0]?.id || '')
                    }
                  }}
                  className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-amber-800 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="">
                    — Sin Pasarela de Temporada (Usar únicamente el Plan Original seleccionado arriba) — $0 COP —
                  </option>
                  {availableRunways.map((r) => {
                    const costCop = Number(r.campaignCostCop || 0)
                    const rTitle = r.title || (r as any).titleEs || 'Pasarela de Temporada'
                    const rBadge = r.badge || (r as any).badgeEs || 'Temporada'
                    const isExplicitlyAuthorized = (r.authorizedSellerIds || []).includes(seller.id)
                    return (
                      <option key={r.id} value={r.id}>
                        {r.icon || '🎄'} {rTitle} ({rBadge}) — ${costCop.toLocaleString('es-CO')} COP ({r.defaultDurationDays || 7} días){' '}
                        {isExplicitlyAuthorized ? '[✓ Vendedor Habilitado]' : '[Se activa al validar pago y campaña]'}
                      </option>
                    )
                  })}
                </select>

                {selectedSpecialRunway && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-amber-900 dark:text-amber-200">
                    <span>
                      {selectedCampaignPackageId === 'none' ? (
                        <>
                          Modalidad activa: <strong>Únicamente Pasarela de Temporada &ldquo;{selectedSpecialRunway.title || (selectedSpecialRunway as any).titleEs}&rdquo;</strong> (sin plan original).
                        </>
                      ) : (
                        <>
                          Modalidad activa: <strong>{selectedCampaignPackage?.name}</strong> + Pasarela de Temporada <strong>&ldquo;{selectedSpecialRunway.title || (selectedSpecialRunway as any).titleEs}&rdquo;</strong>.
                        </>
                      )}
                    </span>
                    {selectedCampaignPackageId !== 'none' && (
                      <button
                        type="button"
                        onClick={() => setSelectedCampaignPackageId('none')}
                        className="underline font-bold text-amber-800 dark:text-amber-300 hover:text-amber-600 cursor-pointer"
                      >
                        Quiero únicamente esta Pasarela de Temporada (${Number(selectedSpecialRunway.campaignCostCop || 0).toLocaleString('es-CO')} COP)
                      </button>
                    )}
                  </div>
                )}
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
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="inline-block rounded-md bg-purple-100 px-1.5 py-0.5 text-[9px] font-black text-purple-700 uppercase tracking-wider dark:bg-purple-950 dark:text-purple-300">
                            Patrocinado
                          </span>
                          {selectedSpecialRunway && (
                            <span className="inline-block rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800 uppercase tracking-wider dark:bg-amber-950 dark:text-amber-300">
                              ⭐ {selectedSpecialRunway.badge || (selectedSpecialRunway as any).badgeEs}
                            </span>
                          )}
                        </div>
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
                <div className="text-xs text-zinc-500 space-y-0.5">
                  <div>
                    Costo Total: <strong>${Number(totalCampaignPrice).toLocaleString('es-CO')} COP</strong> (se descontará de tu saldo de ${currentBalance.toLocaleString('es-CO')}).
                  </div>
                  <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                    {!selectedCampaignPackage && selectedSpecialRunway ? (
                      <>
                        Únicamente Pasarela de Temporada &ldquo;{selectedSpecialRunway.title || (selectedSpecialRunway as any).titleEs}&rdquo; (${extraCatalogCost.toLocaleString('es-CO')} COP) — Sin plan original
                      </>
                    ) : selectedCampaignPackage && selectedSpecialRunway ? (
                      <>
                        Incluye {selectedCampaignPackage.name} (${basePlanCost.toLocaleString('es-CO')}) + Pasarela de Temporada &ldquo;{selectedSpecialRunway.title || (selectedSpecialRunway as any).titleEs}&rdquo; (+${extraCatalogCost.toLocaleString('es-CO')} COP)
                      </>
                    ) : selectedCampaignPackage ? (
                      <>
                        Incluye Plan Original: {selectedCampaignPackage.name} (${basePlanCost.toLocaleString('es-CO')} COP)
                      </>
                    ) : (
                      <>Selecciona al menos un Plan Original o una Pasarela de Temporada</>
                    )}
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <button
                    type="submit"
                    disabled={
                      submittingOrder ||
                      uploadingImage ||
                      totalCampaignPrice <= 0 ||
                      currentBalance < totalCampaignPrice
                    }
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
