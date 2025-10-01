'use client'
import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Users,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Zap
} from 'lucide-react'
import dayjs from 'dayjs'

interface ProjectAnalyticsData {
  overview: {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    overdueTasks: number
    teamVelocity: number
    burndownData: { date: string; remaining: number; ideal: number }[]
  }
  teamPerformance: {
    userId: string
    name: string
    tasksCompleted: number
    tasksInProgress: number
    averageCompletionTime: number
    storyPointsCompleted: number
  }[]
  sprintProgress: {
    currentSprint?: {
      name: string
      progress: number
      daysRemaining: number
      velocityTrend: 'up' | 'down' | 'stable'
    }
  }
  timeMetrics: {
    averageTaskDuration: number
    blockerResolutionTime: number
    codeReviewTime: number
  }
  riskAssessment: {
    level: 'low' | 'medium' | 'high'
    factors: string[]
    recommendations: string[]
  }
}

interface ProjectAnalyticsProps {
  projectId: string
}

export default function ProjectAnalytics({ projectId }: ProjectAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ProjectAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')

  useEffect(() => {
    loadAnalytics()
  }, [projectId, timeRange])

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/analytics?range=${timeRange}`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-400">Loading analytics...</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
        <p className="text-zinc-400">Analytics data not available</p>
      </div>
    )
  }

  const { overview, teamPerformance, sprintProgress, timeMetrics, riskAssessment } = analytics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Project Analytics
          </h2>
          <p className="text-zinc-400 mt-1">Data-driven insights for better project management</p>
        </div>

        <div className="flex gap-2">
          {['week', 'month', 'quarter'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-3 py-1 text-sm rounded-lg capitalize transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-right">
              <p className="text-white text-2xl font-bold">{overview.completedTasks}</p>
              <p className="text-zinc-400 text-sm">/ {overview.totalTasks}</p>
            </div>
          </div>
          <h3 className="text-white font-medium">Tasks Completed</h3>
          <p className="text-zinc-400 text-sm">
            {overview.totalTasks > 0 ? Math.round((overview.completedTasks / overview.totalTasks) * 100) : 0}% completion rate
          </p>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-right">
              <p className="text-white text-2xl font-bold">{overview.inProgressTasks}</p>
            </div>
          </div>
          <h3 className="text-white font-medium">In Progress</h3>
          <p className="text-zinc-400 text-sm">Active work items</p>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-right">
              <p className="text-white text-2xl font-bold">{overview.overdueTasks}</p>
            </div>
          </div>
          <h3 className="text-white font-medium">Overdue</h3>
          <p className="text-zinc-400 text-sm">Need immediate attention</p>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-right">
              <p className="text-white text-2xl font-bold">{overview.teamVelocity}</p>
              <p className="text-zinc-400 text-sm">SP/Sprint</p>
            </div>
          </div>
          <h3 className="text-white font-medium">Team Velocity</h3>
          <p className="text-zinc-400 text-sm">Story points per sprint</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Burndown Chart */}
        <div className="bg-zinc-900/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Sprint Burndown</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {overview.burndownData.map((point, index) => {
              const maxRemaining = Math.max(...overview.burndownData.map(p => p.remaining))
              const remainingHeight = (point.remaining / maxRemaining) * 100
              const idealHeight = (point.ideal / maxRemaining) * 100

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-1" style={{ height: '200px' }}>
                    <div
                      className="flex-1 bg-blue-500/70 rounded-t"
                      style={{ height: `${remainingHeight}%` }}
                    />
                    <div
                      className="flex-1 bg-zinc-600/70 rounded-t border-2 border-dashed border-zinc-500"
                      style={{ height: `${idealHeight}%` }}
                    />
                  </div>
                  <span className="text-zinc-500 text-xs">
                    {dayjs(point.date).format('M/D')}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-zinc-400">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-dashed border-zinc-500 rounded" />
              <span className="text-zinc-400">Ideal</span>
            </div>
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-zinc-900/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Team Performance</h3>
          <div className="space-y-3">
            {teamPerformance.slice(0, 5).map((member, index) => (
              <div key={member.userId} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{member.name}</h4>
                    <p className="text-zinc-400 text-sm">
                      {member.tasksCompleted} completed, {member.storyPointsCompleted} SP
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-white font-medium">{member.averageCompletionTime.toFixed(1)}d</p>
                  <p className="text-zinc-400 text-sm">Avg completion</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Sprint Progress */}
      {sprintProgress.currentSprint && (
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">{sprintProgress.currentSprint.name}</h3>
              <p className="text-zinc-400">{sprintProgress.currentSprint.daysRemaining} days remaining</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white text-2xl font-bold">
                {Math.round(sprintProgress.currentSprint.progress)}%
              </span>
              {sprintProgress.currentSprint.velocityTrend === 'up' ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : sprintProgress.currentSprint.velocityTrend === 'down' ? (
                <TrendingDown className="w-5 h-5 text-red-400" />
              ) : (
                <div className="w-5 h-5 bg-yellow-400 rounded-full" />
              )}
            </div>
          </div>

          <div className="w-full bg-zinc-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${sprintProgress.currentSprint.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Time Metrics & Risk Assessment */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Time Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Average Task Duration</span>
              <span className="text-white font-medium">{timeMetrics.averageTaskDuration.toFixed(1)} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Blocker Resolution Time</span>
              <span className="text-white font-medium">{timeMetrics.blockerResolutionTime.toFixed(1)} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Code Review Time</span>
              <span className="text-white font-medium">{timeMetrics.codeReviewTime.toFixed(1)} hours</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-white">Risk Assessment</h3>
            <span className={`px-2 py-1 text-xs rounded-full uppercase font-medium ${
              riskAssessment.level === 'high' ? 'bg-red-500/20 text-red-400' :
              riskAssessment.level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {riskAssessment.level} risk
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="text-zinc-400 text-sm font-medium mb-2">Risk Factors</h4>
              <ul className="space-y-1">
                {riskAssessment.factors.map((factor, index) => (
                  <li key={index} className="text-white text-sm flex items-center gap-2">
                    <div className="w-1 h-1 bg-red-400 rounded-full" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-zinc-400 text-sm font-medium mb-2">Recommendations</h4>
              <ul className="space-y-1">
                {riskAssessment.recommendations.map((rec, index) => (
                  <li key={index} className="text-white text-sm flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-400 rounded-full" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
