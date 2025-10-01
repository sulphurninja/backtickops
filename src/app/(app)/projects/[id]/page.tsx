'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/rbac'
import KanbanBoard from '@/components/KanbanBoard'
import SprintManager from '@/components/SprintManager'
import DailyStandup from '@/components/DailyStandup'
import ProjectAnalytics from '@/components/ProjectAnalytics'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Users,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Target,
  BarChart3,
  MessageSquare,
  Plus,
  Edit3,
  Save,
  X
} from 'lucide-react'
import dayjs from 'dayjs'

interface Project {
  _id: string
  name: string
  code: string
  description?: string
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled'
  methodology: 'agile' | 'waterfall' | 'kanban'
  owners: { _id: string; name: string; email: string }[]
  members: { _id: string; name: string; email: string }[]
  kanbanColumns: { id: string; title: string; order: number; wipLimit?: number; color: string }[]
  dailyStandup: {
    enabled: boolean
    time: string
    timezone: string
    duration: number
    participants: { _id: string; name: string; email: string }[]
    lastConducted?: string
  }
  sprints: Array<{
    _id: string
    name: string
    startDate: string
    endDate: string
    goal: string
    status: 'planning' | 'active' | 'completed'
    velocity: number
    tasks: string[]
  }>
  startDate?: string
  endDate?: string
  createdAt: string
}

interface Task {
  _id: string
  title: string
  description?: string
  assignee?: { _id: string; name: string; email: string }
  reporter: { _id: string; name: string }
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  storyPoints?: number
  dueDate?: string
  tags: string[]
  estimatedHours?: number
  actualHours?: number
  createdAt: string
  updatedAt: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState<'kanban' | 'sprints' | 'standup' | 'analytics' | 'overview' | 'timeline' | 'settings'>('kanban')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState(false)
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: 'active',
    methodology: 'agile',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    if (user) {
      loadProjectData()
    }
  }, [user, params.id])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [projectRes, tasksRes] = await Promise.all([
        fetch(`/api/projects/${params.id}`),
        fetch(`/api/tasks?projectId=${params.id}`)
      ])

      if (!projectRes.ok) {
        if (projectRes.status === 404) {
          throw new Error('Project not found')
        } else if (projectRes.status === 403) {
          throw new Error('Access denied')
        } else {
          throw new Error('Failed to load project')
        }
      }

      if (!tasksRes.ok) {
        throw new Error('Failed to load tasks')
      }

      const [projectData, tasksData] = await Promise.all([
        projectRes.json(),
        tasksRes.json()
      ])

      setProject(projectData)
      setTasks(tasksData)

      // Initialize form data
      setProjectForm({
        name: projectData.name,
        description: projectData.description || '',
        status: projectData.status,
        methodology: projectData.methodology,
        startDate: projectData.startDate ? dayjs(projectData.startDate).format('YYYY-MM-DD') : '',
        endDate: projectData.endDate ? dayjs(projectData.endDate).format('YYYY-MM-DD') : ''
      })
    } catch (error: any) {
      console.error('Failed to load project data:', error)
      setError(error.message || 'Failed to load project data')
    }
    setLoading(false)
  }

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!res.ok) {
        throw new Error('Failed to update task')
      }

      const updatedTask = await res.json()
      setTasks(prev => prev.map(task =>
        task._id === taskId ? updatedTask : task
      ))
    } catch (error) {
      console.error('Failed to update task:', error)
      throw error
    }
  }

  const handleColumnUpdate = async (columns: any[]) => {
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kanbanColumns: columns })
      })

      if (!res.ok) throw new Error('Failed to update columns')

      setProject(prev => prev ? { ...prev, kanbanColumns: columns } : null)
    } catch (error) {
      console.error('Failed to update columns:', error)
      throw error
    }
  }

  const handleProjectUpdate = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm)
      })

      if (!res.ok) throw new Error('Failed to update project')

      const updatedProject = await res.json()
      setProject(updatedProject)
      setEditingProject(false)
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const getProjectStats = () => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'done').length
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
    const overdueTasks = tasks.filter(t =>
      t.dueDate && dayjs(t.dueDate).isBefore(dayjs(), 'day') && t.status !== 'done'
    ).length

    const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)
    const completedStoryPoints = tasks
      .filter(t => t.status === 'done')
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0)

    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      totalStoryPoints,
      completedStoryPoints,
      progressPercentage
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mx-auto"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Error Loading Project</h2>
        <p className="text-red-400 mb-4">{error}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={loadProjectData}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/projects"
            className="px-4 py-2 bg-zinc-500 text-white rounded-lg hover:bg-zinc-600 transition-colors"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400 mb-4">Project not found</p>
        <Link href="/projects" className="text-blue-500 hover:text-blue-600">
          ← Back to Projects
        </Link>
      </div>
    )
  }

  const stats = getProjectStats()
  const canEditProject = can(user?.role || '', ['admin']) ||
    project.owners.some(owner => owner._id === user?.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/20'
      case 'planning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/20'
      case 'on-hold': return 'bg-orange-500/20 text-orange-400 border-orange-500/20'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/20'
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/20'
    }
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex-1">
              {editingProject ? (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                    className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 text-zinc-900 dark:text-white focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleProjectUpdate}
                      className="p-1 text-green-600 hover:text-green-700"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={() => setEditingProject(false)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{project.name}</h1>
                  {canEditProject && (
                    <button
                      onClick={() => setEditingProject(true)}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                  <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded uppercase font-mono">
                    {project.code}
                  </span>
                  <span className={`px-3 py-1 text-xs rounded-full capitalize font-medium border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              )}
              {project.description && !editingProject && (
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">{project.description}</p>
              )}
              {editingProject && (
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Project description..."
                  className="w-full mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white resize-none focus:outline-none focus:border-blue-500"
                  rows={2}
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {canEditProject && !editingProject && (
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg transition-colors"
              >
                <Settings size={16} />
                Settings
              </button>
            )}
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">Total Tasks</p>
                <p className="text-zinc-900 dark:text-white text-xl font-bold">{stats.totalTasks}</p>
              </div>
              <CheckCircle2 className="text-zinc-400" size={20} />
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">Completed</p>
                <p className="text-green-600 dark:text-green-400 text-xl font-bold">{stats.completedTasks}</p>
              </div>
              <CheckCircle2 className="text-green-400" size={20} />
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">In Progress</p>
                <p className="text-blue-600 dark:text-blue-400 text-xl font-bold">{stats.inProgressTasks}</p>
              </div>
              <Play className="text-blue-400" size={20} />
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">Overdue</p>
                <p className="text-red-600 dark:text-red-400 text-xl font-bold">{stats.overdueTasks}</p>
              </div>
              <AlertTriangle className="text-red-400" size={20} />
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">Progress</p>
                <p className="text-purple-600 dark:text-purple-400 text-xl font-bold">{stats.progressPercentage}%</p>
              </div>
              <TrendingUp className="text-purple-400" size={20} />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            <span>Overall Progress</span>
            <span>{stats.completedTasks}/{stats.totalTasks} tasks completed</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-1">
          {[
            { id: 'kanban', label: 'Kanban Board', icon: BarChart3 },
            { id: 'sprints', label: 'Sprints', icon: Target },
            { id: 'standup', label: 'Daily Standup', icon: MessageSquare },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'overview', label: 'Overview', icon: Users },
            { id: 'timeline', label: 'Timeline', icon: Calendar },
            ...(canEditProject ? [{ id: 'settings', label: 'Settings', icon: Settings }] : [])
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'kanban' && (
          <KanbanBoard
            projectId={project._id}
            tasks={tasks}
            columns={project.kanbanColumns}
            onTaskUpdate={handleTaskUpdate}
            onColumnUpdate={handleColumnUpdate}
            canEditColumns={can(user?.role || '', ['admin'])}
          />
        )}

        {activeTab === 'sprints' && (
          <div className="p-6 h-full overflow-y-auto">
            <SprintManager
              projectId={project._id}
              tasks={tasks}
              onTaskUpdate={handleTaskUpdate}
            />
          </div>
        )}

        {activeTab === 'standup' && (
          <div className="p-6 h-full overflow-y-auto">
            <DailyStandup
              projectId={project._id}
              config={project.dailyStandup}
              onConfigUpdate={async (config) => {
                const res = await fetch(`/api/projects/${params.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ dailyStandup: config })
                })
                if (res.ok) {
                  const updatedProject = await res.json()
                  setProject(updatedProject)
                }
              }}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6 h-full overflow-y-auto">
            <ProjectAnalytics projectId={project._id} />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            {/* Project Team */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Project Team</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
                    Project Owners ({project.owners.length})
                  </h4>
                  <div className="space-y-3">
                    {project.owners.map(owner => (
                      <div key={owner._id} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {owner.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-zinc-900 dark:text-white text-sm font-medium">{owner.name}</p>
                          <p className="text-zinc-500 dark:text-zinc-400 text-xs">{owner.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
                    Team Members ({project.members.length})
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {project.members.map(member => (
                      <div key={member._id} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-zinc-900 dark:text-white text-sm font-medium">{member.name}</p>
                          <p className="text-zinc-500 dark:text-zinc-400 text-xs">{member.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Project Timeline */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Project Timeline</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm">Start Date</p>
                  <p className="text-zinc-900 dark:text-white text-lg font-semibold">
                    {project.startDate ? dayjs(project.startDate).format('MMM D, YYYY') : 'Not set'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm">End Date</p>
                  <p className="text-zinc-900 dark:text-white text-lg font-semibold">
                    {project.endDate ? dayjs(project.endDate).format('MMM D, YYYY') : 'Not set'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm">Duration</p>
                  <p className="text-zinc-900 dark:text-white text-lg font-semibold">
                    {project.startDate && project.endDate
                      ? `${dayjs(project.endDate).diff(project.startDate, 'day')} days`
                      : 'TBD'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              {project.startDate && project.endDate && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    <span>Progress</span>
                    <span>{stats.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stats.progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {tasks
                  .filter(task => task.status === 'done')
                  .sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())
                  .slice(0, 5)
                  .map(task => (
                    <div key={task._id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                      <CheckCircle2 className="text-green-500 flex-shrink-0" size={16} />
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-900 dark:text-white text-sm font-medium truncate">{task.title}</p>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                          Completed by {task.assignee?.name || 'Unknown'} • {dayjs(task.updatedAt).fromNow()}
                        </p>
                      </div>
                    </div>
                  ))}

                {tasks.filter(task => task.status === 'done').length === 0 && (
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm italic text-center py-4">
                    No completed tasks yet
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="p-6 h-full overflow-y-auto">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">Project Timeline</h3>

              {/* Timeline View */}
              <div className="space-y-4">
                {tasks
                  .filter(task => task.dueDate)
                  .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate!).valueOf())
                  .map(task => (
                    <div key={task._id} className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`w-3 h-3 rounded-full ${task.status === 'done' ? 'bg-green-400' :
                              task.status === 'in-progress' ? 'bg-blue-400' :
                                task.status === 'review' ? 'bg-purple-400' :
                                  'bg-zinc-400'
                            }`} />
                          <h4 className="text-zinc-900 dark:text-white font-medium">{task.title}</h4>
                          {task.assignee && (
                            <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                              → {task.assignee.name}
                            </span>
                          )}
                          {task.storyPoints && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs rounded-full">
                              {task.storyPoints} SP
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                          <span>Due: {dayjs(task.dueDate).format('MMM D, YYYY')}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${task.priority === 'urgent' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                              task.priority === 'high' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                                task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                  'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                            }`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs capitalize ${task.status === 'done' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' :
                              task.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                                'bg-zinc-100 dark:bg-zinc-500/20 text-zinc-600 dark:text-zinc-400'
                            }`}>
                            {task.status.replace('-', ' ')}
                          </span>
                          {dayjs(task.dueDate).isBefore(dayjs(), 'day') && task.status !== 'done' && (
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs rounded font-medium">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Timeline Progress Bar */}
                      <div className="w-32 h-4 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${task.status === 'done' ? 'bg-green-400' :
                              task.status === 'in-progress' ? 'bg-blue-400' :
                                task.status === 'review' ? 'bg-purple-400' :
                                  'bg-zinc-400'
                            }`}
                          style={{
                            width: task.status === 'done' ? '100%' :
                              task.status === 'review' ? '80%' :
                                task.status === 'in-progress' ? '50%' :
                                  task.status === 'todo' ? '20%' : '5%'
                          }}
                        />
                      </div>

                      {/* Days indicator */}
                      <div className="text-right min-w-[60px]">
                        <p className={`text-xs font-medium ${dayjs(task.dueDate).isBefore(dayjs(), 'day') ? 'text-red-500' :
                            dayjs(task.dueDate).diff(dayjs(), 'day') <= 3 ? 'text-yellow-500' :
                              'text-zinc-500 dark:text-zinc-400'
                          }`}>
                          {dayjs(task.dueDate).isBefore(dayjs(), 'day') ?
                            `${dayjs().diff(task.dueDate, 'day')}d overdue` :
                            `${dayjs(task.dueDate).diff(dayjs(), 'day')}d left`
                          }
                        </p>
                      </div>
                    </div>
                  ))}

                {tasks.filter(task => task.dueDate).length === 0 && (
                  <div className="text-center py-12 text-zinc-400">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold mb-2">No Timeline Data</p>
                    <p className="text-sm">No tasks with due dates assigned yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && canEditProject && (
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            {/* Project Settings */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Project Settings</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    Project Status
                  </label>
                  <select
                    value={projectForm.status}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    Methodology
                  </label>
                  <select
                    value={projectForm.methodology}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, methodology: e.target.value }))}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="agile">Agile</option>
                    <option value="kanban">Kanban</option>
                    <option value="waterfall">Waterfall</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Project description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={projectForm.endDate}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Daily Standup Settings */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Daily Standup Configuration</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="standup-enabled"
                    checked={project.dailyStandup?.enabled || false}
                    onChange={(e) => {
                      const newConfig = { ...project.dailyStandup, enabled: e.target.checked }
                      setProject(prev => prev ? { ...prev, dailyStandup: newConfig } : null)
                    }}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="standup-enabled" className="text-zinc-900 dark:text-white font-medium">
                    Enable Daily Standup
                  </label>
                </div>

                {project.dailyStandup?.enabled && (
                  <div className="grid md:grid-cols-3 gap-4 ml-7">
                    <div>
                      <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={project.dailyStandup.time || '09:00'}
                        className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={project.dailyStandup.duration || 15}
                        className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Timezone
                      </label>
                      <select
                        value={project.dailyStandup.timezone || 'Asia/Kolkata'}
                        className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Kanban Column Settings */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Kanban Board Configuration</h3>
              <div className="space-y-3">
                {project.kanbanColumns
                  .sort((a, b) => a.order - b.order)
                  .map((column, index) => (
                    <div key={column.id} className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: column.color }}
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          defaultValue={column.title}
                          className="bg-transparent text-zinc-900 dark:text-white font-medium border-none focus:outline-none w-full"
                          readOnly={!can(user?.role || '', ['admin'])}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-600 dark:text-zinc-400 text-sm">WIP Limit:</span>
                        <input
                          type="number"
                          defaultValue={column.wipLimit || ''}
                          placeholder="∞"
                          className="w-16 p-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none"
                          readOnly={!can(user?.role || '', ['admin'])}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-600 dark:text-zinc-400 text-sm">Color:</span>
                        <input
                          type="color"
                          defaultValue={column.color}
                          className="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-700"
                          disabled={!can(user?.role || '', ['admin'])}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Team Management */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Team Management</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">Project Owners</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {project.owners.map(owner => (
                      <div key={owner._id} className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {owner.name.charAt(0)}
                          </div>
                          <span className="text-sm text-zinc-900 dark:text-white">{owner.name}</span>
                        </div>
                        {can(user?.role || '', ['admin']) && project.owners.length > 1 && (
                          <button className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">Team Members</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {project.members.map(member => (
                      <div key={member._id} className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {member.name.charAt(0)}
                          </div>
                          <span className="text-sm text-zinc-900 dark:text-white">{member.name}</span>
                        </div>
                        {canEditProject && (
                          <button className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {canEditProject && (
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    <Plus size={16} />
                    Add Team Member
                  </button>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex gap-4">
              <button
                onClick={handleProjectUpdate}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Save Changes
              </button>
              <button
                onClick={loadProjectData}
                className="px-6 py-3 bg-zinc-500 hover:bg-zinc-600 text-white rounded-lg transition-colors font-medium"
              >
                Reset Changes
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">Danger Zone</h3>
              <p className="text-red-700 dark:text-red-400 text-sm mb-4">
                These actions are irreversible. Please proceed with caution.
              </p>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium">
                  Archive Project
                </button>
                <button className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm font-medium">
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
