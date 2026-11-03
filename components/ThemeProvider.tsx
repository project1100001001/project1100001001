'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
})

const STORAGE_KEY = 'marketplace_theme'

function getSavedManualTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark') return 'dark'
    if (saved === 'light') return 'light'
  } catch {
    // Ignore storage errors
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    const initial = getSavedManualTheme()
    setThemeState(initial)
    const root = document.documentElement
    if (initial === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
  }, [])

  const applyAndSaveTheme = (newTheme: Theme) => {
    const next: Theme = newTheme === 'dark' ? 'dark' : 'light'
    setThemeState(next)
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (next === 'dark') {
        root.classList.add('dark')
        root.style.colorScheme = 'dark'
      } else {
        root.classList.remove('dark')
        root.style.colorScheme = 'light'
      }
    }
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Ignore storage errors
    }
  }

  const toggleTheme = () => {
    const isCurrentlyDark =
      typeof document !== 'undefined'
        ? document.documentElement.classList.contains('dark')
        : theme === 'dark'
    applyAndSaveTheme(isCurrentlyDark ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme: theme,
        setTheme: applyAndSaveTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
