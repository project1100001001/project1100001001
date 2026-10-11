'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { AppUser, Seller, AdAccount, Sale } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'
import Link from 'next/link'
import ReviewRatingModal from './ReviewRatingModal'

interface AccountProfileViewProps {
  user: {
    id: string
    email: string
    created_at: string
  }
  initialProfile: AppUser | null
  initialSeller: Seller | null
  initialAdAccount: AdAccount | null
  initialPurchases?: Sale[]
}

export default function AccountProfileView({
  user,
  initialProfile,
  initialSeller,
  initialAdAccount,
  initialPurchases = [],
}: AccountProfileViewProps) {
  const { t, locale } = useTranslation()
  const supabase = createClient()

  // State
  const [activeTab, setActiveTab] = useState<'view' | 'edit' | 'orders'>('view')
  const [profile, setProfile] = useState<AppUser | null>(initialProfile)
  const [seller, setSeller] = useState<Seller | null>(initialSeller)
  const [adAccount, setAdAccount] = useState<AdAccount | null>(initialAdAccount)
  const [purchases, setPurchases] = useState<Sale[]>(initialPurchases)
  const [ratingModalSale, setRatingModalSale] = useState<Sale | null>(null)

  // Edit fields
  const [fullName, setFullName] = useState(initialProfile?.full_name || '')
  const [phone, setPhone] = useState(initialProfile?.phone || '')
  const [city, setCity] = useState(initialProfile?.city || '')

  // Seller fields
  const [enableSellerFields, setEnableSellerFields] = useState(
    Boolean(initialSeller || initialProfile?.role === 'seller')
  )
  const [businessName, setBusinessName] = useState(initialSeller?.business_name || '')
  const [businessType, setBusinessType] = useState(initialSeller?.business_type || '')
  const [businessCity, setBusinessCity] = useState(initialSeller?.city || '')
  const [businessPhone, setBusinessPhone] = useState(initialSeller?.phone || '')
  const [businessWhatsapp, setBusinessWhatsapp] = useState(initialSeller?.whatsapp || '')
  const [businessDesc, setBusinessDesc] = useState(initialSeller?.description || '')

  // Feedback & Loading
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const currentRole = profile?.role || 'buyer'

  const roleStyles: Record<string, { label: string; badge: string; icon: string }> = {
    buyer: {
      label: t.auth.buyerRole,
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
      icon: '🛒',
    },
    seller: {
      label: t.auth.sellerRole,
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      icon: '🏪',
    },
    admin: {
      label: t.auth.adminRole,
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
      icon: '🛡️',
    },
  }

  const roleBadge = roleStyles[currentRole] || roleStyles.buyer

  const handleStartBecomeSeller = () => {
    setEnableSellerFields(true)
    setActiveTab('edit')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const willBeSeller =
        currentRole === 'seller' ||
        (enableSellerFields && businessName.trim().length > 0)

      const targetRole = currentRole === 'admin' ? 'admin' : willBeSeller ? 'seller' : 'buyer'

      // 1. Update public.app_user
      const { data: updatedProfile, error: profileErr } = await supabase
        .from('app_user')
        .update({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          city: city.trim() || null,
          role: targetRole,
        })
        .eq('id', user.id)
        .select()
        .single()

      if (profileErr) throw profileErr
      setProfile(updatedProfile as AppUser)

      // 2. Handle seller record
      if (seller) {
        // Update existing seller
        const { data: updatedSeller, error: sellerErr } = await supabase
          .from('seller')
          .update({
            business_name: businessName.trim(),
            business_type: businessType.trim() || null,
            city: businessCity.trim() || null,
            phone: businessPhone.trim() || null,
            whatsapp: businessWhatsapp.trim() || null,
            description: businessDesc.trim() || null,
          })
          .eq('id', seller.id)
          .select()
          .single()

        if (sellerErr) throw sellerErr
        setSeller(updatedSeller as Seller)
      } else if (enableSellerFields && businessName.trim()) {
        // Create new seller profile
        const { data: newSeller, error: newSellerErr } = await supabase
          .from('seller')
          .insert({
            owner_user_id: user.id,
            business_name: businessName.trim(),
            business_type: businessType.trim() || null,
            city: businessCity.trim() || null,
            phone: businessPhone.trim() || null,
            whatsapp: businessWhatsapp.trim() || null,
            description: businessDesc.trim() || null,
            verified: false,
          })
          .select()
          .single()

        if (newSellerErr) throw newSellerErr
        setSeller(newSeller as Seller)

        // Create advertiser and ad_account
        const { data: newAdv, error: advErr } = await supabase
          .from('advertiser')
          .insert({
            seller_id: newSeller.id,
            legal_name: businessName.trim(),
            status: 'active',
          })
          .select()
          .single()

        if (!advErr && newAdv) {
          const { data: newAcc } = await supabase
            .from('ad_account')
            .insert({
              advertiser_id: newAdv.id,
              balance: 0,
            })
            .select()
            .single()

          if (newAcc) {
            setAdAccount(newAcc as AdAccount)
          }
        }
      }

      setSuccessMsg(t.account.saveSuccess)
      setActiveTab('view')
    } catch (err: any) {
      setErrorMsg(err.message || t.account.saveError)
    } finally {
      setSaving(false)
    }
  }

  const initials = (profile?.full_name || user.email || 'U')
    .slice(0, 2)
    .toUpperCase()

  return (
    <main className="flex-1 bg-zinc-50/50 py-8 px-4 sm:px-6 lg:px-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Encabezado Principal */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 font-extrabold text-white text-xl shadow-md">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                    {profile?.full_name || user.email.split('@')[0]}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${roleBadge.badge}`}
                  >
                    <span>{roleBadge.icon}</span>
                    <span>{roleBadge.label}</span>
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 font-mono truncate">
                  {user.email}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  {t.account.registeredOn}: {new Date(user.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO')}
                </p>
              </div>
            </div>

            {/* Selector de pestañas / Acción de edición */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t border-zinc-100 sm:border-0 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('view')
                  setSuccessMsg(null)
                  setErrorMsg(null)
                }}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                  activeTab === 'view'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                👁️ {t.account.viewTab}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('orders')
                  setSuccessMsg(null)
                  setErrorMsg(null)
                }}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'orders'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                <span>🛍️</span>
                <span>{locale === 'en' ? 'Purchases & Reviews' : 'Compras & Calificaciones'}</span>
                {purchases.filter((p) => p.status === 'completed' && !p.has_reviewed).length > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.2 text-[9px] font-black text-white">
                    {purchases.filter((p) => p.status === 'completed' && !p.has_reviewed).length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('edit')
                  setSuccessMsg(null)
                  setErrorMsg(null)
                }}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                  activeTab === 'edit'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70'
                }`}
              >
                ✏️ {t.account.editProfileBtn}
              </button>
            </div>
          </div>
        </div>

        {/* Alerta de Calificación Obligatoria Pendiente */}
        {purchases.filter((p) => p.status === 'completed' && !p.has_reviewed).length > 0 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 dark:border-amber-900/60 dark:bg-amber-950/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⭐</span>
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {t.reviews.pendingReviewAlert} ({purchases.filter((p) => p.status === 'completed' && !p.has_reviewed).length})
                </h4>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  {t.reviews.pendingReviewDesc}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-400 shrink-0 transition-colors"
            >
              {t.reviews.rateNowBtn}
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {successMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODO 1: VISUALIZACIÓN DE INFORMACIÓN */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'view' && (
          <div className="space-y-6">
            {/* Tarjeta 1: Información Personal */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    👤 {t.account.personalInfoTitle}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {t.account.personalInfoSubtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                >
                  {t.account.editProfileBtn} →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
                  <span className="text-zinc-500 font-medium block mb-1">
                    {t.account.fullName}
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {profile?.full_name || t.account.notSpecified}
                  </span>
                </div>

                <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-zinc-500 font-medium">
                      {t.account.email}
                    </span>
                    <span className="text-[10px] text-zinc-400">🔒 Solo lectura</span>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm font-mono truncate block">
                    {user.email}
                  </span>
                </div>

                <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
                  <span className="text-zinc-500 font-medium block mb-1">
                    {t.account.phone}
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {profile?.phone || t.account.notSpecified}
                  </span>
                </div>

                <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
                  <span className="text-zinc-500 font-medium block mb-1">
                    {t.account.city}
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {profile?.city || t.account.notSpecified}
                  </span>
                </div>

                <div className="sm:col-span-2 rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="text-zinc-500 font-medium block text-[11px]">
                      {t.account.userId}
                    </span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300 text-xs">
                      {user.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {t.account.role}: <strong className="uppercase text-emerald-600 dark:text-emerald-400">{currentRole}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta 2: Perfil Comercial (Si el usuario es Vendedor) */}
            {seller ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                      <span>🏪</span>
                      <span>{t.account.businessInfoTitle}</span>
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {t.account.businessInfoSubtitle}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      seller.verified
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    <span>{seller.verified ? '✓' : '⏱️'}</span>
                    <span>{seller.verified ? t.account.verifiedBadge : t.account.unverifiedBadge}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-zinc-500 font-medium block mb-1">
                      {t.account.businessName}
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                      {seller.business_name}
                    </span>
                  </div>

                  <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-zinc-500 font-medium block mb-1">
                      {t.account.businessType}
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                      {seller.business_type || t.account.notSpecified}
                    </span>
                  </div>

                  <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-zinc-500 font-medium block mb-1">
                      {t.account.businessCity}
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                      {seller.city || t.account.notSpecified}
                    </span>
                  </div>

                  <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-zinc-500 font-medium block mb-1">
                      {t.account.businessWhatsapp}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                        {seller.whatsapp || t.account.notSpecified}
                      </span>
                      {seller.whatsapp && (
                        <a
                          href={`https://wa.me/${seller.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                        >
                          Chat ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {seller.phone && (
                    <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
                      <span className="text-zinc-500 font-medium block mb-1">
                        {t.account.businessPhone}
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm font-mono">
                        {seller.phone}
                      </span>
                    </div>
                  )}

                  {adAccount && (
                    <div className="rounded-xl bg-purple-50 p-3.5 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
                      <span className="text-purple-700 dark:text-purple-300 font-medium block mb-1">
                        {t.account.walletBalance}
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-purple-900 dark:text-purple-100 text-base">
                          $ {adAccount.balance.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')} COP
                        </span>
                        <Link
                          href="/promocionar"
                          className="rounded-lg bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-purple-500"
                        >
                          + Recargar
                        </Link>
                      </div>
                    </div>
                  )}

                  {seller.description && (
                    <div className="sm:col-span-2 rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
                      <span className="text-zinc-500 font-medium block mb-1">
                        {t.account.businessDesc}
                      </span>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-xs">
                        {seller.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : currentRole === 'buyer' ? (
              /* Tarjeta informativa para Comprador y opción de registrarse como vendedor */
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 dark:border-blue-900/40 dark:bg-blue-950/20 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🛒</span>
                  <div>
                    <h2 className="text-base font-bold text-blue-900 dark:text-blue-100">
                      {t.account.buyerNoticeTitle}
                    </h2>
                    <p className="mt-1 text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                      {t.account.buyerNoticeDesc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-white p-4 border border-blue-200 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {t.account.becomeSellerTitle}
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      {t.account.becomeSellerDesc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartBecomeSeller}
                    className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
                  >
                    🏪 {t.account.becomeSellerBtn}
                  </button>
                </div>
              </div>
            ) : currentRole === 'admin' ? (
              /* Tarjeta informativa para Administrador */
              <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-6 dark:border-purple-900/40 dark:bg-purple-950/20 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🛡️</span>
                  <div>
                    <h2 className="text-base font-bold text-purple-900 dark:text-purple-100">
                      {t.account.adminNoticeTitle}
                    </h2>
                    <p className="mt-1 text-xs text-purple-800 dark:text-purple-200 leading-relaxed">
                      {t.account.adminNoticeDesc}
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition-colors"
                  >
                    <span>⚖️</span>
                    <span>{t.account.goToAdminBtn}</span>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODO 2: FORMULARIO DE EDICIÓN DE INFORMACIÓN */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Sección 1: Datos Personales */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
              <div className="border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  👤 {t.account.personalInfoTitle}
                </h2>
                <p className="text-xs text-zinc-500">
                  {t.account.personalInfoSubtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t.account.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t.account.phone}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 573001234567"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t.account.city}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej. Bogotá, Medellín, Cali..."
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div className="sm:col-span-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/40 text-[11px] text-zinc-500">
                  <span>ℹ️ {t.account.emailNotice} ({user.email})</span>
                </div>
              </div>
            </div>

            {/* Toggle para habilitar/deshabilitar perfil de vendedor (si es comprador) */}
            {!seller && currentRole === 'buyer' && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100 block">
                    🏪 {t.account.becomeSellerTitle}
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    {enableSellerFields
                      ? 'Campos comerciales habilitados a continuación.'
                      : 'Activa esta opción para registrar tu negocio y publicar anuncios.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableSellerFields(!enableSellerFields)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    enableSellerFields
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {enableSellerFields ? 'Activado ✓' : 'Activar +'}
                </button>
              </div>
            )}

            {/* Sección 2: Datos de Negocio (si aplica) */}
            {enableSellerFields && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <div className="border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <span>🏪</span>
                    <span>{t.account.businessInfoTitle}</span>
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {t.account.businessInfoSubtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      {t.account.businessName} *
                    </label>
                    <input
                      type="text"
                      required={enableSellerFields}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Ej. Panadería San José / Taller Auto Express"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      {t.account.businessType}
                    </label>
                    <input
                      type="text"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      placeholder="Ej. Alimentos, Mecánica, Confección..."
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      {t.account.businessCity}
                    </label>
                    <input
                      type="text"
                      value={businessCity}
                      onChange={(e) => setBusinessCity(e.target.value)}
                      placeholder="Ej. Medellín, Bogotá, Cali..."
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      {t.account.businessWhatsapp} *
                    </label>
                    <input
                      type="text"
                      required={enableSellerFields}
                      value={businessWhatsapp}
                      onChange={(e) => setBusinessWhatsapp(e.target.value)}
                      placeholder="Ej. 573001234567"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      Incluye código de país (ej. 57 para Colombia)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      {t.account.businessPhone}
                    </label>
                    <input
                      type="text"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      placeholder="Ej. 6012345678"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      {t.account.businessDesc}
                    </label>
                    <textarea
                      rows={3}
                      value={businessDesc}
                      onChange={(e) => setBusinessDesc(e.target.value)}
                      placeholder="Describe qué ofrece tu negocio, especialidad y horarios de atención..."
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setActiveTab('view')}
                className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                {t.account.cancel}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{t.account.saving}</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>{t.account.saveChanges}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODO 3: HISTORIAL DE COMPRAS Y CALIFICACIONES OBLIGATORIAS */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <span>🛍️</span>
                  <span>{locale === 'en' ? 'My Purchases & Seller Ratings' : 'Mis Compras y Calificaciones de Vendedor'}</span>
                </h2>
                <p className="mt-1 text-xs text-zinc-500 max-w-xl">
                  {locale === 'en'
                    ? 'Every completed order requires your honest rating and review to establish seller reputation and ensure authentic marketplace trust.'
                    : 'Cada compra o servicio recibido requiere obligatoriamente tu calificación con estrellas y opinión para respaldar la veracidad y reputación del comercio.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {purchases.length} {locale === 'en' ? 'orders' : 'pedidos'}
                </span>
              </div>
            </div>

            {purchases.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-4xl">🛒</span>
                <h3 className="mt-3 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  {locale === 'en' ? 'No purchases registered yet' : 'Aún no registras compras o pedidos'}
                </h3>
                <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
                  {locale === 'en'
                    ? 'Explore our catalog of local products and services, and remember to rate your experience!'
                    : 'Explora nuestro catálogo de productos y servicios locales, ¡y recuerda calificar tu experiencia!'}
                </p>
                <div className="mt-4">
                  <Link
                    href="/catalogo"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500"
                  >
                    {t.nav.catalog}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {purchases.map((purchase) => {
                  const listingTitle = purchase.listing?.title || 'Artículo del Marketplace'
                  const sellerName = purchase.listing?.seller?.business_name || 'Comercio Local'
                  const isService = purchase.type === 'service'
                  const isCompleted = purchase.status === 'completed'
                  const hasReviewed = Boolean(purchase.has_reviewed)
                  const coverImage = purchase.listing?.listing_media?.[0]?.url || null

                  return (
                    <div
                      key={purchase.id}
                      className={`rounded-2xl border bg-white p-5 shadow-xs transition-all dark:bg-zinc-900 ${
                        !hasReviewed && isCompleted
                          ? 'border-amber-300 bg-amber-50/20 dark:border-amber-900/60'
                          : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                            {coverImage ? (
                              <Image
                                src={coverImage}
                                alt={listingTitle}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-2xl">
                                {isService ? '⏱️' : '📦'}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                {isService ? '⏱️ Servicio' : '📦 Producto'}
                              </span>
                              <span className="text-[11px] text-zinc-400">
                                • {new Date(purchase.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO')}
                              </span>
                            </div>

                            <h3 className="mt-1 font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                              {listingTitle}
                            </h3>

                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                              <span>
                                Vendedor: <strong className="text-zinc-800 dark:text-zinc-200">{sellerName}</strong>
                              </span>
                              <span>
                                Total: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">${Number(purchase.total_amount).toLocaleString('es-CO')} COP</strong>
                              </span>
                              <span>
                                Cant: <strong>{purchase.quantity}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Columna Derecha: Estado y Módulo Obligatorio de Calificación */}
                        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
                          {/* Estado de la Orden */}
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {isCompleted ? '✓ Completado / Entregado' : '⏳ En proceso'}
                          </span>

                          {/* Estado de Calificación */}
                          {hasReviewed ? (
                            <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1.5">
                              <span>★</span>
                              <span>{t.reviews.alreadyReviewed}</span>
                            </span>
                          ) : isCompleted ? (
                            <button
                              type="button"
                              onClick={() => setRatingModalSale(purchase)}
                              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5 animate-pulse"
                            >
                              <span>⭐</span>
                              <span>{t.reviews.rateNowBtn} (Obligatorio)</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-zinc-400 italic">
                              Podrás calificar una vez completada la entrega
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal de Calificación Activo */}
        {ratingModalSale && (
          <ReviewRatingModal
            isOpen={Boolean(ratingModalSale)}
            onClose={() => setRatingModalSale(null)}
            listingId={ratingModalSale.listing_id}
            listingTitle={ratingModalSale.listing?.title || 'Artículo del Marketplace'}
            sellerId={ratingModalSale.seller_id}
            sellerName={ratingModalSale.listing?.seller?.business_name}
            listingType={ratingModalSale.type}
            saleId={ratingModalSale.id}
            onSuccess={() => {
              setPurchases((prev) =>
                prev.map((p) =>
                  p.id === ratingModalSale.id ? { ...p, has_reviewed: true } : p
                )
              )
              setSuccessMsg(t.reviews.successNotice)
              setTimeout(() => setSuccessMsg(null), 5000)
              setRatingModalSale(null)
            }}
          />
        )}
      </div>
    </main>
  )
}
