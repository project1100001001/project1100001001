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
 * Constantes y utilidades geométricas 3D para proyectar la esfera geodésica dorada del logo
 * rotando en 3D de Oeste a Este (sentido de rotación del planeta Tierra) conservando
 * su simetría esférica perfecta en todo momento.
 */
const SPHERE_CX = 100
const SPHERE_CY = 100
const SPHERE_R = 91
const BEZIER_K = 0.55228475

interface Vec3 {
  x: number
  y: number
  z: number
}

interface GeodesicRingDef {
  normal: Vec3
  e1: Vec3
  e2: Vec3
  flowClass: string
  useAltGrad: boolean
}

function normalize3(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z) || 1
  return { x: v.x / len, y: v.y / len, z: v.z / len }
}

function dot3(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function cross3(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

// Definición 100% simétrica de los grandes círculos geodésicos 3D (6 a 58° cada 60° + 4 a 32° cada 90°)
const GEODESIC_RING_SPECS: Array<{ incDeg: number; azDeg: number; flowClass: string; useAltGrad: boolean }> = [
  { incDeg: 58, azDeg: 0, flowClass: 'ic-sphere-flow-1', useAltGrad: false },
  { incDeg: 58, azDeg: 60, flowClass: 'ic-sphere-flow-2', useAltGrad: true },
  { incDeg: 58, azDeg: 120, flowClass: 'ic-sphere-flow-3', useAltGrad: false },
  { incDeg: 58, azDeg: 180, flowClass: 'ic-sphere-flow-4', useAltGrad: true },
  { incDeg: 58, azDeg: 240, flowClass: 'ic-sphere-flow-1', useAltGrad: false },
  { incDeg: 58, azDeg: 300, flowClass: 'ic-sphere-flow-2', useAltGrad: true },
  { incDeg: 32, azDeg: 30, flowClass: 'ic-sphere-flow-3', useAltGrad: false },
  { incDeg: 32, azDeg: 120, flowClass: 'ic-sphere-flow-4', useAltGrad: true },
  { incDeg: 32, azDeg: 210, flowClass: 'ic-sphere-flow-2', useAltGrad: false },
  { incDeg: 32, azDeg: 300, flowClass: 'ic-sphere-flow-1', useAltGrad: true },
]

const GEODESIC_RINGS: GeodesicRingDef[] = GEODESIC_RING_SPECS.map((spec) => {
  const inc = (spec.incDeg * Math.PI) / 180
  const az = (spec.azDeg * Math.PI) / 180
  const normal = normalize3({
    x: Math.sin(inc) * Math.cos(az),
    y: Math.cos(inc),
    z: Math.sin(inc) * Math.sin(az),
  })
  const ref = Math.abs(normal.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 }
  const e1 = normalize3(cross3(ref, normal))
  const e2 = normalize3(cross3(normal, e1))
  return {
    normal,
    e1,
    e2,
    flowClass: spec.flowClass,
    useAltGrad: spec.useAltGrad,
  }
})

// Nodos 3D 100% simétricos (siempre en pares antipodales +u y -u) en las intersecciones reales de la esfera
const SPHERE_INTERSECTION_NODES: Array<{ pos: Vec3; pulseClass: string }> = (() => {
  const pairs: Array<[number, number]> = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
    [0, 2], [1, 3], [2, 4],
    [0, 6], [1, 7], [2, 7], [3, 8], [4, 9], [5, 9],
  ]
  const pulseClasses = ['ic-node-pulse-1', 'ic-node-pulse-2', 'ic-node-pulse-3']
  const nodes: Array<{ pos: Vec3; pulseClass: string }> = []

  const addUniqueNode = (candidate: Vec3, cls: string) => {
    for (let k = 0; k < nodes.length; k++) {
      const d = Math.hypot(
        nodes[k].pos.x - candidate.x,
        nodes[k].pos.y - candidate.y,
        nodes[k].pos.z - candidate.z
      )
      if (d < 0.16) return
    }
    nodes.push({ pos: candidate, pulseClass: cls })
  }

  pairs.forEach(([i, j], idx) => {
    const c = cross3(GEODESIC_RINGS[i].normal, GEODESIC_RINGS[j].normal)
    const len = Math.hypot(c.x, c.y, c.z)
    if (len > 1e-4) {
      const u = { x: c.x / len, y: c.y / len, z: c.z / len }
      addUniqueNode(u, pulseClasses[idx % 3])
      addUniqueNode({ x: -u.x, y: -u.y, z: -u.z }, pulseClasses[(idx + 1) % 3])
    }
  })
  return nodes
})()

interface NodeArcSegment {
  ringIdx: number
  fromNode: number
  toNode: number
  phiStart: number
  deltaPhi: number
}

// Grafo topológico 3D de tramos de línea entre nodos adyacentes para que los destellos viajen de nodo a nodo
const { ALL_NODE_SEGMENTS, NODE_OUTGOING_SEGMENTS } = (() => {
  const allSegments: NodeArcSegment[] = []
  const outgoing: NodeArcSegment[][] = SPHERE_INTERSECTION_NODES.map(() => [])

  GEODESIC_RINGS.forEach((ring, ringIdx) => {
    const nodesOnRing: Array<{ nodeIdx: number; phi: number }> = []
    SPHERE_INTERSECTION_NODES.forEach((node, nodeIdx) => {
      if (Math.abs(dot3(node.pos, ring.normal)) < 1e-3) {
        // Redondear a 1e-6 y eliminar -0 para que atan2 sea 100% determinista e idéntico entre SSR y cliente
        const rawY = Math.round(dot3(node.pos, ring.e2) * 1e6) / 1e6 + 0
        const rawX = Math.round(dot3(node.pos, ring.e1) * 1e6) / 1e6 + 0
        let phi = Math.atan2(rawY, rawX)
        if (phi < -Math.PI + 1e-4) phi = Math.PI
        phi = Math.round(phi * 1e5) / 1e5 + 0
        nodesOnRing.push({ nodeIdx, phi })
      }
    })

    nodesOnRing.sort((a, b) => a.phi - b.phi || a.nodeIdx - b.nodeIdx)
    const count = nodesOnRing.length
    if (count < 2) return

    for (let m = 0; m < count; m++) {
      const curr = nodesOnRing[m]
      const next = nodesOnRing[(m + 1) % count]
      let dPhi = next.phi - curr.phi
      if (dPhi <= 0) dPhi += Math.PI * 2

      // Ignorar arcos excesivamente largos para priorizar saltos ágiles entre intersecciones cercanas
      if (dPhi < Math.PI * 0.95) {
        const fwdSeg: NodeArcSegment = {
          ringIdx,
          fromNode: curr.nodeIdx,
          toNode: next.nodeIdx,
          phiStart: curr.phi,
          deltaPhi: dPhi,
        }
        const revSeg: NodeArcSegment = {
          ringIdx,
          fromNode: next.nodeIdx,
          toNode: curr.nodeIdx,
          phiStart: next.phi,
          deltaPhi: -dPhi,
        }
        allSegments.push(fwdSeg, revSeg)
        outgoing[curr.nodeIdx].push(fwdSeg)
        outgoing[next.nodeIdx].push(revSeg)
      }
    }
  })

  return { ALL_NODE_SEGMENTS: allSegments, NODE_OUTGOING_SEGMENTS: outgoing }
})()

const NUM_TRAVELING_SPARKS = 18

// Eje polar vertical 100% simétrico para que la esfera conserve simetría izquierda-derecha y norte-sur
const TILT_Z = 0
const COS_TZ = Math.cos(TILT_Z)
const SIN_TZ = Math.sin(TILT_Z)
const TILT_X = 0
const COS_TX = Math.cos(TILT_X)
const SIN_TX = Math.sin(TILT_X)

/**
 * Rota un punto/vector 3D alrededor del eje polar de Oeste a Este (como el planeta Tierra:
 * el hemisferio frontal z > 0 avanza de izquierda a derecha y el trasero z < 0 de derecha a izquierda).
 */
function rotateEarth3D(v: Vec3, cosSpin: number, sinSpin: number): Vec3 {
  // 1. Giro axial Oeste -> Este alrededor del eje Y
  const x1 = v.x * cosSpin + v.z * sinSpin
  const y1 = v.y
  const z1 = -v.x * sinSpin + v.z * cosSpin

  // 2. Inclinación axial oblicua (eje Z)
  const x2 = x1 * COS_TZ - y1 * SIN_TZ
  const y2 = x1 * SIN_TZ + y1 * COS_TZ
  const z2 = z1

  // 3. Perspectiva esférica frontal (eje X)
  return {
    x: x2,
    y: y2 * COS_TX - z2 * SIN_TX,
    z: y2 * SIN_TX + z2 * COS_TX,
  }
}

/** Genera media elipse 2D exacta (2 cuadrantes Bézier cúbicos) desde (cx+ux, cy+uy) pasando por (cx+vx, cy+vy) hasta (cx-ux, cy-uy) */
function buildHalfEllipsePath(cx: number, cy: number, ux: number, uy: number, vx: number, vy: number): string {
  const p0x = cx + ux
  const p0y = cy + uy
  const pmx = cx + vx
  const pmy = cy + vy
  const p1x = cx - ux
  const p1y = cy - uy

  const c1x = p0x + BEZIER_K * vx
  const c1y = p0y + BEZIER_K * vy
  const c2x = pmx + BEZIER_K * ux
  const c2y = pmy + BEZIER_K * uy

  const c3x = pmx - BEZIER_K * ux
  const c3y = pmy - BEZIER_K * uy
  const c4x = p1x + BEZIER_K * vx
  const c4y = p1y + BEZIER_K * vy

  return `M ${p0x.toFixed(2)} ${p0y.toFixed(2)} C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${pmx.toFixed(2)} ${pmy.toFixed(2)} C ${c3x.toFixed(2)} ${c3y.toFixed(2)}, ${c4x.toFixed(2)} ${c4y.toFixed(2)}, ${p1x.toFixed(2)} ${p1y.toFixed(2)}`
}

/** Genera la elipse completa 2D (4 cuadrantes Bézier cúbicos) anclada materialmente al gran círculo 3D */
function buildFullEllipsePath(cx: number, cy: number, ax: number, ay: number, bx: number, by: number): string {
  const p0x = cx + ax
  const p0y = cy + ay
  const p1x = cx + bx
  const p1y = cy + by
  const p2x = cx - ax
  const p2y = cy - ay
  const p3x = cx - bx
  const p3y = cy - by

  return (
    `M ${p0x.toFixed(2)} ${p0y.toFixed(2)} ` +
    `C ${(p0x + BEZIER_K * bx).toFixed(2)} ${(p0y + BEZIER_K * by).toFixed(2)}, ${(p1x + BEZIER_K * ax).toFixed(2)} ${(p1y + BEZIER_K * ay).toFixed(2)}, ${p1x.toFixed(2)} ${p1y.toFixed(2)} ` +
    `C ${(p1x - BEZIER_K * ax).toFixed(2)} ${(p1y - BEZIER_K * ay).toFixed(2)}, ${(p2x + BEZIER_K * bx).toFixed(2)} ${(p2y + BEZIER_K * by).toFixed(2)}, ${p2x.toFixed(2)} ${p2y.toFixed(2)} ` +
    `C ${(p2x - BEZIER_K * bx).toFixed(2)} ${(p2y - BEZIER_K * by).toFixed(2)}, ${(p3x - BEZIER_K * ax).toFixed(2)} ${(p3y - BEZIER_K * ay).toFixed(2)}, ${p3x.toFixed(2)} ${p3y.toFixed(2)} ` +
    `C ${(p3x + BEZIER_K * ax).toFixed(2)} ${(p3y + BEZIER_K * ay).toFixed(2)}, ${(p0x - BEZIER_K * bx).toFixed(2)} ${(p0y - BEZIER_K * by).toFixed(2)}, ${p0x.toFixed(2)} ${p0y.toFixed(2)}`
  )
}

function computeRingPathsAtSpin(ring: GeodesicRingDef, cosSpin: number, sinSpin: number) {
  const n = rotateEarth3D(ring.normal, cosSpin, sinSpin)
  const e1 = rotateEarth3D(ring.e1, cosSpin, sinSpin)
  const e2 = rotateEarth3D(ring.e2, cosSpin, sinSpin)

  const rho = Math.max(1e-5, Math.hypot(n.x, n.y))
  // Vector tangente al horizonte esférico (z = 0)
  const ux = (-n.y / rho) * SPHERE_R
  const uy = (n.x / rho) * SPHERE_R
  // Vector cenital del hemisferio frontal (z >= 0)
  const vfx = ((-n.x * n.z) / rho) * SPHERE_R
  const vfy = ((-n.y * n.z) / rho) * SPHERE_R

  const frontPath = buildHalfEllipsePath(SPHERE_CX, SPHERE_CY, ux, uy, vfx, vfy)
  const backPath = buildHalfEllipsePath(SPHERE_CX, SPHERE_CY, -ux, -uy, -vfx, -vfy)
  const flowPath = buildFullEllipsePath(
    SPHERE_CX,
    SPHERE_CY,
    e1.x * SPHERE_R,
    e1.y * SPHERE_R,
    e2.x * SPHERE_R,
    e2.y * SPHERE_R
  )

  return { frontPath, backPath, flowPath, e1, e2 }
}

interface ActiveSparkTraveler {
  seg: NodeArcSegment
  startTime: number
  duration: number
}

function pickNextSparkSegment(prevSeg?: NodeArcSegment): NodeArcSegment {
  if (prevSeg && Math.random() < 0.76) {
    const candidates = NODE_OUTGOING_SEGMENTS[prevSeg.toNode] || []
    const nonReverse = candidates.filter((c) => c.toNode !== prevSeg.fromNode)
    const pool = nonReverse.length > 0 ? nonReverse : candidates
    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)]
    }
  }
  return ALL_NODE_SEGMENTS[Math.floor(Math.random() * ALL_NODE_SEGMENTS.length)]
}

/**
 * Núcleo Visual Corporativo:
 * Presenta la esfera geodésica dorada del logo rotando en 3D en el mismo sentido
 * que el planeta Tierra (Oeste a Este), manteniendo su forma esférica simétrica
 * con flujos de iluminación finos, continuos y destellos sutiles viajando aleatoriamente entre nodos.
 */
export function QuantumGooeyCore({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const isSmall = size === 'sm'
  const boxClass = isSmall ? 'h-16 w-16' : 'h-36 w-36 sm:h-40 sm:w-40'
  const filterId = React.useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const wireGradFrontId = `ic-wire-front-${filterId}`
  const wireGradBackId = `ic-wire-back-${filterId}`
  const flowGrad1Id = `ic-gold-grad-1-${filterId}`
  const flowGrad2Id = `ic-gold-grad-2-${filterId}`
  const photonCoreGradId = `ic-photon-core-${filterId}`
  const photonBurstGradId = `ic-photon-burst-${filterId}`
  const photonGlowFilterId = `ic-photon-glow-${filterId}`

  const backWireRefs = React.useRef<Array<SVGPathElement | null>>([])
  const frontWireBaseRefs = React.useRef<Array<SVGPathElement | null>>([])
  const frontWireCoreRefs = React.useRef<Array<SVGPathElement | null>>([])
  const flowRefs = React.useRef<Array<SVGPathElement | null>>([])
  const sparkTrailGlowRefs = React.useRef<Array<SVGPathElement | null>>([])
  const sparkTrailCoreRefs = React.useRef<Array<SVGPathElement | null>>([])
  const sparkGroupRefs = React.useRef<Array<SVGGElement | null>>([])
  const sparkFlashRefs = React.useRef<Array<SVGGElement | null>>([])

  useEffect(() => {
    let rafId = 0
    const startTime = performance.now()
    // Velocidad angular 3D suave de Oeste a Este (como la rotación terrestre)
    const angularSpeed = 0.45

    // Inicializar todos los puntos fotónicos con +100% de velocidad (2x más rápidos) a lo largo de las líneas
    const travelers: ActiveSparkTraveler[] = Array.from({ length: NUM_TRAVELING_SPARKS }, (_, idx) => {
      const seg =
        ALL_NODE_SEGMENTS[(idx * 3) % Math.max(1, ALL_NODE_SEGMENTS.length)] ||
        pickNextSparkSegment()
      const duration = 0.39 + (idx % 4) * 0.07
      const initialPhase = 0.06 + ((idx * 0.23) % 0.88)
      return {
        seg,
        startTime: -initialPhase * duration,
        duration,
      }
    })

    const rotatedRingsCache: Array<{ e1: Vec3; e2: Vec3 }> = new Array(GEODESIC_RINGS.length)

    const animate = (now: number) => {
      const elapsedSec = (now - startTime) / 1000
      const spinAngle = elapsedSec * angularSpeed
      const cosSpin = Math.cos(spinAngle)
      const sinSpin = Math.sin(spinAngle)

      for (let i = 0; i < GEODESIC_RINGS.length; i++) {
        const { frontPath, backPath, flowPath, e1, e2 } = computeRingPathsAtSpin(
          GEODESIC_RINGS[i],
          cosSpin,
          sinSpin
        )
        rotatedRingsCache[i] = { e1, e2 }

        const backEl = backWireRefs.current[i]
        if (backEl) backEl.setAttribute('d', backPath)

        const frontBaseEl = frontWireBaseRefs.current[i]
        if (frontBaseEl) frontBaseEl.setAttribute('d', frontPath)

        const frontCoreEl = frontWireCoreRefs.current[i]
        if (frontCoreEl) frontCoreEl.setAttribute('d', frontPath)

        const flowEl = flowRefs.current[i]
        if (flowEl) flowEl.setAttribute('d', flowPath)
      }

      // Actualizar cada punto fotónico viajando con mayor velocidad y fluidez continua por las líneas
      for (let s = 0; s < travelers.length; s++) {
        let tr = travelers[s]
        let tNorm = (elapsedSec - tr.startTime) / tr.duration

        if (tNorm >= 1) {
          const nextSeg = pickNextSparkSegment(tr.seg)
          const nextDur = 0.375 + Math.random() * 0.225
          const overflow = Math.min(0.25, tNorm - 1)
          tr = {
            seg: nextSeg,
            startTime: elapsedSec - overflow * nextDur,
            duration: nextDur,
          }
          travelers[s] = tr
          tNorm = overflow
        }

        const clampedT = Math.max(0, Math.min(1, tNorm))
        // Velocidad 100% fluida y continua a lo largo de la línea de la esfera
        const u = clampedT
        const uTail = Math.max(0, u - 0.16)
        const uMid = 0.5 * (u + uTail)

        const basis = rotatedRingsCache[tr.seg.ringIdx]
        if (!basis) continue

        const phiHead = tr.seg.phiStart + u * tr.seg.deltaPhi
        const phiMid = tr.seg.phiStart + uMid * tr.seg.deltaPhi
        const phiTail = tr.seg.phiStart + uTail * tr.seg.deltaPhi

        const cH = Math.cos(phiHead)
        const sH = Math.sin(phiHead)
        const hx3 = basis.e1.x * cH + basis.e2.x * sH
        const hy3 = basis.e1.y * cH + basis.e2.y * sH
        const hz3 = basis.e1.z * cH + basis.e2.z * sH

        const cM = Math.cos(phiMid)
        const sM = Math.sin(phiMid)
        const mx3 = basis.e1.x * cM + basis.e2.x * sM
        const my3 = basis.e1.y * cM + basis.e2.y * sM

        const cT = Math.cos(phiTail)
        const sT = Math.sin(phiTail)
        const tx3 = basis.e1.x * cT + basis.e2.x * sT
        const ty3 = basis.e1.y * cT + basis.e2.y * sT

        const hx = SPHERE_CX + hx3 * SPHERE_R
        const hy = SPHERE_CY + hy3 * SPHERE_R
        const mx = SPHERE_CX + mx3 * SPHERE_R
        const my = SPHERE_CY + my3 * SPHERE_R
        const tx = SPHERE_CX + tx3 * SPHERE_R
        const ty = SPHERE_CY + ty3 * SPHERE_R

        const env = 0.55 + 0.45 * Math.sin(Math.PI * clampedT)
        const depthFactor = hz3 >= 0 ? 0.75 + 0.25 * hz3 : 0.25
        const sparkOpacity = Math.min(1, env * depthFactor)
        const trailOpacity = Math.min(0.92, env * depthFactor * 0.82)
        const sparkScale = hz3 >= 0 ? 0.92 + 0.22 * hz3 : 0.62
        const trailPathStr = `M ${tx.toFixed(2)} ${ty.toFixed(2)} Q ${mx.toFixed(2)} ${my.toFixed(2)} ${hx.toFixed(2)} ${hy.toFixed(2)}`

        const trailGlowEl = sparkTrailGlowRefs.current[s]
        if (trailGlowEl) {
          trailGlowEl.setAttribute('d', trailPathStr)
          trailGlowEl.setAttribute('opacity', (trailOpacity * 0.68).toFixed(2))
        }

        const trailCoreEl = sparkTrailCoreRefs.current[s]
        if (trailCoreEl) {
          trailCoreEl.setAttribute('d', trailPathStr)
          trailCoreEl.setAttribute('opacity', trailOpacity.toFixed(2))
        }

        const sparkEl = sparkGroupRefs.current[s]
        if (sparkEl) {
          sparkEl.setAttribute(
            'transform',
            `translate(${hx.toFixed(2)} ${hy.toFixed(2)}) scale(${sparkScale.toFixed(2)})`
          )
          sparkEl.setAttribute('opacity', sparkOpacity.toFixed(2))
        }

        // Onda de destello fotónico que se desprende continuamente del punto mientras viaja y cruza uniones
        const flashEl = sparkFlashRefs.current[s]
        if (flashEl) {
          const emitPhase = (elapsedSec * 4.5 + s * 0.37) % 1
          const flashScale = 0.55 + emitPhase * 1.7
          const flashOp = (1 - emitPhase) * (1 - emitPhase) * 0.92
          flashEl.setAttribute('transform', `scale(${flashScale.toFixed(2)})`)
          flashEl.setAttribute('opacity', flashOp.toFixed(2))
        }
      }

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [])

  // Geometría inicial (spin = 0) para primer renderizado instantáneo sin parpadeos
  const initialRings = GEODESIC_RINGS.map((ring) => computeRingPathsAtSpin(ring, 1, 0))

  return (
    <div className={`relative flex items-center justify-center select-none ${boxClass}`}>
      <div className="relative h-full w-full flex items-center justify-center">
        <svg
          viewBox="0 0 200 200"
          className="pointer-events-none h-full w-full overflow-visible"
          aria-label="Esfera 3D de Interconexión Indie Clasificados"
        >
          <defs>
            {/* Gradiente metálico dorado para los arcos del hemisferio frontal */}
            <linearGradient id={wireGradFrontId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.92" />
            </linearGradient>

            {/* Gradiente dorado atenuado para los arcos del hemisferio posterior (profundidad 3D) */}
            <linearGradient id={wireGradBackId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.26" />
            </linearGradient>

            {/* Gradientes de flujo luminoso fluido por las interconexiones */}
            <linearGradient id={flowGrad1Id} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
              <stop offset="50%" stopColor="#fef08a" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.65" />
            </linearGradient>

            <linearGradient id={flowGrad2Id} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
              <stop offset="55%" stopColor="#fde047" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
            </linearGradient>

            {/* Relleno 100% dorado sólido desde el centro (sin hueco blanco) con halo de luz dorada */}
            <radialGradient id={photonCoreGradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="45%" stopColor="#fbbf24" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>

            {/* Destello de luz dorada con interior 100% relleno del mismo color dorado */}
            <radialGradient id={photonBurstGradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
              <stop offset="48%" stopColor="#fbbf24" stopOpacity="0.72" />
              <stop offset="78%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>

            {/* Efecto de sombra luminosa dorada (drop-shadow) para que se vea que genera e irradia luz */}
            <filter id={photonGlowFilterId} x="-120%" y="-120%" width="340%" height="340%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#f59e0b" floodOpacity="0.95" />
              <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#fbbf24" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* 1. Hemisferio posterior (z < 0): se desplaza de derecha a izquierda dando volumen 3D real */}
          <g fill="none" strokeLinecap="round">
            {initialRings.map((r, idx) => (
              <path
                key={`back-${idx}`}
                ref={(el) => {
                  backWireRefs.current[idx] = el
                }}
                d={r.backPath}
                stroke={`url(#${wireGradBackId})`}
                strokeWidth="0.9"
              />
            ))}
          </g>

          {/* 2. Horizonte esférico simétrico fino (mantiene la silueta esférica invariante) */}
          <circle
            cx={SPHERE_CX}
            cy={SPHERE_CY}
            r={SPHERE_R}
            fill="none"
            stroke={`url(#${wireGradFrontId})`}
            strokeWidth="1.15"
            opacity="0.82"
          />

          {/* 3. Hemisferio frontal (z >= 0): rota de Oeste a Este (izquierda a derecha) como la Tierra */}
          <g fill="none" strokeLinecap="round">
            {initialRings.map((r, idx) => (
              <React.Fragment key={`front-${idx}`}>
                <path
                  ref={(el) => {
                    frontWireBaseRefs.current[idx] = el
                  }}
                  d={r.frontPath}
                  stroke={`url(#${wireGradFrontId})`}
                  strokeWidth="1.35"
                />
                <path
                  ref={(el) => {
                    frontWireCoreRefs.current[idx] = el
                  }}
                  d={r.frontPath}
                  stroke="#fef08a"
                  strokeWidth="0.45"
                  opacity="0.7"
                />
              </React.Fragment>
            ))}
          </g>

          {/* 4. Flujo continuo y fluido de interconexión por las líneas de la esfera (pathLength="100") */}
          <g fill="none" strokeLinecap="round" opacity="0.78">
            {initialRings.map((r, idx) => {
              const spec = GEODESIC_RINGS[idx]
              return (
                <path
                  key={`flow-${idx}`}
                  ref={(el) => {
                    flowRefs.current[idx] = el
                  }}
                  pathLength={100}
                  d={r.flowPath}
                  stroke={`url(#${spec.useAltGrad ? flowGrad2Id : flowGrad1Id})`}
                  strokeWidth="1.15"
                  className={spec.flowClass}
                />
              )
            })}
          </g>

          {/* 5. Todos los puntos fotónicos en movimiento continuo y veloz por las líneas (sin puntos estáticos en las uniones) */}
          <g strokeLinecap="round">
            {Array.from({ length: NUM_TRAVELING_SPARKS }, (_, idx) => {
              const seg0 =
                ALL_NODE_SEGMENTS[(idx * 3) % Math.max(1, ALL_NODE_SEGMENTS.length)] ||
                ALL_NODE_SEGMENTS[0]
              const u0 = 0.06 + ((idx * 0.23) % 0.88)
              const uTail0 = Math.max(0, u0 - 0.16)
              const uMid0 = 0.5 * (u0 + uTail0)
              const basis0 = initialRings[seg0 ? seg0.ringIdx : 0]
              const phiH0 = seg0 ? seg0.phiStart + u0 * seg0.deltaPhi : 0
              const phiM0 = seg0 ? seg0.phiStart + uMid0 * seg0.deltaPhi : 0
              const phiT0 = seg0 ? seg0.phiStart + uTail0 * seg0.deltaPhi : 0

              const hx0 =
                SPHERE_CX +
                (basis0.e1.x * Math.cos(phiH0) + basis0.e2.x * Math.sin(phiH0)) * SPHERE_R
              const hy0 =
                SPHERE_CY +
                (basis0.e1.y * Math.cos(phiH0) + basis0.e2.y * Math.sin(phiH0)) * SPHERE_R
              const mx0 =
                SPHERE_CX +
                (basis0.e1.x * Math.cos(phiM0) + basis0.e2.x * Math.sin(phiM0)) * SPHERE_R
              const my0 =
                SPHERE_CY +
                (basis0.e1.y * Math.cos(phiM0) + basis0.e2.y * Math.sin(phiM0)) * SPHERE_R
              const tx0 =
                SPHERE_CX +
                (basis0.e1.x * Math.cos(phiT0) + basis0.e2.x * Math.sin(phiT0)) * SPHERE_R
              const ty0 =
                SPHERE_CY +
                (basis0.e1.y * Math.cos(phiT0) + basis0.e2.y * Math.sin(phiT0)) * SPHERE_R
              const d0 = `M ${tx0.toFixed(2)} ${ty0.toFixed(2)} Q ${mx0.toFixed(2)} ${my0.toFixed(2)} ${hx0.toFixed(2)} ${hy0.toFixed(2)}`

              return (
                <React.Fragment key={`spark-traveler-${idx}`}>
                  {/* Estela fluida dorada del fotón */}
                  <path
                    suppressHydrationWarning
                    ref={(el) => {
                      sparkTrailGlowRefs.current[idx] = el
                    }}
                    d={d0}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.6"
                    opacity="0.7"
                  />
                  <path
                    suppressHydrationWarning
                    ref={(el) => {
                      sparkTrailCoreRefs.current[idx] = el
                    }}
                    d={d0}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="0.9"
                    opacity="0.95"
                  />
                  {/* Punto fotónico relleno en dorado que emite sombra y destello de luz mientras viaja */}
                  <g
                    suppressHydrationWarning
                    ref={(el) => {
                      sparkGroupRefs.current[idx] = el
                    }}
                    transform={`translate(${hx0.toFixed(2)} ${hy0.toFixed(2)}) scale(1)`}
                    opacity="0.98"
                  >
                    {/* Destello de luz dorada que se desprende del punto hacia el exterior */}
                    <g
                      ref={(el) => {
                        sparkFlashRefs.current[idx] = el
                      }}
                      transform="scale(1)"
                      opacity="0.8"
                    >
                      <circle cx={0} cy={0} r={4.6} fill={`url(#${photonBurstGradId})`} />
                      <path
                        d="M 0 -5.6 Q 0.38 -0.38 5.6 0 Q 0.38 0.38 0 5.6 Q -0.38 0.38 -5.6 0 Q -0.38 -0.38 0 -5.6 Z"
                        fill="#fbbf24"
                        fillOpacity="0.92"
                      />
                    </g>
                    {/* Punto con interior 100% relleno del mismo color dorado y sombra luminosa */}
                    <circle cx={0} cy={0} r={3.8} fill={`url(#${photonCoreGradId})`} />
                    <circle
                      cx={0}
                      cy={0}
                      r={1.85}
                      fill="#f59e0b"
                      filter={`url(#${photonGlowFilterId})`}
                    />
                  </g>
                </React.Fragment>
              )
            })}
          </g>
        </svg>
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
        badge: 'Catálogo de Servicios',
        title: 'Servicios Profesionales y Oficios',
        description:
          'Técnicos, asesorías, mantenimiento, transporte y soluciones locales listas para contratar.',
        guideTip: '',
      }
    }
    if (cleanHref.includes('type=article')) {
      return {
        badge: 'Artículos Usados',
        title: 'Artículos de Segunda Mano y Oportunidades',
        description:
          'Artículos usados en buen estado, fotos reales y precios negociables publicados por vendedores locales.',
        guideTip: '',
      }
    }
    if (cleanHref.includes('type=product')) {
      return {
        badge: 'Productos Nuevos',
        title: 'Productos Nuevos de Pymes y Emprendedores',
        description:
          'Productos nuevos con disponibilidad inmediata, precios directos y comercios verificados.',
        guideTip: '',
      }
    }
    if (/^\/catalogo\/[^/?#]+/.test(cleanHref)) {
      return {
        badge: 'Ficha del Anuncio',
        title: 'Detalle Completo de la Publicación',
        description:
          'Galería de fotos, características técnicas, ubicación, datos del vendedor y contacto directo.',
        guideTip: '',
      }
    }
    return {
      badge: 'Explorador Comercial',
      title: 'Catálogo General de Indie Clasificados',
      description:
        'Todas las publicaciones activas con buscador inteligente por categoría, ciudad y rango de precio.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/directorio')) {
    return {
      badge: 'Directorio Comercial',
      title: 'Directorio de Vendedores y Comercios',
      description:
        'Perfiles de pymes, emprendedores y profesionales con su calificación, ciudad y catálogo.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/solicitudes')) {
    return {
      badge: 'Clasificados de Demanda',
      title: 'Solicitudes de Servicios y Productos',
      description:
        'Tablero donde los compradores registran la necesidad de un servicio o producto para que prestadores verificados los atiendan y reciban su calificación.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/publicar')) {
    if (cleanHref.includes('type=service')) {
      return {
        badge: 'Nueva Publicación',
        title: 'Publicar un Servicio Profesional',
        description:
          'Formulario guiado para describir tu servicio, definir tu tarifa o cotización, cobertura y WhatsApp.',
        guideTip: '',
      }
    }
    if (cleanHref.includes('type=article')) {
      return {
        badge: 'Nueva Publicación',
        title: 'Publicar un Artículo Usado',
        description:
          'Formulario paso a paso para subir fotos reales de tu artículo, detallar su estado y fijar el precio.',
        guideTip: '',
      }
    }
    return {
      badge: 'Nueva Publicación',
      title: 'Publicar un Producto en el Catálogo',
      description:
        'Estudio de publicación para crear la ficha de tu producto con fotos, precio, categoría y contacto directo.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/mis-publicaciones') || cleanHref.startsWith('/inventario')) {
    return {
      badge: 'Gestión de Inventario',
      title: 'Mis Publicaciones e Inventario',
      description:
        'Listado de tus anuncios para editar precios, actualizar fotos, pausar o impulsar su visibilidad.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/mis-servicios')) {
    return {
      badge: 'Gestión de Servicios',
      title: 'Panel de Mis Servicios Publicados',
      description:
        'Tus servicios activos para actualizar tarifas, horarios de atención y estado de publicación.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/mis-campanas')) {
    return {
      badge: 'Rendimiento Publicitario',
      title: 'Mis Campañas y Estadísticas',
      description:
        'Estado de tus anuncios promocionados, tiempo restante de exhibición, vistas y clics a WhatsApp.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/promocionar')) {
    if (cleanHref.includes('tab=recharge')) {
      return {
        badge: 'Billetera Comercial',
        title: 'Recarga de Saldo Publicitario',
        description:
          'Opciones para recargar créditos en tu billetera y activar promociones en las pasarelas.',
        guideTip: '',
      }
    }
    return {
      badge: 'Impulsar Ventas',
      title: 'Configurar Campaña Publicitaria',
      description:
        'Destaca tus anuncios en la Gran Vitrina Principal o en las pasarelas continuas de alto tráfico.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/admin')) {
    if (cleanHref.includes('section=ads')) {
      return {
        badge: 'Administración',
        title: 'Moderación de Campañas Publicitarias',
        description:
          'Control administrativo de órdenes de pauta, tiempos de exhibición y campañas activas en vitrina.',
        guideTip: '',
      }
    }
    if (cleanHref.includes('section=adpage')) {
      return {
        badge: 'Administración Publicidad',
        title: 'Control de Página de Publicidad y Pasarelas',
        description:
          'Administración de pasarelas en la página de publicidad, nuevos catálogos exclusivos, costos de campaña y vendedores habilitados.',
        guideTip: '',
      }
    }
    if (cleanHref.includes('section=balances')) {
      return {
        badge: 'Administración',
        title: 'Control de Billeteras y Saldos',
        description:
          'Gestión de recargas de saldo, validación de comprobantes y asignación de créditos publicitarios.',
        guideTip: '',
      }
    }
    if (cleanHref.includes('section=users')) {
      return {
        badge: 'Administración',
        title: 'Gestión de Usuarios y Permisos',
        description:
          'Directorio completo de usuarios registrados, asignación de roles y verificación oficial de comercios.',
        guideTip: '',
      }
    }
    return {
      badge: 'Catálogo General',
      title: 'Moderación de Artículos y Servicios',
      description:
        'Centro de control para revisar, aprobar, clasificar o editar los artículos y servicios publicados en el catálogo.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/cuenta')) {
    return {
      badge: 'Perfil Comercial',
      title: 'Mi Cuenta y Datos de Contacto',
      description:
        'Configuración de tu nombre comercial, WhatsApp de ventas, ciudad y descripción de tu negocio.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/login') || cleanHref.startsWith('/registro')) {
    return {
      badge: 'Acceso Comercial',
      title: 'Iniciar Sesión o Crear Cuenta',
      description:
        'Panel de vendedor para publicar anuncios, administrar tu inventario y promocionar tu negocio.',
      guideTip: '',
    }
  }

  if (cleanHref.startsWith('/bienvenida')) {
    return {
      badge: 'Dashboard',
      title: 'Dashboard y Resumen de tu Perfil',
      description:
        'Resumen rápido de tus publicaciones, campañas, compras y actividad reciente según tu perfil.',
      guideTip: '',
    }
  }

  return {
    badge: 'Vitrina Principal',
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
        {/* Luz ambiental decorativa dorada de la esfera de interconexiones */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-yellow-500/15 blur-3xl" />

        {/* Cabecera de Telemetría */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-3 mb-6">
          <span className="text-xs sm:text-sm font-bold tracking-tight text-zinc-700 dark:text-zinc-200 truncate">
            Indie Clasificados, economía en circulación
          </span>
          <div className="flex items-center justify-end gap-2 shrink-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
            </span>
            <span className="font-mono text-[11px] font-bold tracking-wide text-amber-600 dark:text-amber-400">
              Conectando
            </span>
          </div>
        </div>

        {/* Esfera del Logo con Flujo de Iluminación de Interconexiones + Descripción Contextual */}
        <div className="flex flex-col items-center text-center">
          <QuantumGooeyCore size="lg" />

          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 px-3 py-0.5 text-[11px] font-extrabold text-amber-800 dark:text-amber-300">
            {routeInfo.badge}
          </span>

          <h2 className="mt-2.5 text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            {displayTitle}
          </h2>

          <p className="mt-1.5 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-md">
            {displayDescription}
          </p>

          {/* Barra de Progreso Dorada Uniforme con el Porcentaje Integrado Dentro de la Punta */}
          <div className="mt-5 relative h-5 w-full rounded-full bg-amber-950/10 dark:bg-amber-950/40 border border-amber-400/35 dark:border-amber-500/35 p-0.5 shadow-[0_0_16px_rgba(245,158,11,0.22),inset_0_1px_2px_rgba(180,83,9,0.2)]">
            {/* Halo de sombra luminosa dorada uniforme proyectada bajo el avance de la barra */}
            <div
              className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 h-5 rounded-full bg-amber-400/60 blur-md transition-all duration-200 min-w-[3.25rem]"
              style={{ width: `${progress}%` }}
            />

            {/* Relleno principal de un mismo color dorado uniforme con sombra de luz pulsante, destellos y porcentaje en la punta */}
            <div
              className="ic-gold-progress-fill relative h-full min-w-[3.25rem] overflow-hidden rounded-full bg-amber-400 flex items-center justify-end pr-2.5 transition-all duration-200"
              style={{ width: `${progress}%` }}
            >
              {/* Onda principal de destello de luz dorada */}
              <div className="ic-shimmer-bar pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-yellow-100/95 to-transparent" />
              {/* Segunda onda armónica de brillo dorado */}
              <div className="ic-shimmer-bar-secondary pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-amber-200/85 to-transparent" />

              {/* Porcentaje integrado dentro de la barra en la punta con alto contraste */}
              <span className="relative z-10 font-mono text-[10px] font-black tabular-nums leading-none text-zinc-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
                {progress}%
              </span>
            </div>
          </div>

          {/* Indicadores de Módulos Activos (sin emojis) */}
          <div className="mt-5 grid grid-cols-3 gap-2 w-full text-left">
            <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 p-2.5">
              <div className="text-[9px] font-mono uppercase text-zinc-400">Vitrina</div>
              <div className="mt-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate">
                Activa
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 p-2.5">
              <div className="text-[9px] font-mono uppercase text-zinc-400">Catálogo</div>
              <div className="mt-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400 truncate">
                Sincronizado
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 p-2.5">
              <div className="text-[9px] font-mono uppercase text-zinc-400">Usuarios</div>
              <div className="mt-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate">
                Conexión Activa
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
  const [isInitialBoot, setIsInitialBoot] = useState(true)
  const [isRoutePending, setIsRoutePending] = useState(false)
  const [externalLoaders, setExternalLoaders] = useState(0)
  const [isOverlayActive, setIsOverlayActive] = useState(true)
  const [progress, setProgress] = useState(24)
  const [targetHref, setTargetHref] = useState<string>('/')

  const currentRouteKey = `${pathname || '/'}?${searchParams ? searchParams.toString() : ''}`
  const prevRouteKeyRef = React.useRef<string>(currentRouteKey)
  const navStartTimeRef = React.useRef<number>(0)
  const settleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    navStartTimeRef.current = Date.now()
    const bootTimer = setTimeout(() => {
      setIsInitialBoot(false)
    }, 900)
    return () => clearTimeout(bootTimer)
  }, [])

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
  const hasAnyActivePhase =
    isInitialBoot || isRoutePending || externalLoaders > 0 || manualNavigationActive

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

  const effectiveHref = lastPendingHref || targetHref || pathname || '/'

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


