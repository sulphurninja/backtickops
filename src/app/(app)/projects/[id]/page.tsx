'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/rbac'
import Link from 'next/link'

interface Project {
  _id: string
  name: string
  code: string
  description: string
  status: 'active' | 'paused' | 'done'
  owners: { _id: string; name: string; email: string }[]
  members: { _id: string; name: string; email: string }[]
  createdAt: string
}

interface Task {
  _id: string
  title: string
  description: string
  status: 'todo' | 'doing' | 'done'
  assignee?: { _id: string; name: string; email: string }
  due?: string
  priority: number
  tags: string[]
  createdAt: string
}

interface User {
  _id: string
  name: string
  email: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    due: '',
    priority: 3
  })

  useEffect(() => {
    if (user && can(user.role, ['admin', 'manager'])) {
      Promise.all([
        fetch(`/api/projects/${params.id}`),
        fetch(`/api/tasks?projectId=${params.id}`),
        fetch('/api/admin/users')
      ]).then(async ([projectRes, tasksRes, usersRes]) => {
        const [projectData, tasksData, usersData] = await Promise.all([
          projectRes.json(),
          tasksRes.json(),
          usersRes.json()
        ])
        setProject(projectData)
        setTasks(tasksData)
        setUsers(usersData)
        setLoading(false)
      })
    }
  }, [params.id, user])

  if (!user || !can(user.role, ['admin', 'manager'])) {
    return <div>Access denied</div>
  }

  if (loading) return <div>Loading project...</div>
  if (!project) return <div>Project not found</div>

  const updateTaskStatus = async (taskId: string, status: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (res.ok) {
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: status as any } : t))
    }
  }

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...taskFormData,
        projectId: params.id,
        assignee: taskFormData.assignee || undefined,
        due: taskFormData.due || undefined
      })
    })

    if (res.ok) {
      const newTask = await res.json()
      setTasks([newTask, ...tasks])
      setTaskFormData({ title: '', description: '', assignee: '', due: '', priority: 3 })
      setShowTaskForm(false)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    if (res.ok) {
      setTasks(tasks.filter(t => t._id !== taskId))
    }
  }

  const todoTasks = tasks.filter(t => t.status === 'todo')
  const doingTasks = tasks.filter(t => t.status === 'doing')
  const doneTasks = tasks.filter(t => t.status === 'done')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'paused': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'done': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return 'text-red-400 bg-red-500/10'
    if (priority <= 4) return 'text-orange-400 bg-orange-500/10'
    return 'text-green-400 bg-green-500/10'
  }

  const getPriorityLabel = (priority: number) => {
    if (priority <= 2) return 'High'
    if (priority <= 4) return 'Medium'
    return 'Low'
  }

  const completionRate = tasks?.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <Link href="/projects" className="text-zinc-400 hover:text-white">
            ← Back to Projects
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center text-xl font-mono font-bold">
              {project.code}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border mt-2 ${getStatusColor(project.status)}`}>
                {project.status}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowTaskForm(true)}
            className="px-4 py-2 bg-white text-black rounded hover:bg-gray-100 transition-colors"
          >
            Add Task
          </button>
        </div>

        <p className="text-zinc-400 text-lg mb-6">{project.description}</p>

        {/* Project Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-zinc-900/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">{todoTasks.length}</div>
            <div className="text-sm text-zinc-400">To Do</div>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{doingTasks.length}</div>
            <div className="text-sm text-zinc-400">In Progress</div>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{doneTasks.length}</div>
            <div className="text-sm text-zinc-400">Completed</div>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-zinc-300">{project.members.length + project.owners.length}</div>
            <div className="text-sm text-zinc-400">Team Members</div>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{completionRate}%</div>
            <div className="text-sm text-zinc-400">Complete</div>
          </div>
        </div>
      </div>

      {/* Task Creation Form */}
      {showTaskForm && (
        <form onSubmit={createTask} className="p-6 border border-zinc-800 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold">Add New Task</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              placeholder="Task Title"
              value={taskFormData.title}
              onChange={e => setTaskFormData({...taskFormData, title: e.target.value})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
              required
            />
            <select
              value={taskFormData.assignee}
              onChange={e => setTaskFormData({...taskFormData, assignee: e.target.value})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
            >
              <option value="">Select Assignee</option>
              {[...project.owners, ...project.members].map(member => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </div>

          <textarea
            placeholder="Task Description"
            value={taskFormData.description}
            onChange={e => setTaskFormData({...taskFormData, description: e.target.value})}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded h-24"
          />

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="date"
              value={taskFormData.due}
              onChange={e => setTaskFormData({...taskFormData, due: e.target.value})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
            />
            <select
              value={taskFormData.priority}
              onChange={e => setTaskFormData({...taskFormData, priority: Number(e.target.value)})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
            >
              <option value={1}>High Priority</option>
              <option value={2}>High Priority</option>
              <option value={3}>Medium Priority</option>
              <option value={4}>Medium Priority</option>
              <option value={5}>Low Priority</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-white text-black rounded">
              Create Task
            </button>
            <button type="button" onClick={() => setShowTaskForm(false)} className="px-4 py-2 border border-zinc-700 rounded">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Team Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Team</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-zinc-400 mb-3">Project Owners</h3>
            <div className="space-y-2">
              {project.owners.map(owner => (
                <div key={owner._id} className="flex items-center gap-3 p-3 border border-zinc-800 rounded-lg">
                  <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-sm">
                    {owner.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{owner.name}</div>
                    <div className="text-sm text-zinc-400">{owner.email}</div>
                  </div>
                  <div className="ml-auto">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                      Owner
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-zinc-400 mb-3">Team Members</h3>
            <div className="space-y-2">
              {project.members.map(member => (
                <div key={member._id} className="flex items-center gap-3 p-3 border border-zinc-800 rounded-lg">
                  <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-sm">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-zinc-400">{member.email}</div>
                  </div>
                  <div className="ml-auto">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      Member
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Board - Kanban Style */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Project Tasks</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* To Do Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <h3 className="font-semibold">To Do ({todoTasks.length})</h3>
            </div>
            <div className="space-y-3">
              {todoTasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onStatusChange={updateTaskStatus}
                  onDelete={deleteTask}
                  getPriorityColor={getPriorityColor}
                  getPriorityLabel={getPriorityLabel}
                />
              ))}
              {todoTasks.length === 0 && (
                <div className="text-center py-8 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg">
                  No tasks to do
                </div>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h3 className="font-semibold">In Progress ({doingTasks.length})</h3>
            </div>
            <div className="space-y-3">
              {doingTasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onStatusChange={updateTaskStatus}
                  onDelete={deleteTask}
                  getPriorityColor={getPriorityColor}
                  getPriorityLabel={getPriorityLabel}
                />
              ))}
              {doingTasks.length === 0 && (
                <div className="text-center py-8 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg">
                  No tasks in progress
                </div>
              )}
            </div>
          </div>

          {/* Done Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h3 className="font-semibold">Done ({doneTasks.length})</h3>
            </div>
            <div className="space-y-3">
              {doneTasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onStatusChange={updateTaskStatus}
                  onDelete={deleteTask}
                  getPriorityColor={getPriorityColor}
                  getPriorityLabel={getPriorityLabel}
                />
              ))}
              {doneTasks.length === 0 && (
                <div className="text-center py-8 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg">
                  No completed tasks
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Task Card Component
function TaskCard({
  task,
  onStatusChange,
  onDelete,
  getPriorityColor,
  getPriorityLabel
}: {
  task: Task
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
  getPriorityColor: (priority: number) => string
  getPriorityLabel: (priority: number) => string
}) {
  const handleStatusChange = () => {
    const nextStatus = task.status === 'todo' ? 'doing' :
                      task.status === 'doing' ? 'done' : 'todo'
    onStatusChange(task._id, nextStatus)
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-900 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <h4 className={`font-medium ${task.status === 'done' ? 'line-through text-zinc-500' : ''}`}>
          {task.title}
        </h4>
        <div className="flex items-center gap-1">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {getPriorityLabel(task.priority)}
          </span>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="space-y-2">
        {task.assignee && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-5 h-5 bg-zinc-700 rounded-full flex items-center justify-center text-xs">
              {task.assignee.name.charAt(0)}
            </div>
            <span className="text-zinc-300">{task.assignee.name}</span>
          </div>
        )}

        {task.due && (
          <div className="text-xs text-zinc-500">
            Due: {new Date(task.due).toLocaleDateString()}
          </div>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {task.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-zinc-800 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
        <button
          onClick={handleStatusChange}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            task.status === 'todo' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' :
            task.status === 'doing' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' :
            'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          {task.status === 'todo' ? 'Start' : task.status === 'doing' ? 'Complete' : 'Reopen'}
        </button>

        <button
          onClick={() => onDelete(task._id)}
          className="text-red-400 hover:text-red-300 text-xs"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
