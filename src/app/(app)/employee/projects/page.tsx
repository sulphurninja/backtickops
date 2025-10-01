'use client'
import { useEffect, useState } from 'react'
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

export default function EmployeeProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        setProjects(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading projects...</div>

  const activeProjects = projects.filter(p => p.status === 'active')
  const otherProjects = projects.filter(p => p.status !== 'active')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">My Projects</h1>
        <p className="text-zinc-400 mt-1">Projects you're involved in</p>
      </div>

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-green-400">🟢 Active Projects</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProjects.map(project => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        </div>
      )}

      {/* Other Projects */}
      {otherProjects.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-zinc-400">📁 Other Projects</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherProjects.map(project => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="text-center py-12 text-zinc-400">
          <div className="text-4xl mb-4">📁</div>
          <p>You're not assigned to any projects yet</p>
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'paused': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'done': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
    }
  }

  return (
    <Link
      href={`/employee/projects/${project._id}`}
      className="block border border-zinc-800 rounded-lg p-6 hover:bg-zinc-900/50 transition-all hover:border-zinc-700"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-sm font-mono font-bold">
            {project.code}
          </div>
          <h3 className="font-semibold text-lg">{project.name}</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
          {project.status}
        </div>
      </div>

      <p className="text-zinc-400 text-sm mb-4 line-clamp-3">{project.description}</p>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Project Owners</p>
          <div className="flex items-center gap-2">
            {project.owners.slice(0, 3).map(owner => (
              <div key={owner._id} className="flex items-center gap-2">
                <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center text-xs">
                  {owner.name.charAt(0)}
                </div>
                <span className="text-sm text-zinc-300">{owner.name}</span>
              </div>
            ))}
            {project.owners.length > 3 && (
              <span className="text-xs text-zinc-500">+{project.owners.length - 3} more</span>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-zinc-500 mb-1">Team Size</p>
          <p className="text-sm text-zinc-300">{project.members.length + project.owners.length} members</p>
        </div>
      </div>
    </Link>
  )
}
