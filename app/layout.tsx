import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import AppSidebar from '@/components/AppSidebar'
import AppMobileHeader from '@/components/AppMobileHeader'
import Footer from '@/components/Footer'
import ClientProviders from '@/components/ClientProviders'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
}

export const metadata: Metadata = {
  title: 'Indie Clasificados | Pymes, Emprendedores y Servicios',
  description: 'Indie Clasificados — Catálogo comercial mobile-first para conectar compradores con pequeñas empresas, servicios y emprendedores locales.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const themeInitScript = `
    (function() {
      try {
        var saved = localStorage.getItem('marketplace_theme');
        var isDark = false;
        if (saved === 'dark') {
          isDark = true;
        } else if (saved === 'light') {
          isDark = false;
        } else {
          isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        var root = document.documentElement;
        if (isDark) {
          root.classList.add('dark');
          root.style.colorScheme = 'dark';
        } else {
          root.classList.remove('dark');
          root.style.colorScheme = 'light';
        }
      } catch (e) {}
    })();
  `

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100 selection:bg-emerald-500 selection:text-white">
        <ClientProviders>
          <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left Sidebar Navigation (Exclusive navigation driver) */}
            <AppSidebar />

            {/* Central Workspace: Clean content area without navigation links */}
            <div className="flex-1 flex flex-col min-w-0">
              <AppMobileHeader />
              <div className="flex-1 flex flex-col">{children}</div>
              <Footer />
            </div>
          </div>
        </ClientProviders>
      </body>
    </html>
  )
}
