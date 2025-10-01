'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/rbac'
import dayjs from 'dayjs'
import { CheckCircle, XCircle, MapPin, Clock, User, Filter, Calendar, Download, Eye } from 'lucide-react'

interface AttendanceRecord {
  _id: string
  userId: { _id: string; name: string; email: string }
  date: string
  checkIn?: string
  checkOut?: string
  location?: { latitude: number; longitude: number }
  distance?: number
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  mode: 'office' | 'remote'
}

export default function ManagerAttendancePage() {
  const { user } = useAuth()
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState<string | null>(null)

  useEffect(() => {
    if (user && can(user.role, ['admin', 'manager'])) {
      loadAttendance()
    }
  }, [user, selectedDate])

  const loadAttendance = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/manager/team/attendance?date=${selectedDate}`)
      const data = await res.json()
      setAttendanceRecords(data)
    } catch (error) {
      console.error('Failed to load attendance:', error)
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
        // Update local state
        setAttendanceRecords(records =>
          records.map(record =>
            record._id === recordId
              ? { ...record, status: action === 'approve' ? 'approved' : 'rejected' }
              : record
          )
        )
      }
    } catch (error) {
      console.error('Failed to update attendance:', error)
    }
  }

  if (!user || !can(user.role, ['admin', 'manager'])) {
    return <div>Access denied</div>
  }

  const filteredRecords = attendanceRecords.filter(record => {
    if (statusFilter === 'all') return true
    return record.status === statusFilter
  })

  const pendingCount = attendanceRecords.filter(r => r.status === 'pending').length
  const approvedCount = attendanceRecords.filter(r => r.status === 'approved').length
  const rejectedCount = attendanceRecords.filter(r => r.status === 'rejected').length

  const formatTime = (dateString: string) => {
    return dayjs(dateString).format('HH:mm')
  }

  const calculateHours = (checkIn: string, checkOut: string) => {
    const start = dayjs(checkIn)
    const end = dayjs(checkOut)
    const hours = end.diff(start, 'minute') / 60
    return hours.toFixed(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
      case 'approved': return 'bg-green-500/20 text-green-600 dark:text-green-400'
      case 'rejected': return 'bg-red-500/20 text-red-600 dark:text-red-400'
      default: return 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Team Attendance</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Monitor and approve team attendance records</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg"
          />
          <button
            onClick={() => setSelectedDate(dayjs().format('YYYY-MM-DD'))}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">{attendanceRecords.length}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Records</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Pending</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedCount}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Approved</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedCount}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 w-fit">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Attendance Records */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-400">
            <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            Loading attendance records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No records found</h3>
            <p>No attendance records for {dayjs(selectedDate).format('MMMM D, YYYY')}</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredRecords.map(record => (
              <div key={record._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{record.userId.name}</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{record.userId.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {record.checkIn && (
                          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                            <Clock size={14} />
                            In: {formatTime(record.checkIn)}
                          </div>
                        )}
                        {record.checkOut && (
                          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                            <Clock size={14} />
                            Out: {formatTime(record.checkOut)}
                          </div>
                        )}
                        {record.checkIn && record.checkOut && (
                          <div className="text-zinc-500 dark:text-zinc-400">
                            ({calculateHours(record.checkIn, record.checkOut)}h)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>

                    {/* Location Info */}
                    {record.location && record.distance !== undefined && (
                      <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                        <MapPin size={14} />
                        {record.distance}m from office
                      </div>
                    )}

                    {/* Action Buttons */}
                    {record.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproval(record._id, 'reject')}
                          className="flex items-center gap-1 px-3 py-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproval(record._id, 'approve')}
                          className="flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors"
                        >
                          <CheckCircle size={14} />
                          Approve
                        </button>
                      </div>
                    )}

                    {/* View Details Button */}
                    <button
                      onClick={() => setShowDetails(showDetails === record._id ? null : record._id)}
                      className="flex items-center gap-1 px-3 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      <Eye size={14} />
                      Details
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {showDetails === record._id && (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-zinc-900 dark:text-white mb-2">Attendance Details</h4>
                        <div className="space-y-1 text-zinc-600 dark:text-zinc-400">
                          <p>Date: {dayjs(record.date).format('MMMM D, YYYY')}</p>
                          <p>Mode: {record.mode === 'office' ? 'Office' : 'Remote'}</p>
                          {record.checkIn && <p>Check In: {dayjs(record.checkIn).format('h:mm A')}</p>}
                          {record.checkOut && <p>Check Out: {dayjs(record.checkOut).format('h:mm A')}</p>}
                        </div>
                      </div>
                      {record.location && (
                        <div>
                          <h4 className="font-medium text-zinc-900 dark:text-white mb-2">Location Details</h4>
                          <div className="space-y-1 text-zinc-600 dark:text-zinc-400">
                            <p>Latitude: {record.location.latitude.toFixed(6)}</p>
                            <p>Longitude: {record.location.longitude.toFixed(6)}</p>
                            {record.distance !== undefined && (
                              <p>Distance from office: {record.distance}m</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {record.notes && (
                      <div className="mt-4">
                        <h4 className="font-medium text-zinc-900 dark:text-white mb-2">Notes</h4>
                        <p className="text-zinc-600 dark:text-zinc-400">{record.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
