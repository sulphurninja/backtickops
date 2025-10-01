'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/rbac'
import dayjs from 'dayjs'
import { CheckCircle, XCircle, MapPin, Clock, User } from 'lucide-react'

interface PendingAttendance {
  _id: string
  userId: { _id: string; name: string; email: string }
  date: string
  checkIn?: string
  checkOut?: string
  location?: { latitude: number; longitude: number }
  distance?: number
  status: 'pending' | 'approved' | 'rejected'
}

export default function ManagerAttendancePage() {
  const { user } = useAuth()
  const [pendingRecords, setPendingRecords] = useState<PendingAttendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && can(user.role, ['admin', 'manager'])) {
      loadPendingAttendance()
    }
  }, [user])

  const loadPendingAttendance = async () => {
    try {
      const res = await fetch('/api/manager/attendance/pending')
      const data = await res.json()
      setPendingRecords(data)
    } catch (error) {
      console.error('Failed to load pending attendance:', error)
    }
    setLoading(false)
  }

  const handleApproval = async (recordId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/manager/attendance/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (res.ok) {
        setPendingRecords(records => records.filter(r => r._id !== recordId))
      }
    } catch (error) {
      console.error('Failed to update attendance:', error)
    }
  }

  if (!user || !can(user.role, ['admin', 'manager'])) {
    return <div>Access denied</div>
  }

  const formatTime = (dateString: string) => {
    return dayjs(dateString).format('HH:mm')
  }

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('MMM D, YYYY')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Attendance Approvals</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Review and approve employee attendance records</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mx-auto"></div>
            <p className="text-zinc-600 dark:text-zinc-400">Loading pending approvals...</p>
          </div>
        </div>
      ) : pendingRecords.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">All caught up!</h3>
          <p className="text-zinc-600 dark:text-zinc-400">No pending attendance records to review.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingRecords.map(record => (
            <div key={record._id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">{record.userId.name}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{record.userId.email}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500">{formatDate(record.date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleApproval(record._id, 'reject')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproval(record._id, 'approve')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                </div>
              </div>

              <div className="mt-4 grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span className="text-zinc-600 dark:text-zinc-300">
                    Check In: {record.checkIn ? formatTime(record.checkIn) : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span className="text-zinc-600 dark:text-zinc-300">
                    Check Out: {record.checkOut ? formatTime(record.checkOut) : 'Not yet'}
                  </span>
                </div>

                {record.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-zinc-600 dark:text-zinc-300">
                      Distance: {record.distance}m from office
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
