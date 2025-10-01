'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect } from 'react'

type U = { id: string; name: string; role: 'admin' | 'manager' | 'employee' }

type S = {
  token: string | null
  user: U | null
  isLoading: boolean
  setAuth: (t: string, u: U) => void
  clear: () => void
  initialize: () => void
}

export const useAuth = create<S>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: true,
      setAuth: (token: string, user: U) => {
        // Set up automatic bearer token for all requests
        const originalFetch = window.fetch
        window.fetch = (input: any, init: any = {}) => {
          init.headers = {
            ...init.headers,
            'authorization': `Bearer ${token}`
          }
          return originalFetch(input, init)
        }
        set({ token, user, isLoading: false })
      },
      clear: () => {
        // Reset fetch to original
        delete (window as any).fetch
        set({ token: null, user: null, isLoading: false })
      },
      initialize: () => {
        const state = get()
        if (state.token && state.user) {
          // Restore fetch interceptor
          const originalFetch = window.fetch
          window.fetch = (input: any, init: any = {}) => {
            init.headers = {
              ...init.headers,
              'authorization': `Bearer ${state.token}`
            }
            return originalFetch(input, init)
          }
        }
        set({ isLoading: false })
      }
    }),
    {
      name: 'bt-auth',
      skipHydration: true,
    }
  )
)

// Initialize auth on app start
export function AuthProvider() {
  const initialize = useAuth((state) => state.initialize)

  useEffect(() => {
    useAuth.persist.rehydrate()
    initialize()
  }, [initialize])

  return null
}
