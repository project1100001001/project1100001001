'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white shadow-sm transition-transform group-hover:scale-105">
              M
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Marketplace
              </span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                Pymes y Emprendedores
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link
              href="/catalogo"
              className="text-zinc-600 hover:text-emerald-600 transition-colors dark:text-zinc-300 dark:hover:text-emerald-400"
            >
              Explorar Catálogo
            </Link>
            {user && (
              <Link
                href="/mis-publicaciones"
                className="text-zinc-600 hover:text-emerald-600 transition-colors dark:text-zinc-300 dark:hover:text-emerald-400"
              >
                Mis Publicaciones
              </Link>
            )}
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/publicar"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Publicar Anuncio</span>
          </Link>

          {!loading && (
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="hidden text-xs text-zinc-500 sm:inline-block max-w-[150px] truncate" title={user.email}>
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
