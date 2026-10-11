'use client'

import Link from 'next/link'
import ListingCard from '@/components/ListingCard'
import type { Category, ListingWithRelations } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface HomeClientViewProps {
  categories: Category[]
  recentListings: ListingWithRelations[]
}

const categoryIcons: Record<string, string> = {
  alimentos: '🍲',
  'servicios-hogar': '🔧',
  belleza: '💇',
  'ropa-accesorios': '👗',
  'clases-educacion': '📚',
  otros: '✨',
}

export default function HomeClientView({
  categories,
  recentListings,
}: HomeClientViewProps) {
  const { t } = useTranslation()

  return (
    <main className="flex-1 bg-zinc-50/50 pb-20 dark:bg-zinc-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 mb-6">
            {t.home.badge}
          </span>

          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
            {t.home.heroTitlePrefix}
            <span className="text-emerald-600 dark:text-emerald-500">
              {t.home.heroTitleHighlight}
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
            {t.home.heroSubtitle}
          </p>

          {/* Quick Search Bar */}
          <form
            action="/catalogo"
            method="GET"
            className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-zinc-300 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
          >
            <div className="pl-3 text-zinc-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              name="q"
              placeholder={t.home.searchPlaceholder}
              className="flex-1 bg-transparent px-2 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              {t.home.searchBtn}
            </button>
          </form>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t.home.categoriesTitle}
          </h2>
          <Link
            href="/catalogo"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          >
            {t.home.viewAllCategories}
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalogo?category=${category.slug}`}
              className="group flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-4 text-center transition-all hover:-translate-y-1 hover:border-emerald-500 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="text-3xl transition-transform group-hover:scale-110">
                {categoryIcons[category.slug] || '🏷️'}
              </span>
              <span className="mt-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-1">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured / Recent Listings */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t.home.recentTitle}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {t.home.recentSubtitle}
            </p>
          </div>

          <Link
            href="/catalogo"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          >
            {t.home.viewAllRecent}
          </Link>
        </div>

        {recentListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-4xl">🛍️</span>
            <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {t.home.emptyRecentTitle}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
              {t.home.emptyRecentDesc}
            </p>
            <div className="mt-6">
              <Link
                href="/publicar"
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
              >
                {t.home.createFirstListingBtn}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* Seller CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-800 px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t.home.ctaTitle}
            </h2>
            <p className="mt-3 text-base text-emerald-100">
              {t.home.ctaSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/publicar"
                className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-800 shadow-sm hover:bg-emerald-50 transition-colors"
              >
                {t.home.ctaPublishBtn}
              </Link>
              <Link
                href="/catalogo"
                className="rounded-xl border border-emerald-400 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-600/50 transition-colors"
              >
                {t.home.ctaExploreBtn}
              </Link>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 text-9xl opacity-10 select-none pointer-events-none">
            📈
          </div>
        </div>
      </section>
    </main>
  )
}
