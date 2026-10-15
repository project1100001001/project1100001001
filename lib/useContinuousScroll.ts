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

  // Arrastre con puntero (mouse / touch)
  const isDraggingRef = useRef<boolean>(false)
  const dragStartXRef = useRef<number>(0)
  const dragStartPosRef = useRef<number>(0)
  const hasDraggedRef = useRef<boolean>(false)

  // Pausar y reanudar
  const pause = useCallback(() => {
    isPausedRef.current = true
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    isPausedRef.current = false
    setIsPaused(false)
  }, [])

  // Desplazamiento asistido manual con botones ◀ y ▶
  const stepManual = useCallback((direction: 'left' | 'right') => {
    const track = trackRef.current
    if (!track) return
    const card = track.firstElementChild as HTMLElement | null
    const cardWidth = card ? card.offsetWidth + 20 : 340
    // En dirección invertida de flujo: 'left' retrocede, 'right' avanza
    const delta = direction === 'right' ? cardWidth : -cardWidth

    const W = cycleWidthRef.current
    posRef.current += delta
    if (W > 0) {
      while (posRef.current < W) posRef.current += W
      while (posRef.current >= 2 * W) posRef.current -= W
    }
    track.style.transform = `translate3d(-${posRef.current.toFixed(2)}px, 0, 0)`
  }, [trackRef])

  // Manejo de arrastre fluido con Pointer Events (Touch / Mouse)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    isDraggingRef.current = true
    hasDraggedRef.current = false
    dragStartXRef.current = e.clientX
    dragStartPosRef.current = posRef.current
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    const dx = e.clientX - dragStartXRef.current
    if (Math.abs(dx) > 6) {
      hasDraggedRef.current = true
    }
    const W = cycleWidthRef.current
    let nextPos = dragStartPosRef.current - dx
    if (W > 0) {
      while (nextPos < W) nextPos += W
      while (nextPos >= 2 * W) nextPos -= W
    }
    posRef.current = nextPos
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(-${nextPos.toFixed(2)}px, 0, 0)`
    }
  }, [trackRef])

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  // Evitar navegación accidental en enlaces al soltar un arrastre horizontal
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault()
      e.stopPropagation()
      hasDraggedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (itemCount <= 1) return

    const track = trackRef.current
    if (!track) return

    const updateCycleWidth = () => {
      const el = trackRef.current
      if (!el || itemCount <= 0) return

      const child0 = el.children[0] as HTMLElement | undefined
      const childN = el.children[itemCount] as HTMLElement | undefined

      if (child0 && childN && childN.offsetLeft > child0.offsetLeft) {
        cycleWidthRef.current = childN.offsetLeft - child0.offsetLeft
      } else if (el.children.length >= itemCount) {
        const card = child0 || (el.firstElementChild as HTMLElement | null)
        const cardWidth = card ? card.offsetWidth + 20 : 340
        cycleWidthRef.current = cardWidth * itemCount
      }
    }

    updateCycleWidth()

    // Inicializar la posición en el bloque central (1.5 * W) para loop continuo
    if (cycleWidthRef.current > 0 && posRef.current === 0) {
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

    window.addEventListener('resize', updateCycleWidth)

    let animId: number
    let lastTime: number | null = null

    // Bucle continuo en GPU: ZERO lecturas de layout DOM dentro de step
    const step = (time: number) => {
      if (!trackRef.current) {
        animId = requestAnimationFrame(step)
        return
      }

      if (lastTime === null) {
        lastTime = time
      }
      // Limitar delta a máximo 35ms para evitar saltos bruscos
      const delta = Math.min(time - lastTime, 35)
      lastTime = time

      if (cycleWidthRef.current <= 0) {
        updateCycleWidth()
        if (cycleWidthRef.current > 0 && posRef.current === 0) {
          posRef.current = 1.5 * cycleWidthRef.current
        }
      }

      if (!isPausedRef.current && !isDraggingRef.current && cycleWidthRef.current > 0) {
        const W = cycleWidthRef.current
        const px = (speed * delta) / 16.67
        posRef.current -= px

        // Normalización modular matemática exacta sin saltos
        if (posRef.current < W) {
          posRef.current += W
        } else if (posRef.current >= 2 * W) {
          posRef.current -= W
        }

        trackRef.current.style.transform = `translate3d(-${posRef.current.toFixed(2)}px, 0, 0)`
      }

      animId = requestAnimationFrame(step)
    }

    animId = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(animId)
      if (ro) ro.disconnect()
      window.removeEventListener('resize', updateCycleWidth)
    }
  }, [trackRef, itemCount, speed])

  return {
    isPaused,
    pause,
    resume,
    stepManual,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
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
      ? `Hello ${sellerName}, I saw your featured publication "${title}" on the Marketplace and would like more details.`
      : `Hola ${sellerName}, vi su publicación destacada "${title}" en la vitrina del Marketplace y me gustaría solicitar información.`
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
