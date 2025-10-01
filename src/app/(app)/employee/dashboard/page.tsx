'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import dayjs from 'dayjs'
import {
  Calendar,
  CheckSquare,
  FolderOpen,
  Clock,
  TrendingUp,
  AlertTriangle,
  Target,
  Activity,
  ArrowRight,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Play
} from 'lucide-react'

interface Task {
  _id: string
  title: string
  status: 'todo' | 'doing' | 'done'
  due?: string
  priority: number
  projectId?: { name: string; code: string }
}

interface Project {
  _id: string
  name: string
  code: string
  description: string
  status: string
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [checkInStatus, setCheckInStatus] = useState<'in' | 'out' | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/projects').then(r => r.json())
    ]).then(([tasksData, projectsData]) => {
      setTasks(tasksData || [])
      setProjects(projectsData || [])
      setLoading(false)
    }).catch(() => {
      setTasks([])
      setProjects([])
      setLoading(false)
    })
  }, [])

  const handleCheckIn = async () => {
    try {
      await fetch('/api/attendance/check-in', { method: 'POST' })
      setCheckInStatus('in')
    } catch (error) {
      console.error('Check-in failed:', error)
    }
  }

  const handleCheckOut = async () => {
    try {
      await fetch('/api/attendance/check-out', { method: 'POST' })
      setCheckInStatus('out')
    } catch (error) {
      console.error('Check-out failed:', error)
    }
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        setTasks(tasks.map(t => t._id === taskId ? { ...t, status: status as any } : t))
      }
    } catch (error) {
      console.error('Task update failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mx-auto"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  const urgentTasks = tasks.filter(t =>
    t.status !== 'done' &&
    t.due &&
    dayjs(t.due).isBefore(dayjs().add(3, 'day'))
  )

  const todayTasks = tasks.filter(t => t.status !== 'done')
  const completedToday = tasks.filter(t => t.status === 'done').length
  const totalTasks = tasks.length || 1
  const completionRate = Math.round((completedToday / totalTasks) * 100)

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            {dayjs().format('dddd, MMMM D, YYYY')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {checkInStatus !== 'in' ? (
            <button
              onClick={handleCheckIn}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Clock size={20} />
              Check In
            </button>
          ) : (
            <button
              onClick={handleCheckOut}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              <Clock size={20} />
              Check Out
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <CheckSquare className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{todayTasks.length}</span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Active Tasks</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Tasks in progress</p>
        </div>

        <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Target className="w-6 h-6 text-green-500 dark:text-green-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{completionRate}%</span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Completion Rate</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Tasks completed today</p>
        </div>

        <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-500 dark:text-orange-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{urgentTasks.length}</span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Urgent Tasks</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Due within 3 days</p>
        </div>

        <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <FolderOpen className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{projects.length}</span>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Active Projects</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Projects you're in</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/planner"
          className="group flex items-center gap-4 p-6 bg-gradient-to-r from-blue-500/10 to-blue-400/5 dark:from-blue-600/10 dark:to-blue-500/5 border border-blue-200/50 dark:border-blue-500/20 rounded-xl hover:from-blue-500/15 hover:to-blue-400/10 dark:hover:from-blue-600/15 dark:hover:to-blue-500/10 transition-all duration-200"
        >
          <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Daily Planner</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Plan your day</p>
          </div>
        </Link>

        <Link
          href="/employee/tasks"
          className="group flex items-center gap-4 p-6 bg-gradient-to-r from-green-500/10 to-green-400/5 dark:from-green-600/10 dark:to-green-500/5 border border-green-200/50 dark:border-green-500/20 rounded-xl hover:from-green-500/15 hover:to-green-400/10 dark:hover:from-green-600/15 dark:hover:to-green-500/10 transition-all duration-200"
        >
          <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
            <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">My Tasks</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{todayTasks.length} active</p>
          </div>
        </Link>

        <Link
          href="/employee/projects"
          className="group flex items-center gap-4 p-6 bg-gradient-to-r from-purple-500/10 to-purple-400/5 dark:from-purple-600/10 dark:to-purple-500/5 border border-purple-200/50 dark:border-purple-500/20 rounded-xl hover:from-purple-500/15 hover:to-purple-400/10 dark:hover:from-purple-600/15 dark:hover:to-purple-500/10 transition-all duration-200"
        >
          <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
            <FolderOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Projects</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{projects.length} active</p>
          </div>
        </Link>

        <div className="group flex items-center gap-4 p-6 bg-gradient-to-r from-orange-500/10 to-orange-400/5 dark:from-orange-600/10 dark:to-orange-500/5 border border-orange-200/50 dark:border-orange-500/20 rounded-xl">
          <div className="p-3 bg-orange-500/20 rounded-lg">
            <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Performance</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{completionRate}% today</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Urgent Tasks */}
        <div className="lg:col-span-2">
          {urgentTasks.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Urgent Tasks</h2>
                </div>
                <Link href="/employee/tasks" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">
                  View all <ArrowRight size={16} />
                </Link>
              </div>

              <div className="space-y-3">
                {urgentTasks.slice(0, 3).map(task => (
                  <TaskItem key={task._id} task={task} onStatusChange={updateTaskStatus} urgent />
                ))}
              </div>
            </div>
          )}

          {/* Today's Tasks */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <CheckSquare className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Today's Tasks</h2>
              </div>
              <Link href="/employee/tasks" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">
                View all <ArrowRight size={16} />
              </Link>
            </div>

            <div className="space-y-3">
              {todayTasks.slice(0, 6).map(task => (
                <TaskItem key={task._id} task={task} onStatusChange={updateTaskStatus} />
              ))}
              {todayTasks.length === 0 && (
                <div className="text-center py-12 bg-white/30 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <CheckCircle2 className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-600 dark:text-zinc-400">All caught up! No pending tasks.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <FolderOpen className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Recent Projects</h2>
            </div>
            <Link href="/employee/projects" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">
              View all <ArrowRight size={16} />
            </Link>
          </div>

          <div className="space-y-4">
            {projects.slice(0, 4).map(project => (
              <Link
                key={project._id}
                href={`/employee/projects/${project._id}`}
                className="block p-4 bg-white/30 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-white/50 dark:hover:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                    {project.code}
                  </div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white truncate">{project.name}</h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{project.description}</p>
              </Link>
            ))}

            {projects.length === 0 && (
              <div className="text-center py-8 bg-white/30 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <FolderOpen className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-600 dark:text-zinc-400">No projects assigned yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Task Item Component
function TaskItem({
  task,
  onStatusChange,
  urgent = false
}: {
  task: Task
  onStatusChange: (id: string, status: string) => void
  urgent?: boolean
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'doing':
        return <Play size={16} className="text-blue-500 dark:text-blue-400" />
      case 'done':
        return <CheckCircle2 size={16} className="text-green-500 dark:text-green-400" />
      default:
        return <Circle size={16} className="text-zinc-400 dark:text-zinc-500" />
    }
  }

  const handleStatusClick = () => {
    const nextStatus = task.status === 'todo' ? 'doing' :
                      task.status === 'doing' ? 'done' : 'todo'
    onStatusChange(task._id, nextStatus)
  }

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 hover:bg-white/50 dark:hover:bg-zinc-900/50 ${
      urgent
        ? 'bg-orange-50/50 dark:bg-orange-500/5 border-orange-200 dark:border-orange-500/20'
        : 'bg-white/30 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
    }`}>
      <button
        onClick={handleStatusClick}
        className="flex-shrink-0 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        {getStatusIcon(task.status)}
      </button>

      <div className="flex-1 min-w-0">
        <h3 className={`font-medium transition-all ${
          task.status === 'done'
            ? 'line-through text-zinc-500 dark:text-zinc-500'
            : 'text-zinc-900 dark:text-white'
        }`}>
          {task.title}
        </h3>
        <div className="flex items-center gap-3 mt-1">
          {task.projectId && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{task.projectId.name}</span>
          )}
          {task.due && (
            <span className={`text-xs ${
              urgent ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500 dark:text-zinc-400'
            }`}>
              Due {dayjs(task.due).format('MMM D')}
            </span>
          )}
        </div>
      </div>

      <div className={`px-2 py-1 rounded text-xs font-medium ${
        task.status === 'todo' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' :
        task.status === 'doing' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
        'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
      }`}>
        {task.status === 'doing' ? 'In Progress' : task.status}
      </div>
    </div>
  )
}
