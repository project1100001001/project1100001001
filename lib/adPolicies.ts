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

export type AdPlacementType = 'pasarela' | 'gran_vitrina' | 'combo' | 'free_initial'

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
    nameEs: 'Plan Individual: Pasarela',
    nameEn: 'Individual Plan: Runway',
    subtitleEs: 'Exhibición en Pasarela de Rubro + Pasarela de Vendedores',
    subtitleEn: 'Category & Sellers Runway Placement',
    descriptionEs:
      'Destaca tu producto o servicio en la Pasarela especializada de tu rubro (Productos Nuevos, Artículos Usados o Servicios) y posiciona tu negocio en la Pasarela de Vendedores / Comercios.',
    descriptionEn:
      'Feature your product or service in your category Runway (New Products, Used Articles, or Services) and highlight your business in the Sellers / Merchants Runway.',
    featuresEs: [
      'Presencia prioritaria en Pasarela de tu rubro y Pasarela de Vendedores',
      'Botón directo de contacto por WhatsApp',
      'Vigencia de 7 días de exhibición patrocinada',
    ],
    featuresEn: [
      'Priority presence in your category Runway & Sellers Runway',
      'Direct WhatsApp contact button',
      '7 days of sponsored showcase validity',
    ],
    badgeEs: 'Plan Individual',
    badgeEn: 'Individual Plan',
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
    nameEs: 'Plan Individual: Gran Vitrina',
    nameEn: 'Individual Plan: Grand Showcase',
    subtitleEs: 'Exhibición Estelar en Portada Principal',
    subtitleEn: 'Main Hero Showcase Placement',
    descriptionEs:
      'Posiciona tu producto o servicio en la Gran Vitrina Principal (Hero Runway) en la parte superior de la portada con galería y ficha técnica.',
    descriptionEn:
      'Position your product or service in the Grand Showcase (Hero Runway) at the top of the home page with photo gallery and specs.',
    featuresEs: [
      'Ubicación privilegiada en la Gran Vitrina Principal',
      'Galería interactiva, precio y botón de WhatsApp',
      'Vigencia de 7 días de máxima visibilidad',
    ],
    featuresEn: [
      'Prime placement in the Grand Hero Showcase',
      'Interactive gallery, price & WhatsApp button',
      '7 days of maximum storefront visibility',
    ],
    badgeEs: 'Plan Individual',
    badgeEn: 'Individual Plan',
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
    nameEs: 'Plan en Combo: Gran Vitrina + Pasarela',
    nameEn: 'Combo Plan: Grand Showcase + Runway',
    subtitleEs: 'Las dos ubicaciones por $25.000 COP (Ahorras $5.000)',
    subtitleEn: 'Both placements for $25,000 COP (Save $5,000)',
    descriptionEs:
      'Combina las dos ubicaciones: aparece simultáneamente en la Gran Vitrina Principal y en la Pasarela de tu categoría a precio especial de combo.',
    descriptionEn:
      'Combine both placements: appear simultaneously in the Grand Showcase and in your category Runway at a special combo price.',
    featuresEs: [
      'Incluye Gran Vitrina Principal ($20.000) + Pasarela ($10.000)',
      'Ahorro inmediato de $5.000 COP en el paquete',
      'Doble exposición simultánea durante 7 días',
    ],
    featuresEn: [
      'Includes Grand Showcase ($20,000) + Runway ($10,000)',
      'Instant savings of $5,000 COP on the bundle',
      'Double simultaneous exposure for 7 days',
    ],
    badgeEs: '🔥 Plan en Combo (Las dos)',
    badgeEn: '🔥 Combo Plan (Both)',
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
 * Determina qué plan y ubicación corresponde a una orden publicitaria o paquete
 */
export function resolveAdOrderPlacement(adOrderOrPkg: {
  package_id?: string | null
  price_paid?: number | null
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
    pricePaid >= 25000
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
  'price_history',
  'campaign_id',
  'campaign_plan',
  'internal_notes',
  'moderation_notes',
])

const PUBLIC_ATTR_LABELS_ES: Record<string, string> = {
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

