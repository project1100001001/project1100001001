'use client'

import React from 'react'
import { ThemeProvider } from './ThemeProvider'
import { LanguageProvider } from '@/lib/i18n'
import { SidebarProvider } from './SidebarContext'
import { GlobalNavigationLoader } from './AvantGardeLoader'

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
