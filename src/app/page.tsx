'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const router = useRouter()
  const { token, user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (token && user) {
        // Redirect based on role
        if (user.role === 'employee') {
          router.replace('/employee/dashboard')
        } else {
          router.replace('/dashboard')
        }
      } else {
        router.replace('/login')
      }
    }
  }, [token, user, isLoading, router])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto">
          <span className="text-zinc-900 font-mono font-bold text-xl">`</span>
        </div>
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin mx-auto"></div>
        <p className="text-zinc-400">Loading Backtick Ops...</p>
      </div>
    </div>
  )
}
