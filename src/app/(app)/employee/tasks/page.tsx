'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface Task {
  _id: string
  title: string
  description: string
  status: 'todo' | 'doing' | 'done'
  due?: string
  priority: number
  tags: string[]
  projectId?: { _id: string; name: string; code: string }
}

export default function EmployeeTasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<'all' | 'todo' | 'doing' | 'done'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(data => {
        setTasks(data)
        setLoading(false)
      })
  }, [])

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

  if (loading) return <div>Loading tasks...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <div className="text-sm text-zinc-400">
          {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>

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

                  <div className="flex items-center gap-4 text-sm text-zinc-500">
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
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
