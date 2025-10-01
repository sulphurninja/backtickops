'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/rbac'

interface Task {
  _id: string
  title: string
  description: string
  status: 'todo' | 'doing' | 'done'
  assignee?: { _id: string; name: string; email: string }
  projectId?: { _id: string; name: string; code: string }
  due?: string
  priority: number
  tags: string[]
  createdAt: string
}

interface User {
  _id: string
  name: string
  email: string
  role: string
}

interface Project {
  _id: string
  name: string
  code: string
}

export default function TasksManagementPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState<'all' | 'todo' | 'doing' | 'done'>('all')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    projectId: '',
    due: '',
    priority: 3,
    tags: '' as string
  })

  useEffect(() => {
    if (user && can(user.role, ['admin', 'manager'])) {
      Promise.all([
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/projects').then(r => r.json())
      ]).then(([tasksData, usersData, projectsData]) => {
        setTasks(tasksData)
        setUsers(usersData)
        setProjects(projectsData)
      })
    }
  }, [user])

  if (!user || !can(user.role, ['admin', 'manager'])) {
    return <div>Access denied</div>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const taskData = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      due: formData.due || undefined,
      assignee: formData.assignee || undefined,
      projectId: formData.projectId || undefined
    }

    const url = editingTask ? `/api/tasks/${editingTask._id}` : '/api/tasks'
    const method = editingTask ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    })

    if (res.ok) {
      const newTask = await res.json()
      if (editingTask) {
        setTasks(tasks.map(t => t._id === editingTask._id ? newTask : t))
      } else {
        setTasks([newTask, ...tasks])
      }
      resetForm()
    } else {
      alert('Failed to save task')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignee: '',
      projectId: '',
      due: '',
      priority: 3,
      tags: ''
    })
    setShowForm(false)
    setEditingTask(null)
  }

  const editTask = (task: Task) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      assignee: task.assignee?._id || '',
      projectId: task.projectId?._id || '',
      due: task.due ? new Date(task.due).toISOString().split('T')[0] : '',
      priority: task.priority,
      tags: task.tags.join(', ')
    })
    setEditingTask(task)
    setShowForm(true)
  }

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTasks(tasks.filter(t => t._id !== id))
    }
  }

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

  const filteredTasks = tasks.filter(task => filter === 'all' || task.status === filter)
  const taskCounts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    doing: tasks.filter(t => t.status === 'doing').length,
    done: tasks.filter(t => t.status === 'done').length,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Task Management</h1>
          <p className="text-zinc-400">Create and manage tasks for your team</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-white text-black rounded hover:bg-gray-100 transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Task'}
        </button>
      </div>

      {/* Task Creation/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border border-zinc-800 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              placeholder="Task Title"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
              required
            />
            <select
              value={formData.assignee}
              onChange={e => setFormData({...formData, assignee: e.target.value})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
            >
              <option value="">Select Assignee</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <textarea
            placeholder="Task Description"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded h-24"
          />

          <div className="grid md:grid-cols-4 gap-4">
            <select
              value={formData.projectId}
              onChange={e => setFormData({...formData, projectId: e.target.value})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
            >
              <option value="">No Project</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>
                  {project.name} ({project.code})
                </option>
              ))}
            </select>

            <input
              type="date"
              value={formData.due}
              onChange={e => setFormData({...formData, due: e.target.value})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
            />

            <select
              value={formData.priority}
              onChange={e => setFormData({...formData, priority: Number(e.target.value)})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
            >
              <option value={1}>High Priority</option>
              <option value={2}>High Priority</option>
              <option value={3}>Medium Priority</option>
              <option value={4}>Medium Priority</option>
              <option value={5}>Low Priority</option>
            </select>

            <input
              placeholder="Tags (comma separated)"
              value={formData.tags}
              onChange={e => setFormData({...formData, tags: e.target.value})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-white text-black rounded">
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border border-zinc-700 rounded">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 border border-zinc-800 rounded-lg p-1 w-fit">
        {(['all', 'todo', 'doing', 'done'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} ({taskCounts[status]})
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <div className="text-4xl mb-4">📝</div>
            <p>No {filter === 'all' ? '' : filter} tasks found</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task._id} className="border border-zinc-800 rounded-lg p-6 hover:bg-zinc-900/50 transition-colors">
              <div className="flex items-start gap-4">
                {/* Status Toggle */}
                <button
                  onClick={() => {
                    const nextStatus = task.status === 'todo' ? 'doing' :
                                     task.status === 'doing' ? 'done' : 'todo'
                    updateTaskStatus(task._id, nextStatus)
                  }}
                  className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    task.status === 'todo' ? 'border-zinc-600 hover:border-blue-400' :
                    task.status === 'doing' ? 'border-blue-400 bg-blue-500/20 text-blue-400' :
                    'border-green-400 bg-green-500/20 text-green-400'
                  }`}
                >
                  {task.status === 'doing' && '●'}
                  {task.status === 'done' && '✓'}
                </button>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className={`text-lg font-semibold ${
                      task.status === 'done' ? 'line-through text-zinc-500' : ''
                    }`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Priority */}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      {/* Status */}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        task.status === 'todo' ? 'bg-zinc-800 text-zinc-300' :
                        task.status === 'doing' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-zinc-400 mb-3 text-sm">{task.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      {task.assignee && (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-zinc-700 rounded-full flex items-center justify-center text-xs">
                            {task.assignee.name.charAt(0)}
                          </div>
                          <span>{task.assignee.name}</span>
                        </div>
                      )}
                      {task.projectId && (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-zinc-700 rounded text-xs font-mono flex items-center justify-center">
                            {task.projectId.code}
                          </div>
                          <span>{task.projectId.name}</span>
                        </div>
                      )}
                      {task.due && (
                        <div className="flex items-center gap-1">
                          <span>📅</span>
                          <span>Due {new Date(task.due).toLocaleDateString()}</span>
                        </div>
                      )}
                      {task.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {task.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-zinc-800 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => editTask(task)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task._id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
