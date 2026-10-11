'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
  isCollapsed: boolean
  toggleCollapsed: () => void
  setCollapsed: (collapsed: boolean) => void
}

const STORAGE_KEY = 'marketplace_sidebar_collapsed'

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  toggle: () => {},
  open: () => {},
  close: () => {},
  isCollapsed: false,
  toggleCollapsed: () => {},
  setCollapsed: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Mobile drawer state
  const [isOpen, setIsOpen] = useState(false)
  // Desktop collapsed state
  const [isCollapsed, setIsCollapsedState] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'true') {
        setIsCollapsedState(true)
      }
    } catch {
      // ignore
    } finally {
      setMounted(true)
    }
  }, [])

  const setCollapsed = (val: boolean) => {
    setIsCollapsedState(val)
    try {
      localStorage.setItem(STORAGE_KEY, String(val))
    } catch {
      // ignore
    }
  }

  const toggleCollapsed = () => {
    setCollapsed(!isCollapsed)
  }

  const toggle = () => setIsOpen((prev) => !prev)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        toggle,
        open,
        close,
        isCollapsed,
        toggleCollapsed,
        setCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
