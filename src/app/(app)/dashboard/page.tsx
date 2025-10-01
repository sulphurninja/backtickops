'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function Dashboard() {
  const { user, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && token) {
      // Redirect employees to their specific dashboard
      if (user.role === 'employee') {
        router.replace('/employee/dashboard')
        return
      }
      // Admin/Manager stay on main dashboard - you can implement this later
    }
  }, [user, token, router])

  // For now, redirect all to employee dashboard since we haven't built admin dashboard
  useEffect(() => {
    if (user && token) {
      if (user.role === 'employee') {
        router.replace('/employee/dashboard')
      } else {
        // Temporary: redirect admin/manager to employee dashboard
        // Replace with actual admin dashboard when ready
        router.replace('/employee/dashboard')
      }
    }
  }, [user, token, router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin mx-auto"></div>
        <p className="text-zinc-400">Redirecting...</p>
      </div>
    </div>
  )
}
