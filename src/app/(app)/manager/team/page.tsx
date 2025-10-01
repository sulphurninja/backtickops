'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/rbac'
import Link from 'next/link'
import { User, Mail, Calendar, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react'
import dayjs from 'dayjs'

interface TeamMember {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
  managerId?: { _id: string; name: string; email: string }
}

interface AttendanceStats {
  userId: string
  presentDays: number
  totalDays: number
  avgHours: number
  lastCheckIn?: string
  attendanceRate: number
  totalHours: number
}

export default function ManagerTeamPage() {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && can(user.role, ['admin', 'manager'])) {
      loadTeamData()
    }
  }, [user])

  const loadTeamData = async () => {
    try {
      const [teamRes, statsRes] = await Promise.all([
        fetch('/api/manager/team'),
        fetch('/api/manager/team/stats')
      ])

      if (!teamRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch team data')
      }

      const teamData = await teamRes.json()
      const statsData = await statsRes.json()

      setTeamMembers(teamData)
      setAttendanceStats(statsData)
    } catch (error) {
      console.error('Failed to load team data:', error)
      setError('Failed to load team data. Please try again.')
    }
    setLoading(false)
  }

  if (!user || !can(user.role, ['admin', 'manager'])) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Access denied</p>
      </div>
    )
  }

  const getAttendanceStats = (userId: string) => {
    return attendanceStats.find(stat => stat.userId === userId) || {
      presentDays: 0,
      totalDays: 0,
      avgHours: 0,
      attendanceRate: 0,
      lastCheckIn: undefined,
      totalHours: 0
    }
  }

  const getStatusColor = (rate: number) => {
    if (rate >= 90) return 'text-green-400 bg-green-500/10'
    if (rate >= 70) return 'text-yellow-400 bg-yellow-500/10'
    return 'text-red-400 bg-red-500/10'
  }

  const avgAttendanceRate = attendanceStats.length > 0
    ? Math.round(attendanceStats.reduce((sum, stat) => sum + stat.attendanceRate, 0) / attendanceStats.length)
    : 0

  const activeToday = attendanceStats.filter(s => s.lastCheckIn && dayjs(s.lastCheckIn).isSame(dayjs(), 'day')).length
  const lowPerformers = attendanceStats.filter(s => s.attendanceRate < 70).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mx-auto"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading team data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadTeamData}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {user.role === 'admin' ? 'All Team Members' : 'My Team'}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Manage and monitor your team members
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/manager/attendance"
            className="px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            View Attendance
          </Link>
          <Link
            href="/manager/reports"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            View Reports
          </Link>
        </div>
      </div>

      {/* Team Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{teamMembers.length}</span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Team Members</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.role === 'admin' ? 'All employees' : 'Direct reports'}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500 dark:text-green-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{activeToday}</span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Active Today</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Checked in today</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{lowPerformers}</span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Needs Attention</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Below 70% attendance</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{avgAttendanceRate}%</span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Avg Attendance</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Team average</p>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Team Members</h2>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {teamMembers.map(member => {
            const stats = getAttendanceStats(member._id)
            return (
              <div key={member._id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-full flex items-center justify-center text-white font-semibold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{member.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        <Mail size={14} />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                        <Calendar size={14} />
                        <span>Joined {dayjs(member.createdAt).format('MMM YYYY')}</span>
                        {member.managerId && user.role === 'admin' && (
                          <>
                            <span>•</span>
                            <span>Reports to {member.managerId.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Attendance Rate */}
                    <div className="text-center">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(stats.attendanceRate)}`}>
                        {stats.attendanceRate}%
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                        {stats.presentDays}/{stats.totalDays} days
                      </p>
                    </div>

                    {/* Average Hours */}
                    <div className="text-center">
                      <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {stats.avgHours}h
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        {stats.totalHours}h total
                      </p>
                    </div>

                    {/* Last Check-in */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                        <Clock size={14} />
                        {stats.lastCheckIn ? dayjs(stats.lastCheckIn).format('MMM D, HH:mm') : 'Never'}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Last check-in</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/manager/team/${member._id}`}
                        className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {teamMembers.length === 0 && (
          <div className="text-center py-12 text-zinc-400">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No team members found</p>
            <p className="text-sm">
              {user.role === 'admin'
                ? 'No employees have been added to the system yet.'
                : 'No employees have been assigned to report to you yet.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
