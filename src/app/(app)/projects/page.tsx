'use client'
import { useEffect, useState } from 'react'
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

interface User {
  _id: string
  name: string
  email: string
  role: string
}

export default function ProjectsManagementPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    members: [] as string[],
    status: 'active' as 'active' | 'paused' | 'done'
  })

  useEffect(() => {
    if (user && can(user.role, ['admin', 'manager'])) {
      Promise.all([
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/admin/users').then(r => r.json())
      ]).then(([projectsData, usersData]) => {
        setProjects(projectsData)
        setUsers(usersData)
      })
    }
  }, [user])

  if (!user || !can(user.role, ['admin', 'manager'])) {
    return <div>Access denied</div>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editingProject ? `/api/projects/${editingProject._id}` : '/api/projects'
    const method = editingProject ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      const newProject = await res.json()
      if (editingProject) {
        setProjects(projects.map(p => p._id === editingProject._id ? newProject : p))
      } else {
        setProjects([newProject, ...projects])
      }
      resetForm()
    } else {
      alert('Failed to save project')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      members: [],
      status: 'active'
    })
    setShowForm(false)
    setEditingProject(null)
  }

  const editProject = (project: Project) => {
    setFormData({
      name: project.name,
      code: project.code,
      description: project.description || '',
      members: project.members.map(m => m._id),
      status: project.status
    })
    setEditingProject(project)
    setShowForm(true)
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project? This will also remove all associated tasks.')) return
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProjects(projects.filter(p => p._id !== id))
    }
  }

  const toggleMember = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId]
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'paused': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'done': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Management</h1>
          <p className="text-zinc-400">Create and manage projects for your organization</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-white text-black rounded hover:bg-gray-100 transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Project'}
        </button>
      </div>

      {/* Project Creation/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border border-zinc-800 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold">
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              placeholder="Project Name"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
              required
            />
            <input
              placeholder="Project Code (e.g., BTO)"
              value={formData.code}
              onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
              maxLength={5}
              required
            />
          </div>

          <textarea
            placeholder="Project Description"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded h-24"
          />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Project Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="done">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Team Members</label>
              <div className="border border-zinc-800 rounded p-3 max-h-40 overflow-y-auto">
                {users.map(u => (
                  <label key={u._id} className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.members.includes(u._id)}
                      onChange={() => toggleMember(u._id)}
                      className="rounded"
                    />
                    <span className="text-sm">{u.name} ({u.email})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-white text-black rounded">
              {editingProject ? 'Update Project' : 'Create Project'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border border-zinc-700 rounded">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project._id} className="border border-zinc-800 rounded-lg p-6 hover:bg-zinc-900/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-sm font-mono font-bold">
                  {project.code}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <div className={`inline-flex px-2 py-1 rounded text-xs font-medium border mt-1 ${getStatusColor(project.status)}`}>
                    {project.status}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-zinc-400 text-sm mb-4 line-clamp-3">{project.description}</p>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs text-zinc-500 mb-2">Project Owners</p>
                <div className="flex items-center gap-2">
                  {project.owners.slice(0, 2).map(owner => (
                    <div key={owner._id} className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center text-xs">
                        {owner.name.charAt(0)}
                      </div>
                      <span className="text-sm text-zinc-300">{owner.name}</span>
                    </div>
                  ))}
                  {project.owners.length > 2 && (
                    <span className="text-xs text-zinc-500">+{project.owners.length - 2}</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-zinc-500 mb-1">Team Size</p>
                <p className="text-sm text-zinc-300">{project.members.length + project.owners.length} members</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <Link
                href={`/projects/${project._id}`}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                View Details →
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => editProject(project)}
                  className="text-zinc-400 hover:text-white text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteProject(project._id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 text-zinc-400">
          <div className="text-4xl mb-4">📁</div>
          <p>No projects created yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 border border-zinc-700 rounded hover:bg-zinc-800 transition-colors"
          >
            Create your first project
          </button>
        </div>
      )}
    </div>
  )
}
