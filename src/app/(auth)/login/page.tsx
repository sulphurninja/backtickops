'use client'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const router = useRouter()
  const { setAuth } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const errorData = await res.json()
        setError('Invalid email or password')
        return
      }

      const json = await res.json()
      setAuth(json.token, json.user)

      // Redirect based on role
      if (json.user.role === 'employee') {
        router.push('/employee/dashboard')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative z-10 flex flex-col justify-center px-12">
          <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <img src='/dark.png' className='h-7' />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Backtick Ops</h1>
                <p className="text-zinc-400 text-sm font-medium">Enterprise Operations</p>
              </div>
            </div>

            {/* Hero Content */}
            <div className="space-y-4 max-w-md">
              <h2 className="text-4xl font-bold text-white leading-tight">
                Modern operations made simple
              </h2>
              <p className="text-zinc-300 text-lg leading-relaxed">
                Streamline your team's workflow with our comprehensive operations platform.
                Track time, manage projects, and boost productivity.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 gap-4 max-w-md">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <span className="text-white">📊</span>
                </div>
                <span className="text-zinc-300">Real-time analytics & reporting</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <span className="text-white">🎯</span>
                </div>
                <span className="text-zinc-300">Advanced project management</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <span className="text-white">⚡</span>
                </div>
                <span className="text-zinc-300">Automated workflows</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="inline-flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-zinc-900 font-mono font-bold">`</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Backtick Ops</h1>
              </div>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white">Welcome back</h2>
            <p className="mt-2 text-zinc-400">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                Email address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                placeholder="you@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message?.toString()}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                Password
              </label>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message?.toString()}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-zinc-900 py-3 px-4 rounded-lg font-semibold hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-zinc-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-zinc-400 text-sm">
              Don't have an account?{' '}
              <Link href="/register" className="text-white hover:text-zinc-300 font-medium transition-colors">
                Contact your administrator
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-zinc-800">
            <p className="text-zinc-500 text-xs">
              © 2024 Backtick Labs. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
