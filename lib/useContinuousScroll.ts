// lib/useContinuousScroll.ts
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Función para crear una lista repetida simétricamente para bucle horizontal continuo sin fin.
 * Mínimo 3 copias completas y al menos 12 tarjetas en total para pantallas ultra-anchas.
 */
export const createLoopedItems = <T,>(items: T[]): T[] => {
  const N = items.length
  if (N === 0) return []
  let copies = 3
  while (copies * N < 12) {
    copies += 1
  }
  const result: T[] = []
  for (let c = 0; c < copies; c++) {
    result.push(...items)
  }
  return result
}

export interface GpuContinuousScrollOptions {
  trackRef: React.RefObject<HTMLDivElement | null>
  itemCount: number
  speed?: number // píxeles por frame de 16.67ms (por defecto 0.65)
}

/**
 * Hook de Desplazamiento Continuo con Aceleración por GPU (Hardware Compositor).
 * Elimina por completo las pausas y micro-congelamientos:
 * 1. Opera mediante transform: translate3d(-Xpx, 0, 0) sin tocar scrollLeft.
 * 2. CERO lecturas de layout (DOM reads) dentro del frame de animación (evita forced synchronous reflow).
 * 3. Admite aceleración de subpíxeles continua a 60/120 fps.
 * 4. Soporta pausa instantánea por cursor en tarjetas y arrastre con mouse/touch.
 * 5. Soporta botones manuales ◀ y ▶ con desplazamiento fluido.
 */
export function useGpuContinuousScroll({
  trackRef,
  itemCount,
  speed = 0.65,
}: GpuContinuousScrollOptions) {
  const isPausedRef = useRef(false)
  const [isPaused, setIsPaused] = useState(false)

  // Posición subpixel continua en memoria (GPU)
  const posRef = useRef<number>(0)
  const cycleWidthRef = useRef<number>(0)

  // Arrastre / control manual (ratón en escritorio o manipulación táctil horizontal en móvil)
  const isDraggingRef = useRef<boolean>(false)
  const dragStartXRef = useRef<number>(0)
  const dragStartPosRef = useRef<number>(0)
  const hasDraggedRef = useRef<boolean>(false)

  // Control táctil móvil:
  // 1. Mantiene movimiento continuo por defecto (incluso al hacer scroll vertical en la página).
  // 2. Pasa instantáneamente a control táctil manual 1:1 cuando detecta manipulación horizontal de la pasarela.
  // 3. Se detiene si se mantiene oprimida la pantalla sin mover por más de 3 segundos (3000ms).
  // 4. Al soltar el touch, retoma el flujo continuo desde la posición exacta donde quedó.
  const hasTouchedRef = useRef<boolean>(false)
  const isTouchingRef = useRef<boolean>(false)
  const isTouchControllingRef = useRef<boolean>(false)
  const lastTouchActivityRef = useRef<number>(0)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchHoldStartXRef = useRef<number>(0)
  const touchHoldStartYRef = useRef<number>(0)

  const isMobileOrTouchDevice = useCallback(() => {
    if (typeof window === 'undefined') return false
    if (hasTouchedRef.current) return true
    if (window.innerWidth < 1024) return true
    if (typeof window.matchMedia === 'function') {
      if (window.matchMedia('(pointer: coarse)').matches) return true
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return true
    }
    return false
  }, [])

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  // Pausar por hover: SOLO en escritorio con mouse real; en móvil NUNCA detiene la pasarela por hover
  const pause = useCallback(() => {
    if (isMobileOrTouchDevice()) return
    isPausedRef.current = true
    setIsPaused(true)
  }, [isMobileOrTouchDevice])

  const resume = useCallback(() => {
    clearLongPressTimer()
    isTouchingRef.current = false
    isTouchControllingRef.current = false
    isDraggingRef.current = false
    isPausedRef.current = false
    setIsPaused(false)
  }, [clearLongPressTimer])

  // Inicio de contacto táctil en móvil
  const startMobileTouch = useCallback(
    (clientX: number, clientY: number) => {
      hasTouchedRef.current = true
      isTouchingRef.current = true
      isTouchControllingRef.current = false
      isDraggingRef.current = false
      hasDraggedRef.current = false
      lastTouchActivityRef.current = Date.now()

      clearLongPressTimer()
      touchHoldStartXRef.current = clientX
      touchHoldStartYRef.current = clientY
      dragStartXRef.current = clientX
      dragStartPosRef.current = posRef.current

      if (isPausedRef.current) {
        isPausedRef.current = false
        setIsPaused(false)
      }

      // Si mantiene oprimida la pantalla por más de 3 segundos sin manipular ni hacer scroll, pausar
      longPressTimerRef.current = setTimeout(() => {
        if (isTouchingRef.current && !isTouchControllingRef.current) {
          isPausedRef.current = true
          setIsPaused(true)
        }
      }, 3000)
    },
    [clearLongPressTimer]
  )

  // Movimiento táctil en móvil: detecta si el usuario está manipulando la pasarela horizontalmente
  const moveMobileTouch = useCallback(
    (clientX: number, clientY: number) => {
      if (!isTouchingRef.current) return
      lastTouchActivityRef.current = Date.now()

      const totalDx = clientX - touchHoldStartXRef.current
      const totalDy = clientY - touchHoldStartYRef.current

      // Si aún no ha pasado a control táctil manual, evaluar la intención del gesto
      if (!isTouchControllingRef.current) {
        // Si el gesto es vertical (scroll de página), liberar seguimiento para que la pasarela siga fluyendo sola
        if (Math.abs(totalDy) > Math.abs(totalDx) && Math.abs(totalDy) > 10) {
          clearLongPressTimer()
          isTouchingRef.current = false
          isTouchControllingRef.current = false
          isDraggingRef.current = false
          return
        }

        // Si el usuario manipula horizontalmente la pasarela, pasar a control táctil manual 1:1
        if (Math.abs(totalDx) > Math.abs(totalDy) && Math.abs(totalDx) > 6) {
          clearLongPressTimer()
          isTouchControllingRef.current = true
          isDraggingRef.current = true
          hasDraggedRef.current = true
          dragStartXRef.current = clientX
          dragStartPosRef.current = posRef.current
          if (isPausedRef.current) {
            isPausedRef.current = false
            setIsPaused(false)
          }
          return
        }
        return
      }

      // Control táctil manual activo: la pasarela sigue el dedo del usuario en tiempo real
      const dragDx = clientX - dragStartXRef.current
      const W = cycleWidthRef.current
      let nextPos = dragStartPosRef.current - dragDx
      if (W > 0) {
        nextPos = W + ((((nextPos - W) % W) + W) % W)
      }
      posRef.current = nextPos
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(-${nextPos.toFixed(2)}px, 0, 0)`
      }
    },
    [clearLongPressTimer, trackRef]
  )

  // Fin de interacción táctil: vuelve inmediatamente al movimiento continuo automático
  const endMobileTouch = useCallback(() => {
    clearLongPressTimer()
    isTouchingRef.current = false
    isTouchControllingRef.current = false
    isDraggingRef.current = false
    if (isPausedRef.current) {
      isPausedRef.current = false
      setIsPaused(false)
    }
  }, [clearLongPressTimer])

  // Desplazamiento asistido manual con botones ◀ y ▶ (avanza sin detener el flujo continuo)
  const stepManual = useCallback(
    (direction: 'left' | 'right') => {
      const track = trackRef.current
      if (!track) return
      const card = track.firstElementChild as HTMLElement | null
      const cardWidth = card && card.offsetWidth > 40 ? card.offsetWidth + 20 : 320
      const delta = direction === 'right' ? cardWidth : -cardWidth

      const W = cycleWidthRef.current
      posRef.current += delta
      if (W > 0) {
        posRef.current = W + ((((posRef.current - W) % W) + W) % W)
      }
      track.style.transform = `translate3d(-${posRef.current.toFixed(2)}px, 0, 0)`
    },
    [trackRef]
  )

  // Manejo de eventos de puntero (escritorio con mouse; en móvil se delega a los eventos touch nativos)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse' || isMobileOrTouchDevice()) {
        return
      }
      if (e.button !== 0) return
      isDraggingRef.current = true
      hasDraggedRef.current = false
      dragStartXRef.current = e.clientX
      dragStartPosRef.current = posRef.current
      lastTouchActivityRef.current = Date.now()
    },
    [isMobileOrTouchDevice]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse' || isMobileOrTouchDevice()) {
        return
      }
      if (!isDraggingRef.current) return
      lastTouchActivityRef.current = Date.now()

      const dx = e.clientX - dragStartXRef.current
      if (Math.abs(dx) > 6) {
        hasDraggedRef.current = true
      }

      const W = cycleWidthRef.current
      let nextPos = dragStartPosRef.current - dx
      if (W > 0) {
        nextPos = W + ((((nextPos - W) % W) + W) % W)
      }
      posRef.current = nextPos
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(-${nextPos.toFixed(2)}px, 0, 0)`
      }
    },
    [trackRef, isMobileOrTouchDevice]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') {
        isDraggingRef.current = false
      }
    },
    []
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length > 0) {
        startMobileTouch(e.touches[0].clientX, e.touches[0].clientY)
      }
    },
    [startMobileTouch]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length > 0) {
        moveMobileTouch(e.touches[0].clientX, e.touches[0].clientY)
      }
    },
    [moveMobileTouch]
  )

  const handleTouchEnd = useCallback(() => {
    endMobileTouch()
  }, [endMobileTouch])

  // Evitar navegación accidental en enlaces al soltar un arrastre horizontal en escritorio
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault()
      e.stopPropagation()
      hasDraggedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (itemCount <= 0) return

    const track = trackRef.current
    if (!track) return

    const activeSpeed = typeof speed === 'number' && speed > 0 ? speed : 0.65

    const updateCycleWidth = () => {
      const el = trackRef.current
      if (!el || itemCount <= 0) return

      const child0 = el.children[0] as HTMLElement | undefined
      const childN = el.children[itemCount] as HTMLElement | undefined

      if (child0 && childN) {
        const rect0 = child0.getBoundingClientRect()
        const rectN = childN.getBoundingClientRect()
        const rectDiff = rectN.left - rect0.left
        if (rectDiff > 50) {
          cycleWidthRef.current = rectDiff
          return
        }
        const offsetDiff = childN.offsetLeft - child0.offsetLeft
        if (offsetDiff > 50) {
          cycleWidthRef.current = offsetDiff
          return
        }
      }

      const card = child0 || (el.firstElementChild as HTMLElement | null)
      const cardWidth = card && card.offsetWidth > 50 ? card.offsetWidth + 20 : 308
      cycleWidthRef.current = cardWidth * itemCount
    }

    updateCycleWidth()

    // Inicializar la posición en el bloque central (1.5 * W) para loop continuo
    if (cycleWidthRef.current > 0 && posRef.current <= 0) {
      posRef.current = 1.5 * cycleWidthRef.current
      track.style.transform = `translate3d(-${posRef.current.toFixed(2)}px, 0, 0)`
    }

    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && track) {
      ro = new ResizeObserver(() => {
        updateCycleWidth()
      })
      ro.observe(track)
      if (track.firstElementChild) {
        ro.observe(track.firstElementChild)
      }
    }

    const handleTouchOrBlurRelease = () => {
      clearLongPressTimer()
      isTouchingRef.current = false
      isTouchControllingRef.current = false
      isDraggingRef.current = false
      if (isPausedRef.current && isMobileOrTouchDevice()) {
        isPausedRef.current = false
        setIsPaused(false)
      }
    }

    const handleMouseUpRelease = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        isDraggingRef.current = false
      }
    }

    window.addEventListener('resize', updateCycleWidth)
    window.addEventListener('pointerup', handleMouseUpRelease, { passive: true })
    window.addEventListener('touchend', handleTouchOrBlurRelease, { passive: true })
    window.addEventListener('touchcancel', handleTouchOrBlurRelease, { passive: true })
    window.addEventListener('blur', handleTouchOrBlurRelease)
    document.addEventListener('visibilitychange', handleTouchOrBlurRelease)

    let animId: number
    let lastTime: number | null = null
    let lastWallTime = Date.now()

    // Bucle continuo en GPU
    const step = (time: number) => {
      lastWallTime = Date.now()
      const el = trackRef.current
      if (!el) return

      if (lastTime === null) {
        lastTime = time
      }
      const rawDelta = time - lastTime
      const delta = rawDelta > 0 ? Math.min(rawDelta, 40) : 16.67
      lastTime = time

      if (cycleWidthRef.current <= 0) {
        updateCycleWidth()
      }

      // Si una manipulación táctil dejó de recibir movimiento por > 1.8s sin evento touchend, retomar flujo continuo
      if (isDraggingRef.current && Date.now() - lastTouchActivityRef.current > 1800) {
        isTouchingRef.current = false
        isTouchControllingRef.current = false
        isDraggingRef.current = false
      }

      const W = cycleWidthRef.current
      if (W > 0) {
        if (!isPausedRef.current && !isDraggingRef.current) {
          const px = (activeSpeed * delta) / 16.67
          posRef.current -= px
        }

        // Normalización modular matemática exacta dentro del rango [W, 2W)
        if (posRef.current < W || posRef.current >= 2 * W) {
          posRef.current = W + ((((posRef.current - W) % W) + W) % W)
        }

        el.style.transform = `translate3d(-${posRef.current.toFixed(2)}px, 0, 0)`
      }
    }

    const rafLoop = (time: number) => {
      step(time)
      animId = requestAnimationFrame(rafLoop)
    }

    animId = requestAnimationFrame(rafLoop)

    // Respaldo para navegadores móviles que suspenden requestAnimationFrame durante el scroll vertical nativo
    const backupTimer = setInterval(() => {
      if (Date.now() - lastWallTime > 45) {
        step(typeof performance !== 'undefined' ? performance.now() : Date.now())
      }
    }, 30)

    return () => {
      cancelAnimationFrame(animId)
      clearInterval(backupTimer)
      clearLongPressTimer()
      if (ro) ro.disconnect()
      window.removeEventListener('resize', updateCycleWidth)
      window.removeEventListener('pointerup', handleMouseUpRelease)
      window.removeEventListener('touchend', handleTouchOrBlurRelease)
      window.removeEventListener('touchcancel', handleTouchOrBlurRelease)
      window.removeEventListener('blur', handleTouchOrBlurRelease)
      document.removeEventListener('visibilitychange', handleTouchOrBlurRelease)
    }
  }, [trackRef, itemCount, speed, clearLongPressTimer, isMobileOrTouchDevice])

  return {
    isPaused,
    pause,
    resume,
    stepManual,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClickCapture,
    cycleWidthRef,
  }
}

/**
 * Enlace para contacto directo de WhatsApp
 */
export const getWhatsappUrl = (
  phoneRaw: string | null,
  sellerName: string,
  title: string,
  locale: string = 'es'
) => {
  if (!phoneRaw) return ''
  let cleaned = phoneRaw.replace(/\D/g, '')
  if (cleaned.length === 10) {
    cleaned = `57${cleaned}`
  }
  const msg =
    locale === 'en'
      ? `Hello ${sellerName}, I saw your featured publication "${title}" on Indie Clasificados and would like more details.`
      : `Hola ${sellerName}, vi su publicación destacada "${title}" en la vitrina de Indie Clasificados y me gustaría solicitar información.`
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`
}

/**
 * Registro diferido no bloqueante de eventos analíticos de campañas
 */
export const trackAdEvent = (
  item: { id: string; listingId: string },
  eventType: 'impression' | 'click' | 'whatsapp'
) => {
  if (!item) return
  try {
    fetch('/api/ad-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adOrderId: item.id,
        eventType,
        listingId: item.listingId,
      }),
    }).catch(() => {})
  } catch {
    // Non-blocking
  }
}
