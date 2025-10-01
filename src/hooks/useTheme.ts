'use client'
import { create } from 'zustand'
import { useEffect } from 'react'

type Theme = 'dark' | 'light'

interface ThemeStore {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  mounted: boolean
}

export const useTheme = create<ThemeStore>((set, get) => ({
  theme: 'dark',
  mounted: false,
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark'
    set({ theme: newTheme })
    if (typeof window !== 'undefined') {
      localStorage.setItem('bt_theme', newTheme)
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  },
  setTheme: (theme) => {
    set({ theme })
    if (typeof window !== 'undefined') {
      localStorage.setItem('bt_theme', theme)
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }
}))

export function ThemeProvider() {
  const { setTheme } = useTheme()

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = (localStorage.getItem('bt_theme') as Theme) || 'dark'
    setTheme(savedTheme)
    useTheme.setState({ mounted: true })
  }, [setTheme])

  return null
}
