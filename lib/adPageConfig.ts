// lib/adPageConfig.ts
// Configuración centralizada y extensible para la administración de la Página de Publicidad (Portada / Pasarelas)

export interface CustomAdminSetting {
  key: string
  label: string
  type: 'boolean' | 'number' | 'text'
  value: string | number | boolean
  description?: string
}

export type AdPagePriorityMode =
  | 'all_with_priority'
  | 'only_campaigns_and_free_trial'
  | 'only_paid_campaigns'

export type AdPagePerformancePreset = 'fast' | 'balanced' | 'extended' | 'custom'

export interface AdPageConfig {
  // 1. Límites de cantidad de publicaciones por sección en la página de publicidad
  maxHeroItems: number // Gran Vitrina Principal (Hero Runway)
  maxServicesItems: number // Pasarela de Servicios Profesionales
  maxArticlesItems: number // Pasarela de Artículos Usados
  maxProductsItems: number // Pasarela de Productos Nuevos
  maxMerchantsItems: number // Pasarela de Marcas y Comercios
  maxTotalListingsFetched: number // Límite máximo de publicaciones consultadas en BD para portada
  maxPhotosPerItem: number // Máximo de imágenes cargadas por publicación en la vitrina

  // 2. Visibilidad de secciones de la página de publicidad
  showHeroRunway: boolean
  showServicesRunway: boolean
  showArticlesRunway: boolean
  showProductsRunway: boolean
  showMerchantsRunway: boolean
  showCatalogQuickCards: boolean
  showPromotionalBanner: boolean

  // 3. Animación, tiempos de visualización y reglas de exposición
  heroAutoRotate: boolean
  heroRotationSeconds: number // Segundos entre cada transición de Gran Vitrina (ej. 5s)
  runwayAutoScroll: boolean
  runwayScrollSpeed: number // Velocidad en px/frame GPU (ej. 0.65)
  priorityMode: AdPagePriorityMode
  prioritizeVerifiedSellers: boolean

  // 4. Personalización y parámetros extensibles para futuras configuraciones
  performancePreset: AdPagePerformancePreset
  seasonalAnnouncementActive: boolean
  seasonalAnnouncementText: string
  customSettings: CustomAdminSetting[]
  updatedAt?: string
}

export const AD_PAGE_CONFIG_STORAGE_KEY = 'marketplace_ad_page_config_v1'
export const AD_PAGE_CONFIG_SLOT_ID = 'config.ad_page'

export const DEFAULT_AD_PAGE_CONFIG: AdPageConfig = {
  maxHeroItems: 5,
  maxServicesItems: 10,
  maxArticlesItems: 20,
  maxProductsItems: 20,
  maxMerchantsItems: 10,
  maxTotalListingsFetched: 60,
  maxPhotosPerItem: 5,

  showHeroRunway: true,
  showServicesRunway: true,
  showArticlesRunway: true,
  showProductsRunway: true,
  showMerchantsRunway: true,
  showCatalogQuickCards: true,
  showPromotionalBanner: true,

  heroAutoRotate: true,
  heroRotationSeconds: 5,
  runwayAutoScroll: true,
  runwayScrollSpeed: 0.65,
  priorityMode: 'all_with_priority',
  prioritizeVerifiedSellers: true,

  performancePreset: 'balanced',
  seasonalAnnouncementActive: false,
  seasonalAnnouncementText: '',
  customSettings: [
    {
      key: 'lazy_load_secondary_runways',
      label: 'Carga diferida inteligente en pasarelas secundarias',
      type: 'boolean',
      value: true,
      description: 'Optimiza el tiempo de renderizado inicial priorizando la Gran Vitrina superior.',
    },
    {
      key: 'highlight_whatsapp_cta',
      label: 'Resaltar botón directo de WhatsApp en tarjetas publicitarias',
      type: 'boolean',
      value: true,
      description: 'Destaca visualmente el botón de contacto directo en cada publicación.',
    },
    {
      key: 'max_featured_per_seller',
      label: 'Máximo de publicaciones simultáneas por mismo vendedor en vitrina',
      type: 'number',
      value: 5,
      description: 'Evita que un solo comercio monopolice todos los espacios de una misma pasarela.',
    },
  ],
}

export const AD_PAGE_PRESETS: Record<
  Exclude<AdPagePerformancePreset, 'custom'>,
  {
    nameEs: string
    nameEn: string
    badgeEs: string
    badgeEn: string
    descEs: string
    descEn: string
    values: Partial<AdPageConfig>
  }
> = {
  fast: {
    nameEs: '⚡ Visualización Rápida (Modo Ligero)',
    nameEn: '⚡ Fast Visualization (Light Mode)',
    badgeEs: 'Carga Ultrarrápida',
    badgeEn: 'Ultra-Fast Load',
    descEs:
      'Reduce la cantidad de tarjetas y fotos simultáneas en memoria para lograr una carga instantánea en móviles y conexiones lentas.',
    descEn:
      'Reduces simultaneous cards and photos in memory for instant loading on mobile and slower connections.',
    values: {
      maxHeroItems: 3,
      maxServicesItems: 6,
      maxArticlesItems: 8,
      maxProductsItems: 8,
      maxMerchantsItems: 6,
      maxTotalListingsFetched: 30,
      maxPhotosPerItem: 3,
      runwayScrollSpeed: 0.55,
      heroRotationSeconds: 6,
      performancePreset: 'fast',
    },
  },
  balanced: {
    nameEs: '⚖️ Estándar Balanceado (Recomendado)',
    nameEn: '⚖️ Balanced Standard (Recommended)',
    badgeEs: 'Equilibrado',
    badgeEn: 'Balanced',
    descEs:
      'Equilibrio ideal entre variedad comercial y fluidez a 60 FPS en todas las pasarelas de la página de publicidad.',
    descEn:
      'Ideal balance between commercial variety and 60 FPS smoothness across all advertising runways.',
    values: {
      maxHeroItems: 5,
      maxServicesItems: 10,
      maxArticlesItems: 20,
      maxProductsItems: 20,
      maxMerchantsItems: 10,
      maxTotalListingsFetched: 60,
      maxPhotosPerItem: 5,
      runwayScrollSpeed: 0.65,
      heroRotationSeconds: 5,
      performancePreset: 'balanced',
    },
  },
  extended: {
    nameEs: '🚀 Catálogo Extendido (Alta Capacidad)',
    nameEn: '🚀 Extended Catalog (High Capacity)',
    badgeEs: 'Máxima Exposición',
    badgeEn: 'Max Exposure',
    descEs:
      'Amplía el cupo de publicaciones en todas las pasarelas para temporadas altas con gran volumen de anunciantes.',
    descEn:
      'Expands publication slots across all runways for peak seasons with high advertiser volume.',
    values: {
      maxHeroItems: 8,
      maxServicesItems: 20,
      maxArticlesItems: 35,
      maxProductsItems: 35,
      maxMerchantsItems: 20,
      maxTotalListingsFetched: 120,
      maxPhotosPerItem: 8,
      runwayScrollSpeed: 0.75,
      heroRotationSeconds: 4,
      performancePreset: 'extended',
    },
  },
}

/**
 * Normaliza y combina un objeto parcial con los valores por defecto seguros
 */
export function sanitizeAdPageConfig(raw?: Partial<AdPageConfig> | null): AdPageConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_AD_PAGE_CONFIG }
  }

  const clamp = (val: any, min: number, max: number, fallback: number) => {
    const n = Number(val)
    if (isNaN(n)) return fallback
    return Math.min(max, Math.max(min, n))
  }

  return {
    maxHeroItems: Math.round(clamp(raw.maxHeroItems, 1, 20, DEFAULT_AD_PAGE_CONFIG.maxHeroItems)),
    maxServicesItems: Math.round(
      clamp(raw.maxServicesItems, 1, 60, DEFAULT_AD_PAGE_CONFIG.maxServicesItems)
    ),
    maxArticlesItems: Math.round(
      clamp(raw.maxArticlesItems, 1, 80, DEFAULT_AD_PAGE_CONFIG.maxArticlesItems)
    ),
    maxProductsItems: Math.round(
      clamp(raw.maxProductsItems, 1, 80, DEFAULT_AD_PAGE_CONFIG.maxProductsItems)
    ),
    maxMerchantsItems: Math.round(
      clamp(raw.maxMerchantsItems, 1, 50, DEFAULT_AD_PAGE_CONFIG.maxMerchantsItems)
    ),
    maxTotalListingsFetched: Math.round(
      clamp(raw.maxTotalListingsFetched, 10, 300, DEFAULT_AD_PAGE_CONFIG.maxTotalListingsFetched)
    ),
    maxPhotosPerItem: Math.round(
      clamp(raw.maxPhotosPerItem, 1, 12, DEFAULT_AD_PAGE_CONFIG.maxPhotosPerItem)
    ),

    showHeroRunway:
      typeof raw.showHeroRunway === 'boolean'
        ? raw.showHeroRunway
        : DEFAULT_AD_PAGE_CONFIG.showHeroRunway,
    showServicesRunway:
      typeof raw.showServicesRunway === 'boolean'
        ? raw.showServicesRunway
        : DEFAULT_AD_PAGE_CONFIG.showServicesRunway,
    showArticlesRunway:
      typeof raw.showArticlesRunway === 'boolean'
        ? raw.showArticlesRunway
        : DEFAULT_AD_PAGE_CONFIG.showArticlesRunway,
    showProductsRunway:
      typeof raw.showProductsRunway === 'boolean'
        ? raw.showProductsRunway
        : DEFAULT_AD_PAGE_CONFIG.showProductsRunway,
    showMerchantsRunway:
      typeof raw.showMerchantsRunway === 'boolean'
        ? raw.showMerchantsRunway
        : DEFAULT_AD_PAGE_CONFIG.showMerchantsRunway,
    showCatalogQuickCards:
      typeof raw.showCatalogQuickCards === 'boolean'
        ? raw.showCatalogQuickCards
        : DEFAULT_AD_PAGE_CONFIG.showCatalogQuickCards,
    showPromotionalBanner:
      typeof raw.showPromotionalBanner === 'boolean'
        ? raw.showPromotionalBanner
        : DEFAULT_AD_PAGE_CONFIG.showPromotionalBanner,

    heroAutoRotate:
      typeof raw.heroAutoRotate === 'boolean'
        ? raw.heroAutoRotate
        : DEFAULT_AD_PAGE_CONFIG.heroAutoRotate,
    heroRotationSeconds: Math.round(
      clamp(raw.heroRotationSeconds, 2, 30, DEFAULT_AD_PAGE_CONFIG.heroRotationSeconds)
    ),
    runwayAutoScroll:
      typeof raw.runwayAutoScroll === 'boolean'
        ? raw.runwayAutoScroll
        : DEFAULT_AD_PAGE_CONFIG.runwayAutoScroll,
    runwayScrollSpeed: Number(
      clamp(raw.runwayScrollSpeed, 0.15, 2.0, DEFAULT_AD_PAGE_CONFIG.runwayScrollSpeed).toFixed(2)
    ),
    priorityMode:
      raw.priorityMode === 'only_campaigns_and_free_trial' ||
      raw.priorityMode === 'only_paid_campaigns' ||
      raw.priorityMode === 'all_with_priority'
        ? raw.priorityMode
        : DEFAULT_AD_PAGE_CONFIG.priorityMode,
    prioritizeVerifiedSellers:
      typeof raw.prioritizeVerifiedSellers === 'boolean'
        ? raw.prioritizeVerifiedSellers
        : DEFAULT_AD_PAGE_CONFIG.prioritizeVerifiedSellers,

    performancePreset:
      raw.performancePreset === 'fast' ||
      raw.performancePreset === 'balanced' ||
      raw.performancePreset === 'extended' ||
      raw.performancePreset === 'custom'
        ? raw.performancePreset
        : DEFAULT_AD_PAGE_CONFIG.performancePreset,
    seasonalAnnouncementActive:
      typeof raw.seasonalAnnouncementActive === 'boolean'
        ? raw.seasonalAnnouncementActive
        : DEFAULT_AD_PAGE_CONFIG.seasonalAnnouncementActive,
    seasonalAnnouncementText:
      typeof raw.seasonalAnnouncementText === 'string'
        ? raw.seasonalAnnouncementText
        : DEFAULT_AD_PAGE_CONFIG.seasonalAnnouncementText,
    customSettings: Array.isArray(raw.customSettings)
      ? raw.customSettings
      : DEFAULT_AD_PAGE_CONFIG.customSettings,
    updatedAt: raw.updatedAt || new Date().toISOString(),
  }
}

/**
 * Serializa la configuración para guardarla en la tabla existente `public.ad_slot`
 * (fila `id = 'config.ad_page'`), permitiendo persistencia en base de datos sin romper esquemas previos.
 */
export function encodeAdPageConfigToSlot(config: AdPageConfig): {
  id: string
  surface: string
  formats: string[]
  max_ads: number
} {
  const clean = sanitizeAdPageConfig(config)
  return {
    id: AD_PAGE_CONFIG_SLOT_ID,
    surface: 'ad_page_settings',
    formats: [JSON.stringify(clean)],
    max_ads: clean.maxTotalListingsFetched,
  }
}

/**
 * Reconstruye la configuración a partir de las filas de `public.ad_slot`
 */
export function decodeAdPageConfigFromSlots(slots?: any[] | null): AdPageConfig {
  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    return { ...DEFAULT_AD_PAGE_CONFIG }
  }

  const configSlot = slots.find((s) => s.id === AD_PAGE_CONFIG_SLOT_ID)
  if (configSlot && Array.isArray(configSlot.formats) && configSlot.formats[0]) {
    try {
      const parsed = JSON.parse(configSlot.formats[0])
      return sanitizeAdPageConfig(parsed)
    } catch {
      // Fallback a lectura por slots individuales
    }
  }

  const heroSlot = slots.find((s) => s.id === 'home.carousel')
  const runwaySlot = slots.find((s) => s.id === 'search.top')

  return sanitizeAdPageConfig({
    maxHeroItems: heroSlot?.max_ads ?? DEFAULT_AD_PAGE_CONFIG.maxHeroItems,
    maxProductsItems: runwaySlot?.max_ads ?? DEFAULT_AD_PAGE_CONFIG.maxProductsItems,
    maxArticlesItems: runwaySlot?.max_ads ?? DEFAULT_AD_PAGE_CONFIG.maxArticlesItems,
  })
}

/**
 * Calcula métricas de impacto en velocidad de carga según la cantidad total de publicaciones activas en vitrina
 */
export function calculateVisualizationPerformance(config: AdPageConfig): {
  totalMaxCardsRendered: number
  estimatedSpeedScore: number // 1 - 100
  level: 'ultra_fast' | 'balanced' | 'heavy'
  labelEs: string
  labelEn: string
} {
  const totalMaxCardsRendered =
    (config.showHeroRunway ? config.maxHeroItems : 0) +
    (config.showServicesRunway ? config.maxServicesItems : 0) +
    (config.showArticlesRunway ? config.maxArticlesItems : 0) +
    (config.showProductsRunway ? config.maxProductsItems : 0) +
    (config.showMerchantsRunway ? config.maxMerchantsItems : 0)

  // Peso ponderado considerando tarjetas + fotos por item
  const weight = totalMaxCardsRendered * (1 + config.maxPhotosPerItem * 0.08)
  const score = Math.max(25, Math.min(99, Math.round(112 - weight * 0.45)))

  if (totalMaxCardsRendered <= 38) {
    return {
      totalMaxCardsRendered,
      estimatedSpeedScore: score,
      level: 'ultra_fast',
      labelEs: '⚡ Visualización Ultrarrápida (Carga Instantánea)',
      labelEn: '⚡ Ultra-Fast Visualization (Instant Load)',
    }
  }
  if (totalMaxCardsRendered <= 75) {
    return {
      totalMaxCardsRendered,
      estimatedSpeedScore: score,
      level: 'balanced',
      labelEs: '⚖️ Visualización Fluida y Balanceada (60 FPS)',
      labelEn: '⚖️ Smooth & Balanced Visualization (60 FPS)',
    }
  }
  return {
    totalMaxCardsRendered,
    estimatedSpeedScore: score,
    level: 'heavy',
    labelEs: '📦 Alta Densidad de Publicaciones (Catálogo Extendido)',
    labelEn: '📦 High Publication Density (Extended Catalog)',
  }
}
