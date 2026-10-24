'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useTranslation } from '@/lib/i18n'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'
import MobileBottomNav from './MobileBottomNav'

export default function Navbar() {
  const { t } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('app_user')
          .select('role')
          .eq('id', user.id)
          .single()
        setRole(profile?.role || null)

        if (profile?.role === 'admin') {
          const { count: listingCount } = await supabase
            .from('listing')
            .select('*', { count: 'exact', head: true })
            .in('status', ['submitted', 'pending_review'])

          let adCount = 0
          try {
            const { count, error } = await supabase
              .from('ad_order')
              .select('*', { count: 'exact', head: true })
              .in('status', ['submitted', 'in_review'])
            if (!error && typeof count === 'number') {
              adCount = count
            }
          } catch {
            // silently continue if ad_order table is not in cache yet
          }

          setPendingCount((listingCount || 0) + adCount)
        }
      } else {
        setRole(null)
        setPendingCount(0)
      }

      setLoading(false)
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUser()
      } else {
        setRole(null)
        setPendingCount(0)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-zinc-200 dark:border-zinc-700 text-base shadow-sm transition-transform group-hover:scale-105">
                🛠️
              </span>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Indie Clasificados
                </span>
                <span className="hidden sm:block text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">
                  Pymes y Emprendedores
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-4 text-xs font-semibold">
              <Link
                href="/catalogo"
                className="text-zinc-600 hover:text-emerald-600 transition-colors dark:text-zinc-300 dark:hover:text-emerald-400"
              >
                {t.nav.catalog}
              </Link>
              {user && (
                <>
                  <Link
                    href="/mis-publicaciones"
                    className="text-zinc-600 hover:text-emerald-600 transition-colors dark:text-zinc-300 dark:hover:text-emerald-400"
                  >
                    {t.nav.myListings}
                  </Link>
                  <Link
                    href="/mis-campanas"
                    className="text-zinc-600 hover:text-emerald-600 transition-colors dark:text-zinc-300 dark:hover:text-emerald-400 flex items-center gap-1"
                  >
                    <span>📢</span>
                    <span>{t.nav.myCampaigns}</span>
                  </Link>
                </>
              )}
              {role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-purple-700 font-bold hover:text-purple-900 transition-colors dark:text-purple-400 dark:hover:text-purple-300"
                >
                  <span>🛡️</span>
                  <span>{t.nav.moderation}</span>
                  {pendingCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow-xs">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )}
            </nav>
          </div>

          {/* Action Buttons & Switches */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Theme & Language Switchers */}
            <div className="hidden sm:flex items-center gap-1.5">
              <LanguageSwitcher compact />
              <ThemeToggle />
            </div>

            {/* Desktop Publish Button */}
            <Link
              href="/publicar"
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <span>➕</span>
              <span>{t.nav.publish}</span>
            </Link>

            {/* User auth state buttons */}
            {!loading && (
              <div className="hidden sm:flex items-center gap-2">
                {user ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs text-zinc-500 max-w-[120px] lg:max-w-[160px] truncate"
                      title={user.email}
                    >
                      {user.email}
                    </span>
                    {role && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          role === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : role === 'seller'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {role}
                      </span>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="rounded-xl border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {t.nav.signOut}
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-xl border border-zinc-300 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {t.nav.signIn}
                  </Link>
                )}
              </div>
            )}

            {/* Mobile quick icons (Language & Theme on small screens) */}
            <div className="flex sm:hidden items-center gap-1">
              <LanguageSwitcher compact />
              <ThemeToggle />
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              aria-label={t.nav.menu}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MOBILE DRAWER / SLIDE-OVER MENU                          */}
        {/* ======================================================== */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-150">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Panel */}
            <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white p-6 shadow-2xl dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="space-y-6">
                {/* Header of Drawer */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-black text-white text-xs">
                      IC
                    </span>
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      Indie Clasificados
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    aria-label={t.common.close}
                  >
                    ✕
                  </button>
                </div>

                {/* User status in Drawer */}
                {user ? (
                  <div className="rounded-2xl bg-zinc-50 p-3.5 border border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700 space-y-1">
                    <div className="text-[11px] text-zinc-500">Sesión iniciada como:</div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {user.email}
                    </div>
                    {role && (
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mt-1 ${
                          role === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : role === 'seller'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        Rol: {role}
                      </span>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                  >
                    <span>🔑</span>
                    <span>{t.nav.signIn}</span>
                  </Link>
                )}

                {/* Navigation Links in Drawer */}
                <nav className="flex flex-col space-y-1 text-sm font-semibold">
                  <Link
                    href="/catalogo"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span>🔍</span>
                    <span>{t.nav.catalog}</span>
                  </Link>

                  <Link
                    href="/publicar"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors font-bold"
                  >
                    <span>➕</span>
                    <span>{t.nav.publish}</span>
                  </Link>

                  {user && (
                    <>
                      <Link
                        href="/mis-publicaciones"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <span>📦</span>
                        <span>{t.nav.myListings}</span>
                      </Link>

                      <Link
                        href="/mis-campanas"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-950/40 transition-colors"
                      >
                        <span>📢</span>
                        <span>{t.nav.myCampaigns}</span>
                      </Link>
                    </>
                  )}

                  {role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-purple-800 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-300 font-bold"
                    >
                      <div className="flex items-center gap-3">
                        <span>🛡️</span>
                        <span>{t.nav.moderation}</span>
                      </div>
                      {pendingCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  )}
                </nav>

                {/* Settings Section: Theme and Language */}
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Preferencias
                  </div>

                  <div className="space-y-2">
                    <ThemeToggle showLabel />
                    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/60">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {t.nav.language}:
                      </span>
                      <LanguageSwitcher />
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer (Sign out) */}
              {user && (
                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-300 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span>🚪</span>
                    <span>{t.nav.signOut}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        userRole={role}
        hasUser={!!user}
      />
    </>
  )
}
