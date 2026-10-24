'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface AvantGardeLoaderProps {
  /** Texto principal o módulo que se está cargando */
  title?: string
  /** Subtítulo técnico o descriptivo */
  subtitle?: string
  /** Si se muestra como pantalla de carga completa dentro del área central o como HUD compacto */
  variant?: 'full' | 'overlay'
}

const LOADING_PHASES = [
  'Sincronizando pasarelas de Indie Clasificados...',
  'Conectando comercios, servicios y ofertas verificadas...',
  'Conexión activa con usuarios viendo los productos...',
  'Optimizando vitrina comercial en tiempo real...',
]

/**
 * Núcleo Visual Vanguardista:
 * Combina anillos giroscópicos 3D cuánticos (inspirados en uiball/ldrs Quantum & Miyagi)
 * con un filtro SVG Liquid Gooey Metaball (<feGaussianBlur> + <feColorMatrix>) en el núcleo.
 */
export function QuantumGooeyCore({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const isSmall = size === 'sm'
  const boxClass = isSmall ? 'h-14 w-14' : 'h-28 w-28 sm:h-32 sm:w-32'

  return (
    <div className={`relative flex items-center justify-center select-none ${boxClass}`}>
      {/* SVG Filter oculto para efecto Liquid Gooey Metaball */}
      <svg className="sr-only" aria-hidden="true">
        <defs>
          <filter id="ic-liquid-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Halo de energía ambiental */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/25 via-purple-500/25 to-indigo-500/25 blur-xl animate-pulse" />

      {/* Anillo Cuántico 1 (Esmeralda - Giroscopio 3D CW) */}
      <div
        className="ic-orbit-ring-1 absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 border-r-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.45)]"
      />

      {/* Anillo Cuántico 2 (Púrpura - Giroscopio 3D CCW) */}
      <div
        className="ic-orbit-ring-2 absolute inset-1.5 rounded-full border-2 border-transparent border-b-purple-400 border-l-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.45)]"
      />

      {/* Anillo Cuántico 3 (Índigo/Cian - Giroscopio Diagonal) */}
      <div
        className="ic-orbit-ring-3 absolute inset-3 rounded-full border-2 border-transparent border-t-indigo-400 border-l-cyan-400/70 shadow-[0_0_12px_rgba(99,102,241,0.4)]"
      />

      {/* Núcleo de electrones orbitando sin insignia central */}
      <div
        style={{ filter: 'url(#ic-liquid-gooey)' }}
        className="relative flex h-full w-full items-center justify-center"
      >
        <span
          className={`ic-blob-1 absolute rounded-full bg-emerald-400/90 shadow-[0_0_12px_rgba(16,185,129,0.8)] ${
            isSmall ? 'h-3 w-3' : 'h-5 w-5'
          }`}
        />
        <span
          className={`ic-blob-2 absolute rounded-full bg-purple-500/90 shadow-[0_0_12px_rgba(168,85,247,0.8)] ${
            isSmall ? 'h-3 w-3' : 'h-5 w-5'
          }`}
        />
        <span
          className={`rounded-full bg-cyan-400/90 shadow-[0_0_14px_rgba(34,211,238,0.9)] animate-pulse ${
            isSmall ? 'h-2 w-2' : 'h-3.5 w-3.5'
          }`}
        />
      </div>
    </div>
  )
}

interface RouteContextInfo {
  badge: string
  title: string
  description: string
  guideTip: string
}

// Almacena la última ruta clicada para que tanto el HUD flotante como loading.tsx conozcan el destino exacto al instante
let lastPendingHref: string | null = null

/**
 * Resuelve el título, la descripción de lo que el usuario encontrará en el enlace
 * y una guía rápida para hacer la navegación 100% intuitiva.
 */
export function resolveRouteContext(href: string): RouteContextInfo {
  const cleanHref = href || '/'

  if (cleanHref.startsWith('/catalogo')) {
    if (cleanHref.includes('type=service')) {
      return {
        badge: '🛠️ Catálogo de Servicios',
        title: 'Servicios Profesionales y Oficios',
        description:
          'Encontrarás técnicos, asesorías, mantenimiento, transporte y soluciones locales listas para contratar.',
        guideTip:
          '💡 Guía: Filtra por tu ciudad y pulsa el botón de WhatsApp para cotizar directo con el profesional.',
      }
    }
    if (cleanHref.includes('type=article')) {
      return {
        badge: '📦 Artículos Usados',
        title: 'Artículos de Segunda Mano y Oportunidades',
        description:
          'Encontrarás artículos usados en buen estado, fotos reales y precios negociables publicados por vendedores locales.',
        guideTip:
          '💡 Guía: Alterna entre vista Cuadrícula o Lista y toca cualquier anuncio para ver todas sus fotos.',
      }
    }
    if (cleanHref.includes('type=product')) {
      return {
        badge: '✨ Productos Nuevos',
        title: 'Productos Nuevos de Pymes y Emprendedores',
        description:
          'Encontrarás productos nuevos con disponibilidad inmediata, precios directos y comercios verificados.',
        guideTip:
          '💡 Guía: Revisa las especificaciones del producto y haz tu pedido por WhatsApp sin intermediarios.',
      }
    }
    if (/^\/catalogo\/[^/?#]+/.test(cleanHref)) {
      return {
        badge: '🔎 Ficha del Anuncio',
        title: 'Detalle Completo de la Publicación',
        description:
          'Verás la galería de fotos, características técnicas, ubicación, datos del vendedor y contacto directo.',
        guideTip:
          '💡 Guía: Revisa las fotos y pulsa "Contactar por WhatsApp" para hablar de inmediato con el anunciante.',
      }
    }
    return {
      badge: '🔍 Explorador Comercial',
      title: 'Catálogo General de Indie Clasificados',
      description:
        'Encontrarás todas las publicaciones activas con buscador inteligente por categoría, ciudad y rango de precio.',
      guideTip:
        '💡 Guía: Usa los filtros superiores para encontrar rápidamente servicios, artículos o productos.',
    }
  }

  if (cleanHref.startsWith('/directorio')) {
    return {
      badge: '📇 Directorio Comercial',
      title: 'Directorio de Vendedores y Comercios',
      description:
        'Encontrarás los perfiles de pymes, emprendedores y profesionales con su calificación, ciudad y catálogo.',
      guideTip:
        '💡 Guía: Explora las tiendas verificadas o pulsa en un vendedor para ver todas sus ofertas activas.',
    }
  }

  if (cleanHref.startsWith('/publicar')) {
    if (cleanHref.includes('type=service')) {
      return {
        badge: '🛠️ Nueva Publicación',
        title: 'Publicar un Servicio Profesional',
        description:
          'Formulario guiado para describir tu servicio, definir tu tarifa o cotización, cobertura y WhatsApp.',
        guideTip:
          '💡 Guía: Agrega un título claro y fotos de tu trabajo para generar mayor confianza en los clientes.',
      }
    }
    if (cleanHref.includes('type=article')) {
      return {
        badge: '📦 Nueva Publicación',
        title: 'Publicar un Artículo Usado',
        description:
          'Formulario paso a paso para subir fotos reales de tu artículo, detallar su estado y fijar el precio.',
        guideTip:
          '💡 Guía: Incluye varias fotos nítidas para que los compradores conozcan el estado real del artículo.',
      }
    }
    return {
      badge: '✨ Nueva Publicación',
      title: 'Publicar un Producto en el Catálogo',
      description:
        'Estudio de publicación para crear la ficha de tu producto con fotos, precio, categoría y contacto directo.',
      guideTip:
        '💡 Guía: Al publicar obtienes exhibición inicial para que los compradores te contacten al instante.',
    }
  }

  if (cleanHref.startsWith('/mis-publicaciones') || cleanHref.startsWith('/inventario')) {
    return {
      badge: '📦 Gestión de Inventario',
      title: 'Mis Publicaciones e Inventario',
      description:
        'Encontrarás el listado de tus anuncios para editar precios, actualizar fotos, pausar o impulsar su visibilidad.',
      guideTip:
        '💡 Guía: Usa los controles de cada tarjeta para editar tu anuncio o crearle una campaña publicitaria.',
    }
  }

  if (cleanHref.startsWith('/mis-servicios')) {
    return {
      badge: '🛠️ Gestión de Servicios',
      title: 'Panel de Mis Servicios Publicados',
      description:
        'Encontrarás tus servicios activos para actualizar tarifas, horarios de atención y estado de publicación.',
      guideTip:
        '💡 Guía: Mantén tu información al día para recibir solicitudes de clientes por WhatsApp.',
    }
  }

  if (cleanHref.startsWith('/mis-campanas')) {
    return {
      badge: '📈 Rendimiento Publicitario',
      title: 'Mis Campañas y Estadísticas',
      description:
        'Encontrarás el estado de tus anuncios promocionados, tiempo restante de exhibición, vistas y clics a WhatsApp.',
      guideTip:
        '💡 Guía: Monitorea el impacto de tu pauta y renueva las campañas con mejor conversión.',
    }
  }

  if (cleanHref.startsWith('/promocionar')) {
    if (cleanHref.includes('tab=recharge')) {
      return {
        badge: '💳 Billetera Comercial',
        title: 'Recarga de Saldo Publicitario',
        description:
          'Encontrarás las opciones para recargar créditos en tu billetera y activar promociones en las pasarelas.',
        guideTip:
          '💡 Guía: Elige el monto deseado y registra tu recarga para impulsar tus publicaciones.',
      }
    }
    return {
      badge: '🚀 Impulsar Ventas',
      title: 'Configurar Campaña Publicitaria',
      description:
        'Podrás destacar tus anuncios en la Gran Vitrina Principal o en las pasarelas continuas de alto tráfico.',
      guideTip:
        '💡 Guía: Selecciona tu publicación, elige los días de pauta y activa tu campaña con tu saldo.',
    }
  }

  if (cleanHref.startsWith('/admin')) {
    if (cleanHref.includes('section=ads')) {
      return {
        badge: '🛡️ Administración',
        title: 'Moderación de Campañas Publicitarias',
        description:
          'Control administrativo de órdenes de pauta, tiempos de exhibición y campañas activas en vitrina.',
        guideTip: '💡 Guía: Revisa y aprueba las campañas solicitadas por los vendedores.',
      }
    }
    if (cleanHref.includes('section=adpage')) {
      return {
        badge: '🛡️ Administración',
        title: 'Configuración de Vitrina y Pasarelas',
        description:
          'Ajustes en tiempo real de velocidad de pasarelas, rotación de la Gran Vitrina y anuncios por sección.',
        guideTip: '💡 Guía: Guarda tus cambios para actualizar de inmediato la experiencia del inicio.',
      }
    }
    if (cleanHref.includes('section=balances')) {
      return {
        badge: '🛡️ Administración',
        title: 'Control de Billeteras y Saldos',
        description:
          'Gestión de recargas de saldo, validación de comprobantes y asignación de créditos publicitarios.',
        guideTip: '💡 Guía: Aprueba las recargas pendientes para acreditar saldo a los vendedores.',
      }
    }
    if (cleanHref.includes('section=users')) {
      return {
        badge: '🛡️ Administración',
        title: 'Gestión de Usuarios y Permisos',
        description:
          'Directorio completo de usuarios registrados, asignación de roles y verificación oficial de comercios.',
        guideTip: '💡 Guía: Otorga el sello de comercio verificado a los vendedores confiables.',
      }
    }
    return {
      badge: '🛡️ Moderación General',
      title: 'Panel de Moderación y Administración',
      description:
        'Centro de control para revisar, aprobar, editar o moderar las publicaciones enviadas al catálogo.',
      guideTip: '💡 Guía: Filtra los anuncios pendientes de revisión para mantener la calidad del catálogo.',
    }
  }

  if (cleanHref.startsWith('/cuenta')) {
    return {
      badge: '⚙️ Perfil Comercial',
      title: 'Mi Cuenta y Datos de Contacto',
      description:
        'Encontrarás la configuración de tu nombre comercial, WhatsApp de ventas, ciudad y descripción de tu negocio.',
      guideTip:
        '💡 Guía: Verifica que tu número de WhatsApp esté correcto para recibir los mensajes de tus clientes.',
    }
  }

  if (cleanHref.startsWith('/login') || cleanHref.startsWith('/registro')) {
    return {
      badge: '🔐 Acceso Comercial',
      title: 'Iniciar Sesión o Crear Cuenta',
      description:
        'Accede a tu panel de vendedor para publicar anuncios, administrar tu inventario y promocionar tu negocio.',
      guideTip:
        '💡 Guía: Recuerda que para ver el catálogo y contactar vendedores por WhatsApp no necesitas registrarte.',
    }
  }

  return {
    badge: '🏠 Vitrina Principal',
    title: 'Vitrina Principal de Indie Clasificados',
    description:
      'Encontrarás la Gran Vitrina y las pasarelas interactivas con servicios, artículos usados, productos nuevos y comercios.',
    guideTip:
      '💡 Guía: Desliza cualquier pasarela con el dedo o toca un anuncio para ver sus detalles y contactar por WhatsApp.',
  }
}

/**
 * Componente principal de carga vanguardista para páginas y transiciones
 */
export default function AvantGardeLoader({
  title,
  subtitle,
  variant = 'full',
}: AvantGardeLoaderProps) {
  const [progress, setProgress] = useState(18)
  const [routeHref, setRouteHref] = useState<string>(() => {
    if (lastPendingHref) return lastPendingHref
    if (typeof window !== 'undefined') {
      return window.location.pathname + (window.location.search || '')
    }
    return '/'
  })

  useEffect(() => {
    if (lastPendingHref) {
      setRouteHref(lastPendingHref)
    } else if (typeof window !== 'undefined') {
      setRouteHref(window.location.pathname + (window.location.search || ''))
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) return 96
        const step = prev < 60 ? 9 : prev < 85 ? 4 : 1
        return Math.min(96, prev + step)
      })
    }, 180)

    return () => {
      clearInterval(progressInterval)
    }
  }, [])

  const routeInfo = resolveRouteContext(routeHref)
  const displayTitle =
    title && title !== 'Indie Clasificados' ? title : routeInfo.title
  const displayDescription = subtitle || routeInfo.description

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[72vh] px-4 py-10 select-none overflow-hidden">
      {/* Tarjeta Central Holográfica Vanguardista */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/90 dark:bg-zinc-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Luz ambiental decorativa */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-purple-600/15 blur-3xl" />

        {/* Cabecera de Telemetría */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              INDIE CLASIFICADOS • ARCKT ENGINE
            </span>
          </div>
          <span className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
            {progress}%
          </span>
        </div>

        {/* Núcleo de Electrones Orbitando + Guía Contextual de la Sección */}
        <div className="flex flex-col items-center text-center">
          <QuantumGooeyCore size="lg" />

          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/70 dark:border-purple-800/60 px-3 py-0.5 text-[11px] font-extrabold text-purple-700 dark:text-purple-300">
            {routeInfo.badge}
          </span>

          <h2 className="mt-2.5 text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            {displayTitle}
          </h2>

          <p className="mt-1.5 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-md">
            {displayDescription}
          </p>

          {/* Barra de Progreso Láser Multicolor */}
          <div className="mt-5 relative h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 p-0.5">
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-emerald-500 via-purple-500 to-indigo-500 transition-all duration-200 overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="ic-shimmer-bar absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>
          </div>

          {/* Indicadores de Módulos Activos */}
          <div className="mt-5 grid grid-cols-3 gap-2 w-full text-left">
            <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 p-2.5">
              <div className="text-[9px] font-mono uppercase text-zinc-400">Vitrina</div>
              <div className="mt-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>⚡</span>
                <span>Activa</span>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 p-2.5">
              <div className="text-[9px] font-mono uppercase text-zinc-400">Catálogo</div>
              <div className="mt-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <span>🔄</span>
                <span>Sincronizado</span>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 p-2.5">
              <div className="text-[9px] font-mono uppercase text-zinc-400">Usuarios</div>
              <div className="mt-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
                <span className="truncate">Conexión Activa</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NavigationProgressInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)
  const [barProgress, setBarProgress] = useState(0)

  // Cuando cambia la ruta o los query params, cerramos la barra superior suavemente
  useEffect(() => {
    lastPendingHref = null
    if (isNavigating) {
      setBarProgress(100)
      const doneTimer = setTimeout(() => {
        setIsNavigating(false)
        setBarProgress(0)
      }, 220)
      return () => clearTimeout(doneTimer)
    }
  }, [pathname, searchParams])

  // Registrar el enlace de destino clicado para que la ventana central de carga muestre la guía exacta de ese enlace
  useEffect(() => {
    let safetyTimer: ReturnType<typeof setTimeout> | null = null

    const handleDocumentClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return
      }

      const anchor = (e.target as HTMLElement | null)?.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      const target = anchor.getAttribute('target')
      if (
        !href ||
        target === '_blank' ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('http')
      ) {
        return
      }

      const currentFull =
        window.location.pathname + (window.location.search ? window.location.search : '')
      if (href === currentFull) return

      lastPendingHref = href
      setIsNavigating(true)
      setBarProgress(25)

      if (safetyTimer) clearTimeout(safetyTimer)
      safetyTimer = setTimeout(() => {
        lastPendingHref = null
        setIsNavigating(false)
        setBarProgress(0)
      }, 8000)
    }

    document.addEventListener('click', handleDocumentClick, true)
    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
      if (safetyTimer) clearTimeout(safetyTimer)
    }
  }, [])

  // Avance progresivo de la barra láser superior mientras está navegando
  useEffect(() => {
    if (!isNavigating) return
    const interval = setInterval(() => {
      setBarProgress((prev) => {
        if (prev >= 92) return prev
        return prev + (prev < 60 ? 12 : 4)
      })
    }, 160)
    return () => clearInterval(interval)
  }, [isNavigating])

  if (!isNavigating) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent pointer-events-none overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-emerald-400 via-purple-500 to-cyan-400 shadow-[0_0_16px_rgba(16,185,129,0.9)] transition-all duration-200 ease-out"
        style={{ width: `${barProgress}%` }}
      />
    </div>
  )
}

export function GlobalNavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  )
}


