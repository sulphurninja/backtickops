'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/rbac'
import dayjs from 'dayjs'
import { BarChart3, TrendingUp, Users, Clock, Download, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'

interface TeamReport {
  totalMembers: number
  avgAttendanceRate: number
  totalWorkHours: number
  productivityScore: number
  monthlyData: {
    month: string
    attendance: number
    hours: number
  }[]
  memberPerformance: {
    userId: string
    name: string
    email: string
    attendanceRate: number
    avgHours: number
    productivity: number
    presentDays: number
    totalTasks: number
    completedTasks: number
    totalHours: number
  }[]
}

export default function ManagerReportsPage() {
  const { user } = useAuth()
  const [report, setReport] = useState<TeamReport | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && can(user.role, ['admin', 'manager'])) {
      loadReport()
    }
  }, [user, selectedMonth])

  const loadReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/manager/reports?month=${selectedMonth}`)
      if (!res.ok) {
        throw new Error('Failed to load report')
      }
      const data = await res.json()
      setReport(data)
    } catch (error) {
      console.error('Failed to load report:', error)
      setError('Failed to load team reports. Please try again.')
    }
    setLoading(false)
  }

  if (!user || !can(user.role, ['admin', 'manager'])) {
    return <div className="p-8 text-center text-red-400">Access denied</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mx-auto"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading team reports...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadReport}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!report) return <div className="p-8 text-center text-zinc-400">No data available</div>

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10'
    if (score >= 75) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10'
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
  }

  const exportReport = async () => {
    try {
      // Create CSV content
      const csvContent = [
        ['Name', 'Email', 'Attendance Rate', 'Avg Hours', 'Productivity', 'Present Days', 'Total Tasks', 'Completed Tasks'],
        ...report.memberPerformance.map(member => [
          member.name,
          member.email,
          `${member.attendanceRate}%`,
          `${member.avgHours}h`,
          member.productivity,
          member.presentDays,
          member.totalTasks,
          member.completedTasks
        ])
      ].map(row => row.join(',')).join('\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `team-report-${selectedMonth}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to export report')
    }
  }

  const lowPerformers = report.memberPerformance.filter(m => m.productivity < 75).length
  const highPerformers = report.memberPerformance.filter(m => m.productivity >= 90).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Team Reports</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Real-time team performance and productivity analytics for {dayjs(selectedMonth).format('MMMM YYYY')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg"
          />
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{report.totalMembers}</span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Team Size</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Active members</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-500 dark:text-green-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{report.avgAttendanceRate}%</span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Attendance Rate</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Team average</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{report.totalWorkHours}h</span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Total Hours</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">This month</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-500 dark:text-orange-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{report.productivityScore}</span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Productivity</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Team score</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Monthly Trends */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">3-Month Trends</h2>
          <div className="space-y-4">
            {report.monthlyData.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-sm font-semibold">
                    {data.month}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">Attendance: {data.attendance}%</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Hours: {data.hours}h</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(data.attendance, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Distribution */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Performance Overview</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">High Performers</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">90%+ productivity</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">{highPerformers}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">Needs Attention</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Below 75% productivity</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{lowPerformers}</span>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                <span>Team Productivity Distribution</span>
                <span>{report.productivityScore}/100</span>
              </div>
              <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${report.productivityScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Performance Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Individual Performance</h2>
        </div>

        {report.memberPerformance.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No team members found for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-zinc-900 dark:text-white">Employee</th>
                  <th className="text-left p-4 font-semibold text-zinc-900 dark:text-white">Attendance</th>
                  <th className="text-left p-4 font-semibold text-zinc-900 dark:text-white">Avg Hours</th>
                  <th className="text-left p-4 font-semibold text-zinc-900 dark:text-white">Tasks</th>
                  <th className="text-left p-4 font-semibold text-zinc-900 dark:text-white">Productivity</th>
                  <th className="text-left p-4 font-semibold text-zinc-900 dark:text-white">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {report.memberPerformance
                  .sort((a, b) => b.productivity - a.productivity)
                  .map((member, index) => (
                    <tr key={member.userId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium text-zinc-900 dark:text-white">{member.name}</span>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-900 dark:text-white">{member.attendanceRate}%</span>
                          <div className="w-16 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min(member.attendanceRate, 100)}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          {member.presentDays} days present
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="text-zinc-900 dark:text-white">{member.avgHours}h</span>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {member.totalHours}h total
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="text-zinc-900 dark:text-white">
                          {member.completedTasks}/{member.totalTasks}
                        </span>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {member.totalTasks > 0 ? Math.round((member.completedTasks / member.totalTasks) * 100) : 0}% completion
                        </p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${getPerformanceColor(member.productivity)}`}>
                          {member.productivity}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.productivity >= 90 ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' :
                            member.productivity >= 75 ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                            }`}>
                            {member.productivity >= 90 ? 'Excellent' :
                              member.productivity >= 75 ? 'Good' : 'Needs Improvement'}
                          </span>
                          {index < 3 && member.productivity >= 90 && (
                            <div className="text-xs text-amber-500">🏆</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Real Insights and Recommendations */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">AI-Powered Insights & Recommendations</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-white mb-3">Key Insights</h3>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>• Team attendance is {report.avgAttendanceRate >= 85 ? 'above' : report.avgAttendanceRate >= 75 ? 'at' : 'below'} industry standard ({report.avgAttendanceRate}%)</li>
              <li>• {highPerformers} high performers ({Math.round((highPerformers / report.totalMembers) * 100)}% of team)</li>
              <li>• {lowPerformers} members need attention ({Math.round((lowPerformers / report.totalMembers) * 100)}% of team)</li>
              <li>• Average working hours: {report.totalMembers > 0 ? (report.totalWorkHours / report.totalMembers).toFixed(1) : 0}h per person</li>
              <li>• Productivity trending {
                report.monthlyData.length >= 2 ?
                  (report.monthlyData[report.monthlyData.length - 1].attendance > report.monthlyData[report.monthlyData.length - 2].attendance ? 'upward' : 'downward')
                  : 'stable'
              }</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-white mb-3">Actionable Recommendations</h3>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              {lowPerformers > 0 && (
                <li>• Schedule 1-on-1 meetings with {lowPerformers} underperforming members</li>
              )}
              {highPerformers > 0 && (
                <li>• Publicly recognize {highPerformers} top performers to boost morale</li>
              )}
              {report.avgAttendanceRate < 80 && (
                <li>• Investigate attendance issues and consider flexible work policies</li>
              )}
              {report.totalMembers > 0 && (report.totalWorkHours / report.totalMembers) < 6 && (
                <li>• Review workload distribution - team may be underutilized</li>
              )}
              {report.totalMembers > 0 && (report.totalWorkHours / report.totalMembers) > 9 && (
                <li>• Monitor for burnout risk - consider workload rebalancing</li>
              )}
              <li>• Implement peer mentoring between high and low performers</li>
            </ul>
          </div>
        </div>

        {/* Action Items */}
        {(lowPerformers > 0 || report.avgAttendanceRate < 75) && (
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200">Urgent Action Required</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {lowPerformers > 0 && `${lowPerformers} team members need immediate attention. `}
                  {report.avgAttendanceRate < 75 && `Team attendance is critically low at ${report.avgAttendanceRate}%.`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Trends Chart (Simple Visual) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Performance Distribution</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Excellent (90-100%)</span>
            <span className="text-zinc-900 dark:text-white font-medium">{highPerformers} members</span>
          </div>
          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${report.totalMembers > 0 ? (highPerformers / report.totalMembers) * 100 : 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Good (75-89%)</span>
            <span className="text-zinc-900 dark:text-white font-medium">
              {report.memberPerformance.filter(m => m.productivity >= 75 && m.productivity < 90).length} members
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full">
            <div
              className="h-full bg-yellow-500 rounded-full transition-all duration-500"
              style={{
                width: `${report.totalMembers > 0 ?
                  (report.memberPerformance.filter(m => m.productivity >= 75 && m.productivity < 90).length / report.totalMembers) * 100
                  : 0}%`
              }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Needs Improvement (&lt;75%)</span>
            <span className="text-zinc-900 dark:text-white font-medium">{lowPerformers} members</span>
          </div>
          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-500"
              style={{ width: `${report.totalMembers > 0 ? (lowPerformers / report.totalMembers) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
