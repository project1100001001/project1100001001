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
          'Técnicos, asesorías, mantenimiento, transporte y soluciones locales listas para contratar.',
        guideTip: '',
      }
    }
    if (cleanHref.includes('type=article')) {
      return {
        badge: '📦 Artículos Usados',
        title: 'Artículos de Segunda Mano y Oportunidades',
        description:
          'Artículos usados en buen estado, fotos reales y precios negociables publicados por vendedores locales.',
        guideTip: '',
      }
    }
    if (cleanHref.includes('type=product')) {
      return {
        badge: '✨ Productos Nuevos',
        title: 'Productos Nuevos de Pymes y Emprendedores',
        description:
          'Productos nuevos con disponibilidad inmediata, precios directos y comercios verificados.',
        guideTip: '',
      }
    }
    if (/^\/catalogo\/[^/?#]+/.test(cleanHref)) {
      return {
        badge: '🔎 Ficha del Anuncio',
        title: 'Detalle Completo de la Publicación',
        description:
          'Galería de fotos, características técnicas, ubicación, datos del vendedor y contacto directo.',
        guideTip: '',
      }
    }
    return {
      badge: '🔍 Explorador Comercial',
      title: 'Catálogo General de Indie Clasificados',
      description:
        'Todas las publicaciones activas con buscador inteligente por categoría, ciudad y rango de precio.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/directorio')) {
    return {
      badge: '📇 Directorio Comercial',
      title: 'Directorio de Vendedores y Comercios',
      description:
        'Perfiles de pymes, emprendedores y profesionales con su calificación, ciudad y catálogo.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/publicar')) {
    if (cleanHref.includes('type=service')) {
      return {
        badge: '🛠️ Nueva Publicación',
        title: 'Publicar un Servicio Profesional',
        description:
          'Formulario guiado para describir tu servicio, definir tu tarifa o cotización, cobertura y WhatsApp.',
        guideTip: '',
      }
    }
    if (cleanHref.includes('type=article')) {
      return {
        badge: '📦 Nueva Publicación',
        title: 'Publicar un Artículo Usado',
        description:
          'Formulario paso a paso para subir fotos reales de tu artículo, detallar su estado y fijar el precio.',
        guideTip: '',
      }
    }
    return {
      badge: '✨ Nueva Publicación',
      title: 'Publicar un Producto en el Catálogo',
      description:
        'Estudio de publicación para crear la ficha de tu producto con fotos, precio, categoría y contacto directo.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/mis-publicaciones') || cleanHref.startsWith('/inventario')) {
    return {
      badge: '📦 Gestión de Inventario',
      title: 'Mis Publicaciones e Inventario',
      description:
        'Listado de tus anuncios para editar precios, actualizar fotos, pausar o impulsar su visibilidad.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/mis-servicios')) {
    return {
      badge: '🛠️ Gestión de Servicios',
      title: 'Panel de Mis Servicios Publicados',
      description:
        'Tus servicios activos para actualizar tarifas, horarios de atención y estado de publicación.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/mis-campanas')) {
    return {
      badge: '📈 Rendimiento Publicitario',
      title: 'Mis Campañas y Estadísticas',
      description:
        'Estado de tus anuncios promocionados, tiempo restante de exhibición, vistas y clics a WhatsApp.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/promocionar')) {
    if (cleanHref.includes('tab=recharge')) {
      return {
        badge: '💳 Billetera Comercial',
        title: 'Recarga de Saldo Publicitario',
        description:
          'Opciones para recargar créditos en tu billetera y activar promociones en las pasarelas.',
        guideTip: '',
      }
    }
    return {
      badge: '🚀 Impulsar Ventas',
      title: 'Configurar Campaña Publicitaria',
      description:
        'Destaca tus anuncios en la Gran Vitrina Principal o en las pasarelas continuas de alto tráfico.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/admin')) {
    if (cleanHref.includes('section=ads')) {
      return {
        badge: '🛡️ Administración',
        title: 'Moderación de Campañas Publicitarias',
        description:
          'Control administrativo de órdenes de pauta, tiempos de exhibición y campañas activas en vitrina.',
        guideTip: '',
      }
    }
    if (cleanHref.includes('section=adpage')) {
      return {
        badge: '🛡️ Administración Publicidad',
        title: 'Control de Página de Publicidad y Pasarelas',
        description:
          'Administración de pasarelas en la página de publicidad, nuevos catálogos exclusivos, costos de campaña y vendedores habilitados.',
        guideTip: '',
      }
    }
    if (cleanHref.includes('section=balances')) {
      return {
        badge: '🛡️ Administración',
        title: 'Control de Billeteras y Saldos',
        description:
          'Gestión de recargas de saldo, validación de comprobantes y asignación de créditos publicitarios.',
        guideTip: '',
      }
    }
    if (cleanHref.includes('section=users')) {
      return {
        badge: '🛡️ Administración',
        title: 'Gestión de Usuarios y Permisos',
        description:
          'Directorio completo de usuarios registrados, asignación de roles y verificación oficial de comercios.',
        guideTip: '',
      }
    }
    return {
      badge: '🛡️ Catálogo General',
      title: 'Moderación de Artículos y Servicios',
      description:
        'Centro de control para revisar, aprobar, clasificar o editar los artículos y servicios publicados en el catálogo.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/cuenta')) {
    return {
      badge: '⚙️ Perfil Comercial',
      title: 'Mi Cuenta y Datos de Contacto',
      description:
        'Configuración de tu nombre comercial, WhatsApp de ventas, ciudad y descripción de tu negocio.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/login') || cleanHref.startsWith('/registro')) {
    return {
      badge: '🔐 Acceso Comercial',
      title: 'Iniciar Sesión o Crear Cuenta',
      description:
        'Panel de vendedor para publicar anuncios, administrar tu inventario y promocionar tu negocio.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/bienvenida')) {
    return {
      badge: '📊 Dashboard',
      title: 'Dashboard y Resumen de tu Perfil',
      description:
        'Resumen rápido de tus publicaciones, campañas, compras y actividad reciente según tu perfil.',
      guideTip: '',
    }
  }

  return {
    badge: '🏠 Vitrina Principal',
    title: 'Vitrina Principal de Indie Clasificados',
    description:
      'La Gran Vitrina y las pasarelas interactivas con servicios, artículos usados, productos nuevos y comercios.',
    guideTip: '',
  }
}

// Estado compartido entre AvantGardeLoader (loading.tsx / páginas), hooks de carga de datos y GlobalNavigationLoader (overlay único de pantalla completa)
let isGlobalHostMounted = false
let activeLoaderCount = 0
let activeCustomTitle: string | undefined = undefined
let activeCustomSubtitle: string | undefined = undefined
let manualNavigationActive = false
let manualSafetyTimer: ReturnType<typeof setTimeout> | null = null
const loaderListeners = new Set<() => void>()

function notifyLoaderListeners() {
  loaderListeners.forEach((fn) => fn())
}

/**
 * Hook para registrar una fase de carga secundaria (ej. consulta inicial de cliente tras montar la ruta)
 * dentro de la MISMA sesión de carga global, evitando que la ventana se muestre a medio cargar
 * o que aparezca una segunda pantalla de carga independiente.
 */
export function useRegisterGlobalLoadPhase(
  isLoading: boolean,
  customTitle?: string,
  customSubtitle?: string
) {
  useEffect(() => {
    if (!isLoading) return

    activeLoaderCount += 1
    if (customTitle) activeCustomTitle = customTitle
    if (customSubtitle) activeCustomSubtitle = customSubtitle
    notifyLoaderListeners()

    return () => {
      activeLoaderCount = Math.max(0, activeLoaderCount - 1)
      if (activeLoaderCount === 0 && !manualNavigationActive) {
        activeCustomTitle = undefined
        activeCustomSubtitle = undefined
      }
      notifyLoaderListeners()
    }
  }, [isLoading, customTitle, customSubtitle])
}

/**
 * Permite disparar la ventana de carga inicial a pantalla completa desde cualquier acción
 * móvil o de escritorio (menú lateral móvil, inicio rápido de sesión, modales o router.push).
 */
export function triggerGlobalNavigationLoader(
  href: string,
  customTitle?: string,
  customSubtitle?: string
) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('close-mobile-sidebar'))
    const currentFull =
      window.location.pathname + (window.location.search ? window.location.search : '')
    if (href === currentFull && !customTitle) return
  }
  lastPendingHref = href
  if (customTitle) activeCustomTitle = customTitle
  if (customSubtitle) activeCustomSubtitle = customSubtitle
  manualNavigationActive = true
  if (manualSafetyTimer) clearTimeout(manualSafetyTimer)
  manualSafetyTimer = setTimeout(() => {
    manualNavigationActive = false
    lastPendingHref = null
    if (activeLoaderCount === 0) {
      activeCustomTitle = undefined
      activeCustomSubtitle = undefined
    }
    notifyLoaderListeners()
  }, 10000)
  notifyLoaderListeners()
}

/**
 * Tarjeta grande central con la descripción contextual del enlace y telemetría
 * Se muestra dentro de la pantalla de espera única que bloquea toda la pantalla.
 */
function FullScreenDescriptiveLoaderOverlay({
  routeHref,
  progress,
  title,
  subtitle,
}: {
  routeHref: string
  progress: number
  title?: string
  subtitle?: string
}) {
  const routeInfo = resolveRouteContext(routeHref)
  const displayTitle =
    title && title !== 'Indie Clasificados' ? title : routeInfo.title
  const displayDescription = subtitle || routeInfo.description

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-100/80 dark:bg-zinc-950/85 backdrop-blur-md px-4 py-10 select-none overflow-hidden animate-in fade-in duration-150">
      {/* Recuadro Grande con la información de descripción actual */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
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

        {/* Núcleo de Electrones Orbitando + Descripción Contextual del Enlace */}
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

/**
 * Componente principal de carga vanguardista para páginas y transiciones.
 * Se sincroniza con GlobalNavigationLoader para que SIEMPRE exista una única pantalla de espera
 * a pantalla completa con el recuadro grande descriptivo, sin duplicarse ni dejar huecos sin cubrir.
 */
export default function AvantGardeLoader({
  title,
  subtitle,
}: AvantGardeLoaderProps) {
  const [hostReady, setHostReady] = useState(false)

  useEffect(() => {
    activeLoaderCount += 1
    if (title) activeCustomTitle = title
    if (subtitle) activeCustomSubtitle = subtitle
    setHostReady(isGlobalHostMounted)
    notifyLoaderListeners()

    return () => {
      activeLoaderCount = Math.max(0, activeLoaderCount - 1)
      if (activeLoaderCount === 0 && !manualNavigationActive) {
        activeCustomTitle = undefined
        activeCustomSubtitle = undefined
      }
      notifyLoaderListeners()
    }
  }, [title, subtitle])

  // Si el contenedor global ya está montado en cliente tras el primer efecto, él renderiza el único overlay de pantalla completa
  if (hostReady) {
    return <div className="flex-1 min-h-[72vh]" aria-hidden="true" />
  }

  // Fallback consistente para SSR e hidratación inicial antes de que se sincronice con GlobalNavigationLoader
  const initialHref = lastPendingHref || '/'

  return (
    <FullScreenDescriptiveLoaderOverlay
      routeHref={initialHref}
      progress={24}
      title={title}
      subtitle={subtitle}
    />
  )
}

function NavigationProgressInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isRoutePending, setIsRoutePending] = useState(false)
  const [externalLoaders, setExternalLoaders] = useState(0)
  const [isOverlayActive, setIsOverlayActive] = useState(false)
  const [progress, setProgress] = useState(20)
  const [targetHref, setTargetHref] = useState<string>('/')

  const currentRouteKey = `${pathname || '/'}?${searchParams ? searchParams.toString() : ''}`
  const prevRouteKeyRef = React.useRef<string>(currentRouteKey)
  const navStartTimeRef = React.useRef<number>(0)
  const settleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearPendingCloseTimers = () => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current)
      settleTimerRef.current = null
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  // Suscribirse a cualquier AvantGardeLoader activo, hook de fase de carga o disparo manual
  useEffect(() => {
    isGlobalHostMounted = true
    const sync = () => {
      setExternalLoaders(activeLoaderCount)
      if (manualNavigationActive || activeLoaderCount > 0) {
        clearPendingCloseTimers()
        if (navStartTimeRef.current === 0) {
          navStartTimeRef.current = Date.now()
        }
        setProgress((prev) => (prev < 24 || prev >= 100 ? 24 : prev))
        setIsOverlayActive(true)
        if (manualNavigationActive) {
          setIsRoutePending(true)
        }
        if (lastPendingHref) {
          setTargetHref(lastPendingHref)
        } else if (typeof window !== 'undefined') {
          setTargetHref(window.location.pathname + (window.location.search || ''))
        }
      }
    }
    sync()
    loaderListeners.add(sync)
    return () => {
      loaderListeners.delete(sync)
      isGlobalHostMounted = false
    }
  }, [])

  // Cuando cambia la ruta o los query params, marcamos que la transición de URL llegó,
  // pero NO cerramos la pantalla si aún hay fases de carga activas (loading.tsx, Suspense o datos de página).
  useEffect(() => {
    if (prevRouteKeyRef.current === currentRouteKey) {
      return
    }
    prevRouteKeyRef.current = currentRouteKey
    lastPendingHref = null
    manualNavigationActive = false
    if (manualSafetyTimer) {
      clearTimeout(manualSafetyTimer)
      manualSafetyTimer = null
    }
    if (typeof window !== 'undefined') {
      setTargetHref(window.location.pathname + (window.location.search || ''))
    }
    setIsRoutePending(false)
  }, [currentRouteKey])

  // Unificador central de cierre: SOLO cierra la pantalla de espera cuando TANTO la ruta
  // como TODOS los cargadores secundarios (loading.tsx, Suspense, useRegisterGlobalLoadPhase)
  // han terminado de forma estable durante la ventana de coalescencia.
  const hasAnyActivePhase = isRoutePending || externalLoaders > 0 || manualNavigationActive

  useEffect(() => {
    if (hasAnyActivePhase) {
      clearPendingCloseTimers()
      if (navStartTimeRef.current === 0) {
        navStartTimeRef.current = Date.now()
      }
      setProgress((prev) => (prev < 24 || prev >= 100 ? 24 : prev))
      setIsOverlayActive(true)
      return
    }

    if (!isOverlayActive) return

    clearPendingCloseTimers()
    const elapsed = navStartTimeRef.current > 0 ? Date.now() - navStartTimeRef.current : 0
    const minTotalMs = 520
    // Ventana de coalescencia (320ms minimum) para absorber cualquier segundo proceso de carga consecutivo sin parpadear
    const waitBeforeCompleteMs = Math.max(320, minTotalMs - elapsed)

    settleTimerRef.current = setTimeout(() => {
      // Verificar nuevamente que no se haya activado otra fase de carga en este intervalo
      if (activeLoaderCount > 0 || manualNavigationActive) {
        return
      }
      setProgress(100)
      hideTimerRef.current = setTimeout(() => {
        if (activeLoaderCount > 0 || manualNavigationActive) {
          return
        }
        navStartTimeRef.current = 0
        setIsOverlayActive(false)
        setProgress(20)
        activeCustomTitle = undefined
        activeCustomSubtitle = undefined
      }, 170)
    }, waitBeforeCompleteMs)

    return () => {
      clearPendingCloseTimers()
    }
  }, [hasAnyActivePhase, isOverlayActive])

  // Interceptar clics en TODOS los enlaces
  useEffect(() => {
    let safetyTimer: ReturnType<typeof setTimeout> | null = null
    let sameUrlCheckTimer: ReturnType<typeof setTimeout> | null = null

    const activateForElement = (targetEl: HTMLElement | null) => {
      const anchor = targetEl?.closest('a')
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

      // Cerrar siempre el menú móvil automáticamente al seleccionar cualquier enlace
      window.dispatchEvent(new CustomEvent('close-mobile-sidebar'))

      const currentFull =
        window.location.pathname + (window.location.search ? window.location.search : '')
      if (href === currentFull) return

      clearPendingCloseTimers()
      if (navStartTimeRef.current === 0) {
        navStartTimeRef.current = Date.now()
      }
      lastPendingHref = href
      setTargetHref(href)
      setProgress((prev) => (isOverlayActive && prev > 24 && prev < 95 ? prev : 24))
      setIsRoutePending(true)
      setIsOverlayActive(true)

      if (sameUrlCheckTimer) clearTimeout(sameUrlCheckTimer)
      // Solo liberar isRoutePending si la URL destino ya coincide con la URL actual (nunca cortar a mitad de una carga real)
      sameUrlCheckTimer = setTimeout(() => {
        const nowFull =
          window.location.pathname + (window.location.search ? window.location.search : '')
        if (nowFull === href && !manualNavigationActive) {
          setIsRoutePending(false)
        }
      }, 650)

      if (safetyTimer) clearTimeout(safetyTimer)
      safetyTimer = setTimeout(() => {
        lastPendingHref = null
        manualNavigationActive = false
        setIsRoutePending(false)
      }, 10000)
    }

    const handleDocumentClick = (e: MouseEvent) => {
      if (
        (typeof e.button === 'number' && e.button !== 0) ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return
      }
      activateForElement(e.target as HTMLElement | null)
    }

    document.addEventListener('click', handleDocumentClick, false)
    return () => {
      document.removeEventListener('click', handleDocumentClick, false)
      if (safetyTimer) clearTimeout(safetyTimer)
      if (sameUrlCheckTimer) clearTimeout(sameUrlCheckTimer)
    }
  }, [isOverlayActive])

  // Avance progresivo monotónico del porcentaje mientras la sesión de carga unificada está activa
  useEffect(() => {
    if (!isOverlayActive) return
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev
        const step = prev < 55 ? 8 : prev < 80 ? 4 : 1
        return Math.min(95, prev + step)
      })
    }, 160)
    return () => clearInterval(interval)
  }, [isOverlayActive])

  if (!isOverlayActive) return null

  const effectiveHref =
    lastPendingHref ||
    targetHref ||
    (typeof window !== 'undefined'
      ? window.location.pathname + (window.location.search || '')
      : pathname || '/')

  return (
    <FullScreenDescriptiveLoaderOverlay
      routeHref={effectiveHref}
      progress={progress}
      title={activeCustomTitle}
      subtitle={activeCustomSubtitle}
    />
  )
}

export function GlobalNavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  )
}


