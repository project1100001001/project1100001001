'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import {
  ADMIN_PROFILE,
  BUYER_PROFILES,
  SERVICE_SELLER_PROFILES,
  USED_SELLER_PROFILES,
  NEW_SELLER_PROFILES,
  TestProfile,
} from '@/lib/testProfiles'

interface TestProfilesModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TestProfilesModal({ isOpen, onClose }: TestProfilesModalProps) {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [activeTab, setActiveTab] = useState<'buyer' | 'service' | 'used' | 'new'>('buyer')
  const [searchTerm, setSearchTerm] = useState('')

  const modalRef = useRef<HTMLDivElement>(null)

  // Cargar usuario actual al montar y escuchar cambios
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      setUser(currentUser)
    }

    if (isOpen) {
      checkAuth()
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [isOpen, supabase])

  // Cerrar modal al hacer clic afuera o con tecla Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Iniciar sesión con un perfil específico
  const handleLogin = async (profile: TestProfile) => {
    setLoading(true)
    setStatusMsg({
      text: `Iniciando sesión como ${profile.businessName || profile.name}...`,
      type: 'info',
    })

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: profile.password,
      })

      if (error) {
        if (
          error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('email not confirmed')
        ) {
          throw new Error(
            `Credenciales no encontradas para ${profile.email}. Recuerda ejecutar 'sql/015_seed_30_sellers_and_10_buyers.sql' en Supabase SQL Editor.`
          )
        }
        throw error
      }

      setStatusMsg({
        text: `¡Sesión iniciada con éxito como ${profile.businessName || profile.name}!`,
        type: 'success',
      })

      setTimeout(() => {
        onClose()
        router.refresh()
        window.location.reload()
      }, 400)
    } catch (err: any) {
      setStatusMsg({
        text: err?.message || 'Error al conectar perfil',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  // Lista filtrada según pestaña y término de búsqueda
  const currentList = useMemo(() => {
    let list: TestProfile[] = []
    if (activeTab === 'buyer') list = BUYER_PROFILES
    else if (activeTab === 'service') list = SERVICE_SELLER_PROFILES
    else if (activeTab === 'used') list = USED_SELLER_PROFILES
    else if (activeTab === 'new') list = NEW_SELLER_PROFILES

    if (!searchTerm.trim()) return list
    const term = searchTerm.toLowerCase().trim()
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.businessName && p.businessName.toLowerCase().includes(term)) ||
        p.city.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term)
    )
  }, [activeTab, searchTerm])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header del Modal */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-lg font-bold text-white shadow-sm">
              👥
            </span>
            <div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                Seleccionar Perfil para Pruebas (40 Perfiles)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Inicia sesión con 1 clic en cualquiera de las 40 cuentas o como Administrador
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Acceso Rápido Administrador */}
        <div className="px-4 py-2.5 bg-purple-50/70 border-b border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-purple-900 dark:text-purple-200">
            <span>🛡️</span>
            <span className="font-bold">Administrador General:</span>
            <span className="font-mono text-[11px] text-purple-700 dark:text-purple-300">admin@marketplace.com</span>
          </div>
          <button
            type="button"
            onClick={() => handleLogin(ADMIN_PROFILE)}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1 text-xs font-black text-white shadow-2xs hover:bg-purple-500 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            Conectar Admin
          </button>
        </div>

        {/* Notificación de estado temporal */}
        {statusMsg && (
          <div
            className={`mx-4 mt-2.5 rounded-xl p-2.5 text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                : statusMsg.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'
                : 'bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button
              type="button"
              onClick={() => setStatusMsg(null)}
              className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Pestañas de Categorización de Perfiles */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-1.5 gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('buyer')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'buyer'
                ? 'bg-white text-blue-700 shadow-xs dark:bg-zinc-800 dark:text-blue-300 ring-1 ring-blue-500/20'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            <span>🛒</span>
            <span>Compradores (10)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('service')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'service'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-zinc-800 dark:text-emerald-300 ring-1 ring-emerald-500/20'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            <span>🛠️</span>
            <span>Servicios (10)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('used')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'used'
                ? 'bg-white text-amber-700 shadow-xs dark:bg-zinc-800 dark:text-amber-300 ring-1 ring-amber-500/20'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            <span>📦</span>
            <span>Usados (10)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'new'
                ? 'bg-white text-purple-700 shadow-xs dark:bg-zinc-800 dark:text-purple-300 ring-1 ring-purple-500/20'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            <span>🛍️</span>
            <span>Nuevos (10)</span>
          </button>
        </div>

        {/* Buscador Rápido */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
          <input
            type="text"
            placeholder="Buscar por nombre, negocio o ciudad (ej. Bogotá, plomería, zapatos)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {/* Lista Scrollable de Perfiles */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {currentList.map((p) => {
            const isCurrentActive = user?.email === p.email

            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-3 flex items-center justify-between gap-3 transition-all ${
                  isCurrentActive
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30'
                    : 'border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-zinc-700 text-lg shadow-2xs">
                    {p.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {p.businessName || p.name}
                      </span>
                      <span className="rounded-md bg-zinc-200/70 px-1.5 py-0.5 text-[9px] font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                        📍 {p.city}
                      </span>
                      {isCurrentActive && (
                        <span className="rounded-full bg-emerald-600 px-2 py-0.2 text-[9px] font-black text-white">
                          ACTIVO
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {p.businessName ? `${p.name} • ` : ''}
                      <span className="font-mono text-[10px]">{p.email}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 line-clamp-1">
                      {p.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleLogin(p)}
                  disabled={loading || isCurrentActive}
                  className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer ${
                    isCurrentActive
                      ? 'bg-zinc-200 text-zinc-500 cursor-default dark:bg-zinc-800 dark:text-zinc-400'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95'
                  }`}
                >
                  {isCurrentActive ? 'En uso' : 'Conectar'}
                </button>
              </div>
            )
          })}

          {currentList.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-500">
              No se encontraron perfiles que coincidan con &quot;{searchTerm}&quot;
            </div>
          )}
        </div>

        {/* Footer Informativo */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
          <span>
            🔑 Contraseña universal: <strong className="font-mono text-zinc-700 dark:text-zinc-300">Password123!</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer"
          >
            Cerrar selector
          </button>
        </div>
      </div>
    </div>
  )
}
