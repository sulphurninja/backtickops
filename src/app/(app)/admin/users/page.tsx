'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/rbac'

interface User {
  _id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'employee'
  createdAt: string
}

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee' })

  useEffect(() => {
    if (user && can(user.role, ['admin'])) {
      fetch('/api/admin/users').then(r => r.json()).then(setUsers)
    }
  }, [user])

  if (!user || !can(user.role, ['admin'])) {
    return <div>Access denied</div>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      const newUser = await res.json()
      setUsers([newUser, ...users])
      setFormData({ name: '', email: '', password: '', role: 'employee' })
      setShowForm(false)
    } else {
      alert('Failed to create user')
    }
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setUsers(users.filter(u => u._id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-white text-black rounded hover:bg-gray-100 transition-colors"
        >
          Add User
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border border-zinc-800 rounded-lg space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              placeholder="Name"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
              required
            />
            <input
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
              required
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              placeholder="Password"
              type="password"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
              required
            />
            <select
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-white text-black rounded">Create User</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-zinc-700 rounded">Cancel</button>
          </div>
        </form>
      )}

      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-900">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Joined</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="border-t border-zinc-800">
                <td className="p-4 font-medium">{u.name}</td>
                <td className="p-4 text-zinc-400">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    u.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                    u.role === 'manager' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-zinc-400">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => deleteUser(u._id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
