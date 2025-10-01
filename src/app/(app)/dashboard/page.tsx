'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function Dashboard() {
  const { user, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && token) {
      // Redirect based on role
      switch (user.role) {
        case 'employee':
          router.replace('/employee/dashboard')
          break
        case 'manager':
          router.replace('/manager/team') // Managers go to team management
          break
        case 'admin':
          router.replace('/admin/users') // Admins go to user management
          break
        default:
          router.replace('/employee/dashboard')
      }
    }
  }, [user, token, router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin mx-auto"></div>
        <p className="text-zinc-400">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
