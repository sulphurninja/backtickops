'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/rbac'
import { useState } from 'react'
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  FolderOpen,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut as LogOutIcon,
  User,
  CheckCircle,
  MapPin,
  UserCheck,
  BarChart3
} from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  roles?: ('admin' | 'manager' | 'employee')[]
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
  { name: 'Daily Planner', href: '/planner', icon: Calendar },

  // Admin only
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, roles: ['admin'] },
  { name: 'Projects', href: '/projects', icon: FolderOpen, roles: ['admin'] },
  { name: 'All Users', href: '/admin/users', icon: Users, roles: ['admin'] },
  { name: 'All Attendance', href: '/admin/attendance', icon: Clock, roles: ['admin'] },

  // Manager only
  { name: 'My Team', href: '/manager/team', icon: Users, roles: ['manager'] },
  { name: 'Team Attendance', href: '/manager/attendance', icon: UserCheck, roles: ['manager'] },
  { name: 'Team Reports', href: '/manager/reports', icon: BarChart3, roles: ['manager'] },

  // Employee only
  { name: 'My Tasks', href: '/employee/tasks', icon: CheckSquare, roles: ['employee'] },
  { name: 'My Projects', href: '/employee/projects', icon: FolderOpen, roles: ['employee'] },
]

const quickActions = [
  { name: 'Check In', action: 'check-in', icon: LogIn },
  { name: 'Check Out', action: 'check-out', icon: LogOutIcon },
]

export default function Sidebar() {
  const { user, clear } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [attendanceStatus, setAttendanceStatus] = useState<{
    checkedIn: boolean
    location?: { lat: number; lng: number }
    pending?: boolean
  }>({ checkedIn: false })

  if (!user) return null

  const filteredNavigation = navigation.filter(item =>
    !item.roles || item.roles.includes(user.role)
  )

  const OFFICE_LOCATION = { lat: 18.662431200582347, lng: 73.7929215654713 }
  const MAX_DISTANCE = 100 // meters

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  const handleCheckIn = async () => {
    try {
      // Get user's current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const { latitude, longitude } = position.coords
      const distance = calculateDistance(
        latitude,
        longitude,
        OFFICE_LOCATION.lat,
        OFFICE_LOCATION.lng
      )

      if (distance > MAX_DISTANCE) {
        alert(`You must be within ${MAX_DISTANCE}m of the office to check in. You are ${Math.round(distance)}m away.`)
        return
      }

      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude,
          longitude,
          distance: Math.round(distance)
        })
      })

      if (res.ok) {
        setAttendanceStatus({
          checkedIn: true,
          location: { lat: latitude, lng: longitude },
          pending: user.role === 'employee' // Employees need approval
        })
        alert('Check-in successful!' + (user.role === 'employee' ? ' Awaiting manager approval.' : ''))
      } else {
        throw new Error('Check-in failed')
      }
    } catch (error: any) {
      if (error.code === error.PERMISSION_DENIED) {
        alert('Location access is required for check-in. Please enable location services.')
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        alert('Unable to determine your location. Please try again.')
      } else {
        alert('Check-in failed. Please try again.')
      }
    }
  }

  const handleCheckOut = async () => {
    if (!attendanceStatus.checkedIn) {
      alert('You must check in first before checking out.')
      return
    }

    try {
      const res = await fetch('/api/attendance/check-out', { method: 'POST' })
      if (res.ok) {
        setAttendanceStatus({
          checkedIn: false,
          pending: user.role === 'employee'
        })
        alert('Check-out successful!' + (user.role === 'employee' ? ' Awaiting manager approval.' : ''))
      }
    } catch (error) {
      alert('Check-out failed. Please try again.')
    }
  }

  return (
    <div className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'
      } bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <img src='/dark.png' className='h-5' alt="Backtick" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-zinc-900 dark:text-white">Backtick Ops</h1>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/employee/dashboard' && pathname.startsWith(item.href))
            const IconComponent = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center ${isCollapsed ? 'justify-center px-3' : 'space-x-3 px-3'} py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
              >
                <IconComponent size={20} className="flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Attendance Quick Actions - Only for employees */}
        {!isCollapsed && user.role === 'employee' && (
          <div className="px-4 py-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
              Attendance
            </p>
            <div className="space-y-2">
              {/* Check In Button */}
              <button
                onClick={handleCheckIn}
                disabled={attendanceStatus.checkedIn}
                className={`flex items-center space-x-3 px-4 py-3 w-full text-left rounded-lg text-sm font-medium transition-all duration-200 ${attendanceStatus.checkedIn
                  ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-sm hover:shadow-md'
                  }`}
              >
                {attendanceStatus.checkedIn ? (
                  <CheckCircle size={18} />
                ) : (
                  <LogIn size={18} />
                )}
                <div className="flex-1">
                  <div className="font-medium">
                    {attendanceStatus.checkedIn ? 'Checked In' : 'Check In'}
                  </div>
                  {attendanceStatus.pending && (
                    <div className="text-xs opacity-75">Pending approval</div>
                  )}
                </div>
                {attendanceStatus.checkedIn && (
                  <MapPin size={14} className="opacity-60" />
                )}
              </button>

              {/* Check Out Button */}
              <button
                onClick={handleCheckOut}
                disabled={!attendanceStatus.checkedIn}
                className={`flex items-center space-x-3 px-4 py-3 w-full text-left rounded-lg text-sm font-medium transition-all duration-200 ${!attendanceStatus.checkedIn
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-sm hover:shadow-md'
                  }`}
              >
                <LogOutIcon size={18} />
                <div className="font-medium">Check Out</div>
              </button>
            </div>
          </div>
        )}

        {/* User Menu */}
        <div className="px-4 py-4 border-t border-zinc-200 dark:border-zinc-800">
          {!isCollapsed && (
            <div className="mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gradient-to-br from-zinc-600 to-zinc-700 dark:from-zinc-600 dark:to-zinc-700 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={clear}
            className={`flex items-center ${isCollapsed ? 'justify-center px-3' : 'space-x-3 px-3'} py-2.5 w-full text-left rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200`} >
            <LogOutIcon size={18} />
            {!isCollapsed &&
              <span>Sign out</span>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
