'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/rbac'

interface User {
  _id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'employee'
  managerId?: { _id: string; name: string; email: string }
  createdAt: string
}

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [managers, setManagers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    managerId: ''
  })

  useEffect(() => {
    if (user && can(user.role, ['admin'])) {
      loadUsers()
    }
  }, [user])

  const loadUsers = async () => {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data)
    setManagers(data.filter((u: User) => u.role === 'manager'))
  }

  if (!user || !can(user.role, ['admin'])) {
    return <div>Access denied</div>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const userData = {
      ...formData,
      managerId: formData.managerId || undefined
    }

    const url = editingUser ? `/api/admin/users/${editingUser._id}` : '/api/admin/users'
    const method = editingUser ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })

    if (res.ok) {
      loadUsers()
      resetForm()
    } else {
      alert('Failed to save user')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'employee', managerId: '' })
    setShowForm(false)
    setEditingUser(null)
  }

  const editUser = (u: User) => {
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      managerId: u.managerId?._id || ''
    })
    setEditingUser(u)
    setShowForm(true)
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setUsers(users.filter(u => u._id !== id))
    }
  }

  const getTeamSize = (managerId: string) => {
    return users.filter(u => u.managerId?._id === managerId).length
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
          <h3 className="text-lg font-semibold">
            {editingUser ? 'Edit User' : 'Create New User'}
          </h3>

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

          <div className="grid md:grid-cols-3 gap-4">
            <input
              placeholder="Password"
              type="password"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
              required={!editingUser}
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
            {formData.role === 'employee' && (
              <select
                value={formData.managerId}
                onChange={e => setFormData({...formData, managerId: e.target.value})}
                className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
              >
                <option value="">No Manager</option>
                {managers.map(manager => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name} ({manager.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-white text-black rounded">
              {editingUser ? 'Update User' : 'Create User'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border border-zinc-700 rounded">Cancel</button>
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
              <th className="text-left p-4">Manager</th>
              <th className="text-left p-4">Team Size</th>
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
                  {u.managerId ? u.managerId.name : '-'}
                </td>
                <td className="p-4 text-zinc-400">
                  {u.role === 'manager' ? `${getTeamSize(u._id)} members` : '-'}
                </td>
                <td className="p-4 text-zinc-400">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 flex gap-2">
                  <button
                    onClick={() => editUser(u)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Edit
                  </button>
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
