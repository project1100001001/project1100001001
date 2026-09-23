import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Marketplace de Pymes y Emprendedores',
  description: 'Catálogo comercial para conectar compradores con pequeñas empresas locales.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
        <Navbar />
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="border-t border-zinc-200 bg-white py-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-emerald-600 font-bold text-white text-xs">
                M
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                Marketplace Pymes
              </span>
            </div>
            <p>Conectando emprendedores, servicios locales y compradores.</p>
            <div className="flex gap-4">
              <a href="/catalogo" className="hover:text-emerald-600">
                Catálogo
              </a>
              <a href="/publicar" className="hover:text-emerald-600">
                Publicar
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
