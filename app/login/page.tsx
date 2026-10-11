'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || searchParams.get('next') || '/catalogo'
  const { t, locale } = useTranslation()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const supabase = createClient()

  const testUsers = [
    {
      role: 'buyer',
      title: t.auth.buyerRole,
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      icon: '🛒',
      email: 'comprador@marketplace.com',
      password: 'Password123!',
      subtitle: 'Carlos Comprador',
      desc: locale === 'en' ? 'Buyer role: browse catalog and contact sellers' : 'Rol comprador: explora catálogo y contacta vendedores',
    },
    {
      role: 'seller',
      title: `${t.auth.sellerRole} 1`,
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      icon: '🥖',
      email: 'vendedor@marketplace.com',
      password: 'Password123!',
      subtitle: 'Panadería & Café El Alba',
      desc: locale === 'en' ? 'Seller: Panadería & Café El Alba (Medellín)' : 'Vendedor: Panadería & Café El Alba (Medellín)',
    },
    {
      role: 'seller2',
      title: `${t.auth.sellerRole} 2`,
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      icon: '🔧',
      email: 'vendedor2@marketplace.com',
      password: 'Password123!',
      subtitle: 'Taller Moto & Auto Express',
      desc: locale === 'en' ? 'Seller: Taller Moto & Auto Express (Bogotá)' : 'Vendedor: Taller Moto & Auto Express (Bogotá)',
    },
    {
      role: 'seller3',
      title: `${t.auth.sellerRole} 3`,
      badge: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300',
      icon: '👗',
      email: 'vendedor3@marketplace.com',
      password: 'Password123!',
      subtitle: 'Boutique & Modas Elegancia',
      desc: locale === 'en' ? 'Seller: Boutique & Modas Elegancia (Cali)' : 'Vendedor: Boutique & Modas Elegancia (Cali)',
    },
    {
      role: 'admin',
      title: t.auth.adminRole,
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      icon: '🛡️',
      email: 'admin@marketplace.com',
      password: 'Password123!',
      subtitle: 'Admin Marketplace',
      desc: locale === 'en' ? 'Admin role: full permissions and moderation' : 'Rol admin: moderación y control total',
    },
  ]

  const executeLogin = async (targetEmail: string, targetPass: string) => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: targetPass,
      })

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          throw new Error(
            locale === 'en'
              ? 'Email not confirmed in Supabase. Run sql/004_seed_test_users.sql in SQL Editor to confirm automatically.'
              : 'El correo no está confirmado en Supabase. Corre el script sql/004_seed_test_users.sql en el SQL Editor para confirmar todos los usuarios automáticamente.'
          )
        }
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error(
            locale === 'en'
              ? 'Invalid credentials. If you have not seeded test users yet, run sql/004_seed_test_users.sql in Supabase SQL Editor.'
              : 'Credenciales no encontradas. Si aún no corriste el script de usuarios de prueba, ejecuta sql/004_seed_test_users.sql en el SQL Editor de Supabase.'
          )
        }
        throw error
      }

      setSuccessMsg(locale === 'en' ? 'Login successful! Redirecting...' : '¡Inicio de sesión exitoso! Redirigiendo...')
      router.push(redirectTo)
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || (locale === 'en' ? 'Login error' : 'Error al iniciar sesión'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'login') {
      await executeLogin(email, password)
    } else {
      setLoading(true)
      setErrorMsg(null)
      setSuccessMsg(null)

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })

        if (error) throw error

        if (data.session) {
          setSuccessMsg(locale === 'en' ? 'Account created and logged in!' : '¡Cuenta creada e inicio de sesión exitoso!')
          router.push(redirectTo)
          router.refresh()
        } else {
          setSuccessMsg(
            locale === 'en'
              ? 'Registration complete! Check email confirmation or run sql/004_seed_test_users.sql.'
              : '¡Registro completado! Si Supabase exige confirmación de correo, puedes desactivarlo o ejecutar sql/004_seed_test_users.sql.'
          )
        }
      } catch (err: any) {
        setErrorMsg(err.message || (locale === 'en' ? 'Registration error' : 'Error al registrarse'))
      } finally {
        setLoading(false)
      }
    }
  }

  const handleQuickLogin = (testEmail: string, testPass: string) => {
    setEmail(testEmail)
    setPassword(testPass)
    setMode('login')
    executeLogin(testEmail, testPass)
  }

  return (
    <div className="w-full max-w-lg space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white text-xl">
          M
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {mode === 'login' ? t.auth.loginTitle : t.auth.signupTitle}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {mode === 'login'
            ? (locale === 'en' ? 'Sign in with your credentials or select a test role' : 'Accede con tus credenciales o usa un rol de prueba')
            : (locale === 'en' ? 'Start publishing your products and services' : 'Empieza a publicar tus productos y servicios')}
        </p>
      </div>

      {/* Panel de usuarios de prueba (1-clic) */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <span>⚡</span>
            <span>{locale === 'en' ? 'Quick test logins (1-click)' : 'Accesos rápidos de prueba (1-clic)'}</span>
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">Password123!</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {testUsers.map((user) => (
            <button
              key={user.email}
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin(user.email, user.password)}
              className="flex flex-col items-start p-2.5 rounded-lg border border-zinc-200 bg-white hover:border-emerald-500 hover:shadow-xs transition-all text-left dark:border-zinc-700 dark:bg-zinc-800 disabled:opacity-50"
            >
              <div className="flex items-center gap-1.5 w-full">
                <span className="text-sm">{user.icon}</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {user.title}
                </span>
              </div>
              <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium truncate w-full mt-0.5">
                {user.subtitle}
              </span>
              <span className="text-[9px] text-zinc-400 font-mono truncate w-full" title={user.email}>
                {user.email}
              </span>
              <span className="mt-1 inline-block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                {locale === 'en' ? 'Log in →' : 'Entrar →'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-4 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300 leading-relaxed">
          <strong>{t.common.error}:</strong> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg bg-emerald-50 p-4 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 leading-relaxed">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              {t.auth.fullName}
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Juan Pérez / Panadería San José"
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            {t.auth.email}
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            {t.auth.password}
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={locale === 'en' ? 'Minimum 6 characters' : 'Mínimo 6 caracteres'}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 transition-colors"
        >
          {loading
            ? t.common.loading
            : mode === 'login'
            ? t.auth.submitLogin
            : t.auth.submitSignup}
        </button>
      </form>

      <div className="text-center text-sm">
        {mode === 'login' ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            <button
              type="button"
              onClick={() => setMode('signup')}
              className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              {t.auth.dontHaveAccount}
            </button>
          </p>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            <button
              type="button"
              onClick={() => setMode('login')}
              className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              {t.auth.alreadyHaveAccount}
            </button>
          </p>
        )}
      </div>

      <div className="border-t border-zinc-200 pt-4 text-center dark:border-zinc-800">
        <Link
          href="/catalogo"
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          ← {locale === 'en' ? 'Return to catalog without signing in' : 'Volver al catálogo sin iniciar sesión'}
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center text-sm text-zinc-500">...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
