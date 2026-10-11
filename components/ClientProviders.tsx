'use client'

import React from 'react'
import { ThemeProvider } from './ThemeProvider'
import { LanguageProvider } from '@/lib/i18n'
import { SidebarProvider } from './SidebarContext'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}
