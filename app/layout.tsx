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
  themeColor: '#ffffff',
}

export const metadata: Metadata = {
  title: 'Indie Clasificados | Economía en Circulación',
  description: 'Indie Clasificados — Economía en Circulación. Catálogo comercial mobile-first para conectar compradores con pequeñas empresas, servicios y emprendedores locales.',
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('marketplace_theme');var d=document.documentElement;if(t==='dark'){d.classList.add('dark');d.style.colorScheme='dark';}else{d.classList.remove('dark');d.style.colorScheme='light';}}catch(e){}try{if(typeof performance!=='undefined'&&typeof performance.measure==='function'){var origMeasure=performance.measure.bind(performance);performance.measure=function(){try{return origMeasure.apply(this,arguments);}catch(err){return undefined;}};}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100 selection:bg-emerald-500 selection:text-white">
        <ClientProviders>
          <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left Sidebar Navigation (Exclusive navigation driver) */}
            <AppSidebar />

            {/* Central Workspace: Clean content area without navigation links */}
            <div className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">
              <div className="flex-1 flex flex-col">{children}</div>
              <Footer />
              <AppMobileHeader />
            </div>
          </div>
        </ClientProviders>
      </body>
    </html>
  )
}
