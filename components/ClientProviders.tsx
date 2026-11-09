'use client'

import React from 'react'
import { ThemeProvider } from './ThemeProvider'
import { LanguageProvider } from '@/lib/i18n'
import { SidebarProvider } from './SidebarContext'
import { GlobalNavigationLoader } from './AvantGardeLoader'

if (typeof window !== 'undefined' && typeof performance !== 'undefined' && typeof performance.measure === 'function') {
  try {
    const origMeasure = performance.measure.bind(performance)
    performance.measure = function (...args: any[]) {
      try {
        return (origMeasure as any)(...args)
      } catch {
        return undefined as any
      }
    }
  } catch {
    // ignore if read-only
  }
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <GlobalNavigationLoader />
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}
