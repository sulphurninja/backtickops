'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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
  assignee: { _id: string; name: string }
  due?: string
  priority: number
}

export default function ProjectDetailPage() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${params.id}`),
      fetch(`/api/tasks?projectId=${params.id}`)
    ]).then(async ([projectRes, tasksRes]) => {
      const [projectData, tasksData] = await Promise.all([
        projectRes.json(),
        tasksRes.json()
      ])
      setProject(projectData)
      setTasks(tasksData)
      setLoading(false)
    })
  }, [params.id])

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

  const myTasks = tasks.filter(task => task.assignee?._id === project.owners[0]._id) // This should use current user ID
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

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <Link href="/employee/projects" className="text-zinc-400 hover:text-white">
            ← Back to Projects
          </Link>
        </div>

        <div className="flex items-center gap-6 mb-4">
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

        <p className="text-zinc-400 text-lg mb-6">{project.description}</p>

        {/* Project Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
            <div className="text-2xl font-bold text-zinc-300">{project.members?.length + project.owners?.length}</div>
            <div className="text-sm text-zinc-400">Team Members</div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Team</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-zinc-400 mb-3">Project Owners</h3>
            <div className="space-y-2">
              {project.owners?.map(owner => (
                <div key={owner._id} className="flex items-center gap-3 p-3 border border-zinc-800 rounded-lg">
                  <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-sm">
                    {owner.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{owner.name}</div>
                    <div className="text-sm text-zinc-400">{owner.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-zinc-400 mb-3">Team Members</h3>
            <div className="space-y-2">
              {project.members?.map(member => (
                <div key={member._id} className="flex items-center gap-3 p-3 border border-zinc-800 rounded-lg">
                  <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-sm">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-zinc-400">{member.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* My Tasks */}
      <div>
        <h2 className="text-xl font-semibold mb-4">My Tasks in this Project</h2>
        {myTasks.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <div className="text-3xl mb-2">📝</div>
            <p>No tasks assigned to you in this project</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTasks.map(task => (
              <div key={task._id} className="border border-zinc-800 rounded-lg p-4 hover:bg-zinc-900/50 transition-colors">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      const nextStatus = task.status === 'todo' ? 'doing' :
                                       task.status === 'doing' ? 'done' : 'todo'
                      updateTaskStatus(task._id, nextStatus)
                    }}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      task.status === 'todo' ? 'border-zinc-600 hover:border-blue-400' :
                      task.status === 'doing' ? 'border-blue-400 bg-blue-500/20 text-blue-400' :
                      'border-green-400 bg-green-500/20 text-green-400'
                    }`}
                  >
                    {task.status === 'doing' && '●'}
                    {task.status === 'done' && '✓'}
                  </button>

                  <div className="flex-1">
                    <h3 className={`font-medium ${task.status === 'done' ? 'line-through text-zinc-500' : ''}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-zinc-400 mt-1">{task.description}</p>
                    )}
                    {task.due && (
                      <p className="text-xs text-zinc-500 mt-2">
                        Due: {new Date(task.due).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className={`px-2 py-1 rounded text-xs ${
                    task.status === 'todo' ? 'bg-zinc-800 text-zinc-300' :
                    task.status === 'doing' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {task.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
