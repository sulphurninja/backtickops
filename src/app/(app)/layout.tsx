'use client'
import { useAuth, AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/hooks/useTheme'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login')
    }
  }, [token, isLoading, router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <>
        <AuthProvider />
        <ThemeProvider />
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mx-auto"></div>
            <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  // Redirect if not authenticated
  if (!user || !token) return <><AuthProvider /><ThemeProvider /></>

  return (
    <>
      <AuthProvider />
      <ThemeProvider />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <Sidebar />
        <main className="pl-64 transition-all duration-300">
          <div className="px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
