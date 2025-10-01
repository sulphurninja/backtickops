'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/rbac'
import Link from 'next/link'
import dayjs from 'dayjs'
import { ArrowLeft, User, Mail, Calendar, Clock, TrendingUp, MapPin, AlertTriangle, CheckCircle } from 'lucide-react'

interface TeamMember {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
  managerId?: { _id: string; name: string }
}

interface MemberStats {
  attendanceRate: number
  avgHours: number
  totalDays: number
  presentDays: number
  lateArrivals: number
  productivity: number
  totalHours: number
}

interface AttendanceRecord {
  date: string
  checkIn?: string
  checkOut?: string
  status: string
  hours: number
  mode?: string
  distance?: number
  location?: { latitude: number; longitude: number }
}

interface MemberData {
  member: TeamMember
  stats: MemberStats
  recentAttendance: AttendanceRecord[]
}

export default function TeamMemberDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const [memberData, setMemberData] = useState<MemberData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && can(user.role, ['admin', 'manager'])) {
      loadMemberData()
    }
  }, [user, params.id])

  const loadMemberData = async () => {
    try {
      const res = await fetch(`/api/manager/team/${params.id}`)
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Team member not found')
        } else if (res.status === 403) {
          throw new Error('Access denied')
        } else {
          throw new Error('Failed to load member data')
        }
      }

      const data = await res.json()
      setMemberData(data)
    } catch (error: any) {
      console.error('Failed to load member data:', error)
      setError(error.message || 'Failed to load member data')
    }
    setLoading(false)
  }

  if (!user || !can(user.role, ['admin', 'manager'])) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Access denied</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mx-auto"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading member details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={loadMemberData}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/manager/team"
            className="px-4 py-2 bg-zinc-500 text-white rounded-lg hover:bg-zinc-600 transition-colors"
          >
            Back to Team
          </Link>
        </div>
      </div>
    )
  }

  if (!memberData) {
    return <div className="p-8 text-center text-zinc-400">No data available</div>
  }

  const { member, stats } = memberData

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-600 dark:text-green-400'
      case 'pending': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
      case 'rejected': return 'bg-red-500/20 text-red-600 dark:text-red-400'
      case 'absent': return 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400'
      case 'weekend': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
      default: return 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400'
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 75) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/manager/team"
          className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Team
        </Link>
      </div>

      {/* Member Profile */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{member.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Joined {dayjs(member.createdAt).format('MMM YYYY')}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium capitalize">
                {member.role}
              </span>
              {member.managerId && (
                <span className="px-3 py-1 bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 rounded-full text-sm">
                  Reports to {member.managerId.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-500 dark:text-green-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.attendanceRate}%</span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Attendance Rate</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {stats.presentDays}/{stats.totalDays} days this month
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.avgHours}h</span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Avg Hours</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {stats.totalHours}h total this month
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.lateArrivals}</span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Late Arrivals</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">After 9:15 AM</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            </div>
            <span className={`text-2xl font-bold ${getPerformanceColor(stats.productivity)}`}>
              {stats.productivity}
            </span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Productivity</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Overall score</p>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Recent Attendance</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Last 10 days including weekends</p>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {memberData.recentAttendance.map((record, index) => (
            <div key={`${record.date}-${index}`} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-white">
                      {dayjs(record.date).format('MMMM D, YYYY')}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {dayjs(record.date).format('dddd')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {record.checkIn && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {dayjs(`2024-01-01 ${record.checkIn}`).format('h:mm A')}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">Check In</p>
                    </div>
                  )}

                  {record.checkOut && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {dayjs(`2024-01-01 ${record.checkOut}`).format('h:mm A')}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">Check Out</p>
                    </div>
                  )}

                  {record.hours > 0 && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {record.hours.toFixed(1)}h
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">Hours</p>
                    </div>
                  )}

                  {record.mode && (
                    <div className="text-center">
                      <p className={`text-xs px-2 py-1 rounded-full font-medium ${record.mode === 'office'
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        }`}>
                        {record.mode}
                      </p>
                    </div>
                  )}

                  {record.distance !== undefined && (
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                        <MapPin size={12} />
                        <span>{record.distance}m</span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">from office</p>
                    </div>
                  )}

                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                    {record.status === 'weekend' ? 'Weekend' : record.status}
                  </span>
                </div>
              </div>

              {/* Additional details for approved records with location */}
              {record.status === 'approved' && record.location && (
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white mb-1">Location Details</p>
                      <p>Latitude: {record.location.latitude.toFixed(6)}</p>
                      <p>Longitude: {record.location.longitude.toFixed(6)}</p>
                    </div>
                    {record.distance !== undefined && (
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white mb-1">Distance Check</p>
                        <p>Distance from office: {record.distance}m</p>
                        <p className={record.distance <= 100 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {record.distance <= 100 ? '✓ Within allowed range' : '⚠ Outside allowed range'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {memberData.recentAttendance.length === 0 && (
          <div className="text-center py-12 text-zinc-400">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No attendance records</p>
            <p className="text-sm">No attendance data available for this team member.</p>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Performance Insights</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-white mb-3">Strengths</h3>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              {stats.attendanceRate >= 90 && (
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Excellent attendance rate ({stats.attendanceRate}%)
                </li>
              )}
              {stats.avgHours >= 8 && (
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Consistent full working hours
                </li>
              )}
              {stats.lateArrivals === 0 && (
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  No late arrivals this month
                </li>
              )}
              {stats.productivity >= 90 && (
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  High productivity score
                </li>
              )}
              {stats.attendanceRate < 90 && stats.avgHours < 8 && stats.lateArrivals > 0 && stats.productivity < 90 && (
                <li className="text-zinc-500 dark:text-zinc-400 italic">
                  Performance analysis will show here as data improves
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-zinc-900 dark:text-white mb-3">Areas for Improvement</h3>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              {stats.attendanceRate < 80 && (
                <li className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  Low attendance rate needs attention
                </li>
              )}
              {stats.lateArrivals > 3 && (
                <li className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-yellow-500" />
                  Frequent late arrivals ({stats.lateArrivals} times)
                </li>
              )}
              {stats.avgHours < 7 && (
                <li className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-yellow-500" />
                  Below average working hours
                </li>
              )}
              {stats.productivity < 75 && (
                <li className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  Productivity score needs improvement
                </li>
              )}
              {stats.attendanceRate >= 80 && stats.lateArrivals <= 3 && stats.avgHours >= 7 && stats.productivity >= 75 && (
                <li className="text-green-600 dark:text-green-400 italic flex items-center gap-2">
                  <CheckCircle size={16} />
                  No major areas of concern identified
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Action Recommendations */}
        {(stats.attendanceRate < 80 || stats.lateArrivals > 3 || stats.productivity < 75) && (
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200">Recommended Actions</h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1">
                  {stats.attendanceRate < 80 && (
                    <li>• Schedule a one-on-one meeting to discuss attendance challenges</li>
                  )}
                  {stats.lateArrivals > 3 && (
                    <li>• Review and discuss punctuality expectations</li>
                  )}
                  {stats.productivity < 75 && (
                    <li>• Evaluate workload and provide additional support if needed</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
