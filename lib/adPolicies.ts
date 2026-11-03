// lib/adPolicies.ts
// Definición centralizada de las Políticas Oficiales de Publicidad y Planes Tarifarios
// Documentado en POLITICAS_PUBLICIDAD.md

import type { AdPackage, Listing } from './types'

export const FREE_INITIAL_AD_DAYS = 7
export const FREE_INITIAL_AD_PRICE = 0

export const PLAN_PASARELA_PRICE = 10000
export const PLAN_GRAN_VITRINA_PRICE = 20000
export const PLAN_COMBO_PRICE = 25000
export const PLAN_COMBO_SAVINGS =
  PLAN_PASARELA_PRICE + PLAN_GRAN_VITRINA_PRICE - PLAN_COMBO_PRICE // $5.000 COP de ahorro

export const MIN_AD_PLAN_PRICE = PLAN_PASARELA_PRICE // $10.000 COP

export type AdPlacementType =
  | 'pasarela'
  | 'gran_vitrina'
  | 'combo'
  | 'pasarela_temporada'
  | 'free_initial'

export interface OfficialAdPlan extends AdPackage {
  code: 'plan_pasarela' | 'plan_gran_vitrina' | 'plan_combo_ambas'
  categoryType: 'individual' | 'combo'
  placement: AdPlacementType
  nameEs: string
  nameEn: string
  subtitleEs: string
  subtitleEn: string
  descriptionEs: string
  descriptionEn: string
  featuresEs: string[]
  featuresEn: string[]
  badgeEs: string
  badgeEn: string
  savingsCop?: number
}

export const OFFICIAL_AD_PLANS: OfficialAdPlan[] = [
  {
    id: 'd1000000-0000-0000-0000-000000000001',
    code: 'plan_pasarela',
    categoryType: 'individual',
    placement: 'pasarela',
    name: 'Plan Individual: Pasarela',
    nameEs: 'Plan Individual: Pasarela (+ Pasarela de Proveedores)',
    nameEn: 'Individual Plan: Runway (+ Providers Runway)',
    subtitleEs: 'Exhibición en Pasarela de Rubro + Incluye Publicación en Pasarela de Proveedores',
    subtitleEn: 'Category Runway + Includes Provider Publication in Providers Runway',
    descriptionEs:
      'Destaca tu producto o servicio en la Pasarela especializada de tu rubro (Productos Nuevos, Artículos Usados o Servicios). El pago incluye la publicación destacada de tu perfil como proveedor en la Pasarela de Proveedores.',
    descriptionEn:
      'Feature your product or service in your category Runway (New Products, Used Articles, or Services). Payment includes featured publication of your business in the Providers Runway.',
    featuresEs: [
      'Presencia prioritaria en la Pasarela de tu rubro (Servicios, Usados o Nuevos)',
      '🏪 Incluye publicación del proveedor en la Pasarela de Proveedores',
      'Botón directo de contacto por WhatsApp y vigencia de 7 días administrables',
    ],
    featuresEn: [
      'Priority presence in your category Runway',
      '🏪 Includes provider publication in the Providers Runway',
      'Direct WhatsApp contact button & 7 days validity',
    ],
    badgeEs: 'Plan Individual + Proveedor',
    badgeEn: 'Individual Plan + Provider',
    slot_id: 'search.top',
    duration_days: 7,
    price: PLAN_PASARELA_PRICE,
    max_active_slots: 1,
    active: true,
  },
  {
    id: 'd1000000-0000-0000-0000-000000000002',
    code: 'plan_gran_vitrina',
    categoryType: 'individual',
    placement: 'gran_vitrina',
    name: 'Plan Individual: Gran Vitrina',
    nameEs: 'Plan Individual: Gran Vitrina (+ Pasarela de Proveedores)',
    nameEn: 'Individual Plan: Grand Showcase (+ Providers Runway)',
    subtitleEs: 'Exhibición Estelar en Gran Vitrina + Incluye Publicación en Pasarela de Proveedores',
    subtitleEn: 'Main Hero Showcase + Includes Provider Publication in Providers Runway',
    descriptionEs:
      'Posiciona tu producto o servicio en la Gran Vitrina Principal (Hero Runway) en la parte superior de la portada. Además, el pago incluye la publicación destacada de tu negocio en la Pasarela de Proveedores.',
    descriptionEn:
      'Position your product or service in the Grand Showcase (Hero Runway) at the top of the home page. Payment also includes featured publication of your business in the Providers Runway.',
    featuresEs: [
      'Ubicación privilegiada en la Gran Vitrina Principal con galería y ficha técnica',
      '🏪 Incluye publicación del proveedor en la Pasarela de Proveedores',
      'Vigencia de 7 días de máxima visibilidad administrables por medio',
    ],
    featuresEn: [
      'Prime placement in the Grand Hero Showcase with gallery & specs',
      '🏪 Includes provider publication in the Providers Runway',
      '7 days of maximum storefront visibility',
    ],
    badgeEs: 'Plan Individual + Proveedor',
    badgeEn: 'Individual Plan + Provider',
    slot_id: 'home.carousel',
    duration_days: 7,
    price: PLAN_GRAN_VITRINA_PRICE,
    max_active_slots: 1,
    active: true,
  },
  {
    id: 'd1000000-0000-0000-0000-000000000003',
    code: 'plan_combo_ambas',
    categoryType: 'combo',
    placement: 'combo',
    name: 'Plan en Combo: Gran Vitrina + Pasarela',
    nameEs: 'Plan en Combo: Gran Vitrina + Pasarela + Pasarela de Proveedores',
    nameEn: 'Combo Plan: Showcase + Runway + Providers Runway',
    subtitleEs: 'Triple presencia (Vitrina + Pasarela + Proveedores) por $25.000 COP (Ahorras $5.000)',
    subtitleEn: 'Triple placement (Showcase + Runway + Providers) for $25,000 COP (Save $5,000)',
    descriptionEs:
      'Combina todas las ubicaciones: aparece simultáneamente en la Gran Vitrina Principal, en la Pasarela de tu rubro y el pago incluye la publicación destacada de tu marca en la Pasarela de Proveedores a precio especial de combo.',
    descriptionEn:
      'Combine all placements: appear simultaneously in the Grand Showcase, your category Runway, and includes your business in the Providers Runway at a special combo price.',
    featuresEs: [
      'Incluye Gran Vitrina Principal ($20.000) + Pasarela de Rubro ($10.000)',
      '🏪 Incluye publicación destacada del proveedor en la Pasarela de Proveedores',
      'Ahorro inmediato de $5.000 COP con triple exposición durante 7 días',
    ],
    featuresEn: [
      'Includes Grand Showcase ($20,000) + Category Runway ($10,000)',
      '🏪 Includes featured provider publication in the Providers Runway',
      'Instant savings of $5,000 COP with triple exposure for 7 days',
    ],
    badgeEs: '🔥 Combo Total + Proveedor',
    badgeEn: '🔥 Full Combo + Provider',
    savingsCop: PLAN_COMBO_SAVINGS,
    slot_id: 'category.banner',
    duration_days: 7,
    price: PLAN_COMBO_PRICE,
    max_active_slots: 2,
    active: true,
  },
]

/**
 * Normaliza cualquier lista de paquetes provenientes de base de datos para garantizar
 * que siempre reflejen las políticas y tarifas oficiales vigentes:
 * - Pasarela: $10.000 COP
 * - Gran Vitrina: $20.000 COP
 * - Combo (Las dos): $25.000 COP
 */
export function normalizeToOfficialPackages(dbPackages?: AdPackage[] | null): OfficialAdPlan[] {
  if (!dbPackages || dbPackages.length === 0) {
    return OFFICIAL_AD_PLANS
  }

  return OFFICIAL_AD_PLANS.map((officialPlan) => {
    const matched = dbPackages.find(
      (p) =>
        p.id === officialPlan.id ||
        p.slot_id === officialPlan.slot_id ||
        p.price === officialPlan.price
    )
    return {
      ...officialPlan,
      id: matched?.id || officialPlan.id,
      slot_id: matched?.slot_id || officialPlan.slot_id,
      // Precios y nombres oficiales mandatorios según la política vigente
      name: officialPlan.name,
      duration_days: FREE_INITIAL_AD_DAYS,
      price: officialPlan.price,
      active: true,
    }
  })
}

/**
 * Extrae metadatos de Pasarela de Temporada desde target_category o attrs de la publicación
 */
export function extractSeasonalRunwayMeta(adOrderOrItem?: {
  target_category?: string | null
  attrs?: Record<string, any> | null
  listing?: { attrs?: Record<string, any> | null } | null
} | null): {
  isSeasonalOnly: boolean
  specialRunwayId: string | null
  specialRunwayTitle: string | null
  combinedBasePlacement: AdPlacementType | null
} {
  if (!adOrderOrItem) {
    return {
      isSeasonalOnly: false,
      specialRunwayId: null,
      specialRunwayTitle: null,
      combinedBasePlacement: null,
    }
  }

  const targetCat = String(adOrderOrItem.target_category || '').trim()
  const attrs = adOrderOrItem.listing?.attrs || adOrderOrItem.attrs || {}

  // Formato 1: [SOLO_TEMPORADA:runway_id] Título de la pasarela
  const soloMatch = targetCat.match(/^\[SOLO_TEMPORADA:([^\]]+)\]\s*(.*)$/)
  if (soloMatch) {
    return {
      isSeasonalOnly: true,
      specialRunwayId: soloMatch[1].trim() || attrs.special_runway_id || null,
      specialRunwayTitle: soloMatch[2].trim() || attrs.special_runway_title || null,
      combinedBasePlacement: null,
    }
  }

  // Formato 2: [PLAN_MAS_TEMPORADA:runway_id:base_placement] Título de la pasarela
  const combinedMatch = targetCat.match(/^\[PLAN_MAS_TEMPORADA:([^:\]]+)(?::([^\]]+))?\]\s*(.*)$/)
  if (combinedMatch) {
    const rawBase = (combinedMatch[2] || '').trim() as AdPlacementType
    const validBase: AdPlacementType | null =
      rawBase === 'combo' || rawBase === 'gran_vitrina' || rawBase === 'pasarela'
        ? rawBase
        : null
    return {
      isSeasonalOnly: false,
      specialRunwayId: combinedMatch[1].trim() || attrs.special_runway_id || null,
      specialRunwayTitle: combinedMatch[3].trim() || attrs.special_runway_title || null,
      combinedBasePlacement: validBase,
    }
  }

  // Formato 3 (retrocompatible): [PASARELA_ESPECIAL:runway_id] Título
  const legacyMatch = targetCat.match(/^\[PASARELA_ESPECIAL:([^\]]+)\]\s*(.*)$/)
  if (legacyMatch) {
    const isOnly = attrs.ad_placement === 'pasarela_temporada'
    return {
      isSeasonalOnly: isOnly,
      specialRunwayId: legacyMatch[1].trim() || attrs.special_runway_id || null,
      specialRunwayTitle: legacyMatch[2].trim() || attrs.special_runway_title || null,
      combinedBasePlacement:
        attrs.ad_placement === 'combo' ||
        attrs.ad_placement === 'gran_vitrina' ||
        attrs.ad_placement === 'pasarela'
          ? attrs.ad_placement
          : null,
    }
  }

  if (attrs.ad_placement === 'pasarela_temporada') {
    return {
      isSeasonalOnly: true,
      specialRunwayId: attrs.special_runway_id || null,
      specialRunwayTitle: attrs.special_runway_title || null,
      combinedBasePlacement: null,
    }
  }

  if (attrs.special_runway_id) {
    return {
      isSeasonalOnly: false,
      specialRunwayId: String(attrs.special_runway_id),
      specialRunwayTitle: attrs.special_runway_title ? String(attrs.special_runway_title) : null,
      combinedBasePlacement:
        attrs.ad_placement === 'combo' ||
        attrs.ad_placement === 'gran_vitrina' ||
        attrs.ad_placement === 'pasarela'
          ? attrs.ad_placement
          : null,
    }
  }

  return {
    isSeasonalOnly: false,
    specialRunwayId: null,
    specialRunwayTitle: null,
    combinedBasePlacement: null,
  }
}

/**
 * Determina qué plan y ubicación corresponde a una orden publicitaria o paquete
 */
export function resolveAdOrderPlacement(adOrderOrPkg: {
  package_id?: string | null
  price_paid?: number | null
  target_category?: string | null
  attrs?: Record<string, any> | null
  listing?: { attrs?: Record<string, any> | null } | null
  package?: { id?: string; name?: string; slot_id?: string; price?: number } | null
}): {
  placement: AdPlacementType
  planLabelEs: string
  planLabelEn: string
  price: number
} {
  const pkgId = adOrderOrPkg.package_id || adOrderOrPkg.package?.id || ''
  const pkgName = (adOrderOrPkg.package?.name || '').toLowerCase()
  const slotId = adOrderOrPkg.package?.slot_id || ''
  const pricePaid = Number(adOrderOrPkg.price_paid ?? adOrderOrPkg.package?.price ?? 0)
  const seasonalMeta = extractSeasonalRunwayMeta(adOrderOrPkg)

  // 1. Si contrató ÚNICAMENTE una Pasarela de Temporada / Adicional (sin plan original)
  if (seasonalMeta.isSeasonalOnly) {
    const seasonalPrice =
      pricePaid > 0
        ? pricePaid
        : Number(
            adOrderOrPkg.listing?.attrs?.special_catalog_cost ||
              adOrderOrPkg.attrs?.special_catalog_cost ||
              15000
          )
    const titleLabel = seasonalMeta.specialRunwayTitle
      ? `: ${seasonalMeta.specialRunwayTitle}`
      : ''
    return {
      placement: 'pasarela_temporada',
      planLabelEs: `🎄 Plan Pasarela de Temporada${titleLabel} ($${seasonalPrice.toLocaleString('es-CO')})`,
      planLabelEn: `🎄 Seasonal Runway Plan${titleLabel} ($${seasonalPrice.toLocaleString('en-US')})`,
      price: seasonalPrice,
    }
  }

  // 2. Si combinó un Plan Original + Pasarela de Temporada
  if (seasonalMeta.combinedBasePlacement && seasonalMeta.specialRunwayId) {
    const basePlacement = seasonalMeta.combinedBasePlacement
    const seasonalSuffixEs = seasonalMeta.specialRunwayTitle
      ? ` + 🎄 ${seasonalMeta.specialRunwayTitle}`
      : ' + 🎄 Pasarela de Temporada'
    const seasonalSuffixEn = seasonalMeta.specialRunwayTitle
      ? ` + 🎄 ${seasonalMeta.specialRunwayTitle}`
      : ' + 🎄 Seasonal Runway'
    const totalPaid = pricePaid > 0 ? pricePaid : PLAN_PASARELA_PRICE

    if (basePlacement === 'combo') {
      return {
        placement: 'combo',
        planLabelEs: `🔥 Plan en Combo${seasonalSuffixEs} ($${totalPaid.toLocaleString('es-CO')})`,
        planLabelEn: `🔥 Combo Plan${seasonalSuffixEn} ($${totalPaid.toLocaleString('en-US')})`,
        price: totalPaid,
      }
    }
    if (basePlacement === 'gran_vitrina') {
      return {
        placement: 'gran_vitrina',
        planLabelEs: `✨ Gran Vitrina${seasonalSuffixEs} ($${totalPaid.toLocaleString('es-CO')})`,
        planLabelEn: `✨ Grand Showcase${seasonalSuffixEn} ($${totalPaid.toLocaleString('en-US')})`,
        price: totalPaid,
      }
    }
    return {
      placement: 'pasarela',
      planLabelEs: `🛍️ Pasarela${seasonalSuffixEs} ($${totalPaid.toLocaleString('es-CO')})`,
      planLabelEn: `🛍️ Runway${seasonalSuffixEn} ($${totalPaid.toLocaleString('en-US')})`,
      price: totalPaid,
    }
  }

  if (pricePaid === 0 || slotId === 'free.initial' || pkgName.includes('gratis')) {
    return {
      placement: 'free_initial',
      planLabelEs: '🎁 Publicidad Gratis Inicial (7 días)',
      planLabelEn: '🎁 Initial Free Ad (7 days)',
      price: 0,
    }
  }

  if (
    pkgId === 'd1000000-0000-0000-0000-000000000003' ||
    pkgName.includes('combo') ||
    slotId === 'category.banner' ||
    pricePaid === PLAN_COMBO_PRICE ||
    (pricePaid >= 25000 && !seasonalMeta.specialRunwayId)
  ) {
    return {
      placement: 'combo',
      planLabelEs: '🔥 Plan en Combo: Gran Vitrina + Pasarela ($25.000)',
      planLabelEn: '🔥 Combo Plan: Grand Showcase + Runway ($25,000)',
      price: PLAN_COMBO_PRICE,
    }
  }

  if (
    pkgId === 'd1000000-0000-0000-0000-000000000002' ||
    pkgName.includes('vitrina') ||
    slotId === 'home.carousel' ||
    pricePaid === PLAN_GRAN_VITRINA_PRICE
  ) {
    return {
      placement: 'gran_vitrina',
      planLabelEs: '✨ Plan Individual: Gran Vitrina ($20.000)',
      planLabelEn: '✨ Individual Plan: Grand Showcase ($20,000)',
      price: PLAN_GRAN_VITRINA_PRICE,
    }
  }

  return {
    placement: 'pasarela',
    planLabelEs: '🛍️ Plan Individual: Pasarela ($10.000)',
    planLabelEn: '🛍️ Individual Plan: Runway ($10,000)',
    price: PLAN_PASARELA_PRICE,
  }
}

export interface FreeTrialStatus {
  isFreeTrialActive: boolean
  daysRemaining: number
  hoursRemaining: number
  startsAt: string
  endsAt: string
  progressPercent: number
}

/**
 * Calcula el estado de los 7 días iniciales de publicidad gratis de un producto o servicio
 */
export function getListingFreeTrialStatus(
  listing: Pick<Listing, 'created_at' | 'published_at' | 'attrs'>
): FreeTrialStatus {
  const attrs = listing.attrs || {}
  const baseStartStr =
    attrs.free_ad_starts_at || listing.published_at || listing.created_at || new Date().toISOString()
  const startDate = new Date(baseStartStr)
  const startMs = isNaN(startDate.getTime()) ? Date.now() : startDate.getTime()

  const totalDurationMs = FREE_INITIAL_AD_DAYS * 24 * 60 * 60 * 1000
  let endMs = startMs + totalDurationMs

  if (attrs.free_ad_ends_at) {
    const parsedEnd = new Date(attrs.free_ad_ends_at).getTime()
    if (!isNaN(parsedEnd)) {
      endMs = parsedEnd
    }
  }

  const nowMs = Date.now()
  const diffMs = endMs - nowMs

  if (diffMs <= 0) {
    return {
      isFreeTrialActive: false,
      daysRemaining: 0,
      hoursRemaining: 0,
      startsAt: new Date(startMs).toISOString(),
      endsAt: new Date(endMs).toISOString(),
      progressPercent: 100,
    }
  }

  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const hoursRemaining = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const elapsedMs = Math.max(0, totalDurationMs - diffMs)
  const progressPercent = Math.min(100, Math.max(5, Math.round((elapsedMs / totalDurationMs) * 100)))

  return {
    isFreeTrialActive: true,
    daysRemaining: Math.min(FREE_INITIAL_AD_DAYS, daysRemaining),
    hoursRemaining,
    startsAt: new Date(startMs).toISOString(),
    endsAt: new Date(endMs).toISOString(),
    progressPercent,
  }
}

/**
 * Genera los atributos iniciales de 7 días de publicidad gratuita al crear un producto o servicio
 */
export function buildInitialFreeAdAttrs(existingAttrs: Record<string, any> = {}): Record<string, any> {
  const now = new Date()
  const endsAt = new Date(now.getTime() + FREE_INITIAL_AD_DAYS * 24 * 60 * 60 * 1000)

  return {
    ...existingAttrs,
    free_trial_days: FREE_INITIAL_AD_DAYS,
    free_ad_starts_at: existingAttrs.free_ad_starts_at || now.toISOString(),
    free_ad_ends_at: existingAttrs.free_ad_ends_at || endsAt.toISOString(),
    ad_policy: '7_days_free_initial',
  }
}

export interface AdOrderTimeStatus {
  daysRemaining: number
  hoursRemaining: number
  isExpired: boolean
  startsAt: string
  endsAt: string
  progressPercent: number
}

/**
 * Calcula el tiempo restante exacto de una orden publicitaria (ad_order)
 */
export function getAdOrderTimeStatus(order: {
  starts_at?: string | null
  ends_at?: string | null
  submitted_at?: string | null
  created_at?: string | null
  status?: string | null
  package?: { duration_days?: number | null } | null
}): AdOrderTimeStatus {
  const durationDays = Number(order.package?.duration_days || FREE_INITIAL_AD_DAYS)
  const totalDurationMs = durationDays * 24 * 60 * 60 * 1000

  const baseStartStr =
    order.starts_at || order.submitted_at || order.created_at || new Date().toISOString()
  const parsedStart = new Date(baseStartStr).getTime()
  const startMs = isNaN(parsedStart) ? Date.now() : parsedStart

  let endMs = startMs + totalDurationMs
  if (order.ends_at) {
    const parsedEnd = new Date(order.ends_at).getTime()
    if (!isNaN(parsedEnd)) {
      endMs = parsedEnd
    }
  }

  // Si aún está en revisión (submitted / in_review), su reloj completo de 7 días está íntegro para iniciar
  if (order.status === 'submitted' || order.status === 'in_review') {
    return {
      daysRemaining: durationDays,
      hoursRemaining: 0,
      isExpired: false,
      startsAt: new Date(startMs).toISOString(),
      endsAt: new Date(Date.now() + totalDurationMs).toISOString(),
      progressPercent: 0,
    }
  }

  const nowMs = Date.now()
  const diffMs = endMs - nowMs

  if (diffMs <= 0 || order.status === 'ended' || order.status === 'cancelled') {
    return {
      daysRemaining: 0,
      hoursRemaining: 0,
      isExpired: true,
      startsAt: new Date(startMs).toISOString(),
      endsAt: new Date(endMs).toISOString(),
      progressPercent: 100,
    }
  }

  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hoursRemaining = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const effectiveDays = daysRemaining === 0 && hoursRemaining > 0 ? 0 : daysRemaining
  const elapsedMs = Math.max(0, totalDurationMs - diffMs)
  const progressPercent = Math.min(100, Math.max(5, Math.round((elapsedMs / totalDurationMs) * 100)))

  return {
    daysRemaining: effectiveDays,
    hoursRemaining,
    isExpired: false,
    startsAt: new Date(startMs).toISOString(),
    endsAt: new Date(endMs).toISOString(),
    progressPercent,
  }
}

export interface IndependentMediumItemState {
  enabled: boolean
  endsAt: string
  daysRemaining: number
  hoursRemaining: number
  isExpired: boolean
}

export interface PublicationRunwayStates {
  vitrina: IndependentMediumItemState
  pasarela: IndependentMediumItemState
  proveedores: IndependentMediumItemState
  customRunways: Record<string, IndependentMediumItemState>
}

export const INDEPENDENT_RUNWAY_OVERRIDES_KEY = 'ic_independent_runway_overrides_v1'

/**
 * Calcula el dato independiente y administrable para cada pasarela (Gran Vitrina, Pasarela de Publicación,
 * Pasarela de Proveedores y Pasarelas Adicionales de Temporada/Expansión)
 */
export function resolveIndependentRunwayStates(
  orderOrListing: {
    id: string
    placement?: AdPlacementType
    startsAt?: string
    endsAt?: string
    attrs?: Record<string, any> | null
    isPaid?: boolean
  },
  localOverrides?: Record<string, any>
): PublicationRunwayStates {
  const baseEndsAt =
    orderOrListing.endsAt ||
    new Date(Date.now() + FREE_INITIAL_AD_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const placement = orderOrListing.placement || 'pasarela'
  const attrsOverrides = orderOrListing.attrs?.runway_independent_status || {}
  const itemOverrides = {
    ...attrsOverrides,
    ...(localOverrides?.[orderOrListing.id] || {}),
  }

  const computeState = (
    mediumKey: string,
    defaultEnabled: boolean
  ): IndependentMediumItemState => {
    const custom = itemOverrides[mediumKey]
    const enabled = custom?.enabled !== undefined ? Boolean(custom.enabled) : defaultEnabled
    const targetEndsAt = custom?.endsAt || baseEndsAt
    const endMs = new Date(targetEndsAt).getTime()
    const validEndMs = isNaN(endMs)
      ? Date.now() + FREE_INITIAL_AD_DAYS * 24 * 60 * 60 * 1000
      : endMs
    const diffMs = validEndMs - Date.now()

    if (diffMs <= 0) {
      return {
        enabled: false,
        endsAt: new Date(validEndMs).toISOString(),
        daysRemaining: 0,
        hoursRemaining: 0,
        isExpired: true,
      }
    }

    const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hoursRemaining = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    return {
      enabled,
      endsAt: new Date(validEndMs).toISOString(),
      daysRemaining,
      hoursRemaining,
      isExpired: false,
    }
  }

  const defaultVitrina =
    placement === 'gran_vitrina' || placement === 'combo' || placement === 'free_initial'
  const defaultPasarela =
    placement === 'pasarela' || placement === 'combo' || placement === 'free_initial'
  // El pago de cualquier plan incluye la publicación del proveedor en la Pasarela de Proveedores
  const defaultProveedores = true

  const customRunwaysMap: Record<string, IndependentMediumItemState> = {}

  // Si la campaña o publicación contrató una Pasarela de Temporada / Especial, se activa por defecto con la misma vigencia
  const defaultSpecialRunwayId = orderOrListing.attrs?.special_runway_id
    ? String(orderOrListing.attrs.special_runway_id)
    : null
  if (defaultSpecialRunwayId) {
    const endMs = new Date(baseEndsAt).getTime()
    const validEndMs = isNaN(endMs)
      ? Date.now() + FREE_INITIAL_AD_DAYS * 24 * 60 * 60 * 1000
      : endMs
    const diffMs = validEndMs - Date.now()
    customRunwaysMap[defaultSpecialRunwayId] = {
      enabled: diffMs > 0,
      endsAt: new Date(validEndMs).toISOString(),
      daysRemaining: diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0,
      hoursRemaining:
        diffMs > 0 ? Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) : 0,
      isExpired: diffMs <= 0,
    }
  }

  if (itemOverrides.customRunways && typeof itemOverrides.customRunways === 'object') {
    for (const [rId, rVal] of Object.entries(itemOverrides.customRunways as Record<string, any>)) {
      const endMs = new Date(rVal?.endsAt || baseEndsAt).getTime()
      const validEndMs = isNaN(endMs)
        ? Date.now() + FREE_INITIAL_AD_DAYS * 24 * 60 * 60 * 1000
        : endMs
      const diffMs = validEndMs - Date.now()
      customRunwaysMap[rId] = {
        enabled: diffMs > 0 && Boolean(rVal?.enabled),
        endsAt: new Date(validEndMs).toISOString(),
        daysRemaining: diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0,
        hoursRemaining:
          diffMs > 0 ? Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) : 0,
        isExpired: diffMs <= 0,
      }
    }
  }

  return {
    vitrina: computeState('vitrina', defaultVitrina),
    pasarela: computeState('pasarela', defaultPasarela),
    proveedores: computeState('proveedores', defaultProveedores),
    customRunways: customRunwaysMap,
  }
}

/**
 * Claves internas exclusivas del vendedor / administración publicitaria que NUNCA
 * deben mostrarse a compradores sin registro ni a perfiles de comprador.
 */
export const INTERNAL_LISTING_ATTR_KEYS = new Set([
  'free_trial_days',
  'free_ad_starts_at',
  'free_ad_ends_at',
  'ad_policy',
  'ad_placement',
  'runway_independent_status',
  'custom_runways',
  'special_runway_id',
  'special_runway_badge',
  'special_catalog_cost',
  'price_history',
  'campaign_id',
  'campaign_plan',
  'internal_notes',
  'moderation_notes',
])

const PUBLIC_ATTR_LABELS_ES: Record<string, string> = {
  special_runway_title: 'Catálogo Exclusivo / Pasarela',
  condition: 'Condición / Estado',
  condicion: 'Condición / Estado',
  delivery_method: 'Método de Entrega',
  metodo_entrega: 'Método de Entrega',
  modality: 'Modalidad de Atención',
  modalidad: 'Modalidad de Atención',
  lead_time: 'Tiempo de Respuesta / Entrega',
  tiempo_entrega: 'Tiempo de Respuesta / Entrega',
  disponibilidad: 'Disponibilidad',
  duracion: 'Duración Estimada',
  tiempo_estimado: 'Duración Estimada',
  capacidad_diaria: 'Capacidad de Atención (Cupos/día)',
  notas_servicio: 'Condiciones e Instrucciones para el Cliente',
  garantia: 'Garantía',
  warranty: 'Garantía',
  marca: 'Marca',
  brand: 'Marca',
  modelo: 'Modelo',
  model: 'Modelo',
}

const PUBLIC_ATTR_LABELS_EN: Record<string, string> = {
  special_runway_title: 'Exclusive Catalog / Runway',
  condition: 'Condition',
  condicion: 'Condition',
  delivery_method: 'Delivery Method',
  metodo_entrega: 'Delivery Method',
  modality: 'Service Modality',
  modalidad: 'Service Modality',
  lead_time: 'Response / Delivery Time',
  tiempo_entrega: 'Response / Delivery Time',
  disponibilidad: 'Availability',
  duracion: 'Estimated Duration',
  tiempo_estimado: 'Estimated Duration',
  capacidad_diaria: 'Daily Capacity (Slots/day)',
  notas_servicio: 'Client Instructions & Terms',
  garantia: 'Warranty',
  warranty: 'Warranty',
  marca: 'Brand',
  brand: 'Brand',
  modelo: 'Model',
  model: 'Model',
}

/**
 * Filtra y formatea únicamente los atributos públicos pensados para el comprador,
 * excluyendo tiempos de publicidad, políticas de anuncios e historiales internos del vendedor.
 */
export function getPublicListingSpecs(
  attrs: Record<string, any> | null | undefined,
  locale: string = 'es'
): Array<{ key: string; label: string; value: string }> {
  if (!attrs || typeof attrs !== 'object') return []

  const labelMap = locale === 'en' ? PUBLIC_ATTR_LABELS_EN : PUBLIC_ATTR_LABELS_ES
  const seenLabels = new Set<string>()
  const result: Array<{ key: string; label: string; value: string }> = []

  for (const [rawKey, rawVal] of Object.entries(attrs)) {
    const normalizedKey = rawKey.trim().toLowerCase()

    // Excluir metadatos internos o de tiempo de publicidad exclusivos del vendedor
    if (
      INTERNAL_LISTING_ATTR_KEYS.has(normalizedKey) ||
      normalizedKey.startsWith('free_') ||
      normalizedKey.startsWith('ad_') ||
      normalizedKey.startsWith('internal_')
    ) {
      continue
    }

    // Excluir valores nulos, vacíos u objetos complejos internos (como arrays de historial)
    if (
      rawVal === null ||
      rawVal === undefined ||
      rawVal === '' ||
      typeof rawVal === 'object'
    ) {
      continue
    }

    const label =
      labelMap[normalizedKey] ||
      rawKey
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())

    // Evitar duplicados cuando existen claves sinónimas (ej. duracion y tiempo_estimado con el mismo valor)
    const dedupKey = `${label.toLowerCase()}::${String(rawVal).trim().toLowerCase()}`
    if (seenLabels.has(dedupKey)) continue
    seenLabels.add(dedupKey)

    result.push({
      key: rawKey,
      label,
      value: String(rawVal),
    })
  }

  return result
}

