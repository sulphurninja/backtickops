'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/rbac'
import {
  Plus,
  Play,
  Pause,
  CheckCircle,
  Calendar,
  Target,
  TrendingUp,
  Clock,
  Users,
  BarChart3
} from 'lucide-react'
import dayjs from 'dayjs'

interface Sprint {
  _id: string
  name: string
  startDate: string
  endDate: string
  goal: string
  status: 'planning' | 'active' | 'completed'
  tasks: string[]
  velocity: number
}

interface Task {
  _id: string
  title: string
  storyPoints?: number
  status: string
  assignee?: { _id: string; name: string }
}

interface SprintManagerProps {
  projectId: string
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: any) => Promise<void>
}

export default function SprintManager({ projectId, tasks, onTaskUpdate }: SprintManagerProps) {
  const { user } = useAuth()
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [showCreateSprint, setShowCreateSprint] = useState(false)
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSprints()
  }, [projectId])

  const loadSprints = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints`)
      if (res.ok) {
        const sprintData = await res.json()
        setSprints(sprintData)
        setActiveSprint(sprintData.find((s: Sprint) => s.status === 'active') || null)
      }
    } catch (error) {
      console.error('Failed to load sprints:', error)
    }
    setLoading(false)
  }

  const createSprint = async (sprintData: Partial<Sprint>) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sprintData)
      })

      if (res.ok) {
        const newSprint = await res.json()
        setSprints(prev => [...prev, newSprint])
        setShowCreateSprint(false)
      }
    } catch (error) {
      console.error('Failed to create sprint:', error)
    }
  }

  const startSprint = async (sprintId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints/${sprintId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      })

      if (res.ok) {
        loadSprints()
      }
    } catch (error) {
      console.error('Failed to start sprint:', error)
    }
  }

  const getSprintTasks = (sprint: Sprint) => {
    return tasks.filter(task => sprint.tasks.includes(task._id))
  }

  const getSprintStats = (sprint: Sprint) => {
    const sprintTasks = getSprintTasks(sprint)
    const completedTasks = sprintTasks.filter(t => t.status === 'done')
    const totalStoryPoints = sprintTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)
    const completedStoryPoints = completedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)

    return {
      totalTasks: sprintTasks.length,
      completedTasks: completedTasks.length,
      totalStoryPoints,
      completedStoryPoints,
      progress: sprintTasks.length > 0 ? (completedTasks.length / sprintTasks.length) * 100 : 0
    }
  }

  const canManageSprints = can(user?.role || '', ['admin']) 
    // Add project owner check here

  if (loading) {
    return <div className="text-center py-8 text-zinc-400">Loading sprints...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Sprint Management</h2>
          <p className="text-zinc-400 mt-1">Plan and track your development sprints</p>
        </div>

        {canManageSprints && (
          <button
            onClick={() => setShowCreateSprint(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus size={16} />
            Create Sprint
          </button>
        )}
      </div>

      {/* Active Sprint */}
      {activeSprint && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <h3 className="text-xl font-semibold text-white">Active Sprint: {activeSprint.name}</h3>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full uppercase font-medium">
                Active
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <span>{dayjs(activeSprint.startDate).format('MMM D')} - {dayjs(activeSprint.endDate).format('MMM D')}</span>
              <span>{dayjs().diff(activeSprint.startDate, 'day')} of {dayjs(activeSprint.endDate).diff(activeSprint.startDate, 'day')} days</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-6">{activeSprint.goal}</p>

          {/* Sprint Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const stats = getSprintStats(activeSprint)
              return (
                <>
                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-zinc-400 text-sm">Tasks</span>
                    </div>
                    <p className="text-white text-xl font-bold">
                      {stats.completedTasks}/{stats.totalTasks}
                    </p>
                  </div>

                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-zinc-400 text-sm">Story Points</span>
                    </div>
                    <p className="text-white text-xl font-bold">
                      {stats.completedStoryPoints}/{stats.totalStoryPoints}
                    </p>
                  </div>

                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="text-zinc-400 text-sm">Progress</span>
                    </div>
                    <p className="text-white text-xl font-bold">{Math.round(stats.progress)}%</p>
                  </div>

                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-zinc-400 text-sm">Days Left</span>
                    </div>
                    <p className="text-white text-xl font-bold">
                      {Math.max(0, dayjs(activeSprint.endDate).diff(dayjs(), 'day'))}
                    </p>
                  </div>
                </>
              )
            })()}
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-zinc-400 mb-2">
              <span>Sprint Progress</span>
              <span>{Math.round(getSprintStats(activeSprint).progress)}%</span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getSprintStats(activeSprint).progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sprint Backlog */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* All Sprints */}
        <div className="bg-zinc-900/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">All Sprints</h3>
          <div className="space-y-3">
            {sprints.map(sprint => {
              const stats = getSprintStats(sprint)
              return (
                <div
                  key={sprint._id}
                  className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium">{sprint.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full uppercase font-medium ${
                        sprint.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        sprint.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {sprint.status}
                      </span>
                    </div>

                    {sprint.status === 'planning' && canManageSprints && (
                      <button
                        onClick={() => startSprint(sprint._id)}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                      >
                        <Play size={12} />
                        Start
                      </button>
                    )}
                  </div>

                  <p className="text-zinc-400 text-sm mb-3">{sprint.goal}</p>

                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {dayjs(sprint.startDate).format('MMM D')} - {dayjs(sprint.endDate).format('MMM D, YYYY')}
                    </span>
                    <span>
                      {stats.completedTasks}/{stats.totalTasks} tasks, {stats.completedStoryPoints}/{stats.totalStoryPoints} SP
                    </span>
                  </div>

                  {/* Mini progress bar */}
                  <div className="w-full bg-zinc-700 rounded-full h-1 mt-2">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        sprint.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${stats.progress}%` }}
                    />
                  </div>
                </div>
              )
            })}

            {sprints.length === 0 && (
              <p className="text-zinc-400 text-center py-8">
                No sprints created yet. Create your first sprint to get started!
              </p>
            )}
          </div>
        </div>

        {/* Unassigned Tasks (Backlog) */}
        <div className="bg-zinc-900/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Product Backlog</h3>
          <div className="space-y-2">
            {tasks
              .filter(task => !sprints.some(sprint => sprint.tasks.includes(task._id)))
              .slice(0, 10)
              .map(task => (
                <div
                  key={task._id}
                  className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex-1">
                    <h5 className="text-white text-sm font-medium truncate">{task.title}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      {task.storyPoints && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                          {task.storyPoints} SP
                        </span>
                      )}
                      {task.assignee && (
                        <span className="text-zinc-500 text-xs">
                          → {task.assignee.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {canManageSprints && activeSprint && (
                    <button
                      onClick={() => {
                        // Add task to active sprint logic here
                        console.log('Add to sprint:', task._id)
                      }}
                      className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      Add to Sprint
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Create Sprint Modal */}
      {showCreateSprint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Sprint</h3>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              createSprint({
                name: formData.get('name') as string,
                startDate: formData.get('startDate') as string,
                endDate: formData.get('endDate') as string,
                goal: formData.get('goal') as string
              })
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Sprint Name
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g., Sprint 1, Feature Development Sprint"
                  className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Start Date
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    End Date
                  </label>
                  <input
                    name="endDate"
                    type="date"
                    required
                    className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Sprint Goal
                </label>
                <textarea
                  name="goal"
                  rows={3}
                  placeholder="What do you want to achieve in this sprint?"
                  className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create Sprint
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateSprint(false)}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
