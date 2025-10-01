'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/rbac'
import dayjs from 'dayjs'

interface AttendanceRecord {
  _id: string
  userId: { _id: string; name: string; email: string }
  date: string
  checkIn?: string
  checkOut?: string
  notes?: string
  mode: 'office' | 'remote'
}

export default function AttendanceManagementPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && can(user.role, ['admin'])) {
      loadAttendance()
    }
  }, [user, selectedDate])

  const loadAttendance = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/attendance?date=${selectedDate}`)
      const data = await res.json()
      setRecords(data)
    } catch (error) {
      console.error('Failed to load attendance:', error)
    }
    setLoading(false)
  }

  if (!user || !can(user.role, ['admin'])) {
    return <div>Access denied</div>
  }

  const formatTime = (dateString: string) => {
    return dayjs(dateString).format('HH:mm')
  }

  const calculateHours = (checkIn: string, checkOut: string) => {
    const start = dayjs(checkIn)
    const end = dayjs(checkOut)
    const hours = end.diff(start, 'minute') / 60
    return hours.toFixed(1)
  }

  const getStatusColor = (record: AttendanceRecord) => {
    if (!record.checkIn) return 'bg-red-500/20 text-red-400'
    if (!record.checkOut) return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-green-500/20 text-green-400'
  }

  const getStatusText = (record: AttendanceRecord) => {
    if (!record.checkIn) return 'Absent'
    if (!record.checkOut) return 'Checked In'
    return 'Complete'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance Management</h1>
          <p className="text-zinc-400">Monitor team attendance and working hours</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
          />
          <button
            onClick={() => setSelectedDate(dayjs().format('YYYY-MM-DD'))}
            className="px-4 py-2 border border-zinc-700 rounded hover:bg-zinc-800 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">
            {records.filter(r => r.checkIn && r.checkOut).length}
          </div>
          <div className="text-sm text-zinc-400">Complete</div>
        </div>
        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">
            {records.filter(r => r.checkIn && !r.checkOut).length}
          </div>
          <div className="text-sm text-zinc-400">Checked In</div>
        </div>
        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-400">
            {records.filter(r => !r.checkIn).length}
          </div>
          <div className="text-sm text-zinc-400">Absent</div>
        </div>
        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">
            {records.filter(r => r.mode === 'remote').length}
          </div>
          <div className="text-sm text-zinc-400">Remote</div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-900">
            <tr>
              <th className="text-left p-4">Employee</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Check In</th>
              <th className="text-left p-4">Check Out</th>
              <th className="text-left p-4">Hours</th>
              <th className="text-left p-4">Mode</th>
              <th className="text-left p-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-zinc-400">
                  Loading attendance data...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-zinc-400">
                  No attendance records for {dayjs(selectedDate).format('MMMM D, YYYY')}
                </td>
              </tr>
            ) : (
              records.map(record => (
                <tr key={record._id} className="border-t border-zinc-800">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-sm">
                        {record.userId.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{record.userId.name}</div>
                        <div className="text-sm text-zinc-400">{record.userId.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(record)}`}>
                      {getStatusText(record)}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-300">
                    {record.checkIn ? formatTime(record.checkIn) : '-'}
                  </td>
                  <td className="p-4 text-zinc-300">
                    {record.checkOut ? formatTime(record.checkOut) : '-'}
                  </td>
                  <td className="p-4 text-zinc-300">
                    {record.checkIn && record.checkOut ?
                      `${calculateHours(record.checkIn, record.checkOut)}h` : '-'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      record.mode === 'remote' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {record.mode}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-400 text-sm">
                    {record.notes || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
