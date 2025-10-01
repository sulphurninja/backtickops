import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import Attendance from '@/models/Attendance'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'
import dayjs from 'dayjs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin', 'manager'])) return forbidden()

  try {
    // Get the team member
    const member = await User.findById(params.id)
      .populate('managerId', 'name email')
      .select('-passwordHash')

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Check if user has permission to view this member
    if (u.role === 'manager' && member.managerId?._id?.toString() !== u.id) {
      return forbidden()
    }

    // Get attendance records for the current month
    const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD')
    const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD')

    const attendanceRecords = await Attendance.find({
      userId: params.id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ date: -1 })

    // Calculate working days passed in current month
    const today = dayjs()
    const startOfMonthDate = dayjs().startOf('month')
    let workingDaysPassedInMonth = 0
    let current = startOfMonthDate

    while (current.isBefore(today) || current.isSame(today, 'day')) {
      if (current.day() !== 0 && current.day() !== 6) { // Not weekend
        workingDaysPassedInMonth++
      }
      current = current.add(1, 'day')
    }

    // Calculate stats
    const approvedRecords = attendanceRecords.filter(r => r.status === 'approved')
    const presentDays = approvedRecords.length
    const attendanceRate = workingDaysPassedInMonth > 0
      ? Math.round((presentDays / workingDaysPassedInMonth) * 100)
      : 0

    const totalHours = approvedRecords.reduce((sum, record) => {
      if (record.checkIn && record.checkOut) {
        const checkIn = dayjs(record.checkIn)
        const checkOut = dayjs(record.checkOut)
        const hours = checkOut.diff(checkIn, 'minute') / 60
        return sum + Math.max(0, Math.min(hours, 12)) // Cap at 12 hours per day
      }
      return sum
    }, 0)

    const avgHours = presentDays > 0 ? totalHours / presentDays : 0

    // Count late arrivals (after 9:15 AM)
    const lateArrivals = approvedRecords.filter(record => {
      if (!record.checkIn) return false
      const checkInTime = dayjs(record.checkIn)
      const lateThreshold = checkInTime.startOf('day').add(9, 'hour').add(15, 'minute')
      return checkInTime.isAfter(lateThreshold)
    }).length

    // Calculate productivity score (simplified)
    const productivity = Math.min(100, Math.round(
      (attendanceRate * 0.7) +
      (Math.min(avgHours / 8, 1) * 100 * 0.2) +
      (Math.max(0, (presentDays - lateArrivals) / Math.max(presentDays, 1)) * 100 * 0.1)
    ))

    // Get recent attendance (last 10 records)
    const recentAttendance = await Attendance.find({
      userId: params.id,
      date: { $gte: dayjs().subtract(30, 'day').format('YYYY-MM-DD') }
    })
      .sort({ date: -1 })
      .limit(10)

    const recentAttendanceFormatted = []

    // Generate last 10 days including weekends for complete view
    for (let i = 9; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day')
      const dateStr = date.format('YYYY-MM-DD')
      const record = recentAttendance.find(r => r.date === dateStr)

      if (record) {
        let hours = 0
        if (record.checkIn && record.checkOut) {
          const checkIn = dayjs(record.checkIn)
          const checkOut = dayjs(record.checkOut)
          hours = checkOut.diff(checkIn, 'minute') / 60
        }

        recentAttendanceFormatted.push({
          date: record.date,
          checkIn: record.checkIn ? dayjs(record.checkIn).format('HH:mm:ss') : undefined,
          checkOut: record.checkOut ? dayjs(record.checkOut).format('HH:mm:ss') : undefined,
          status: record.status,
          hours: hours > 0 ? Number(hours.toFixed(2)) : 0,
          mode: record.mode,
          distance: record.distance,
          location: record.location
        })
      } else {
        // No record for this day
        const isWeekend = date.day() === 0 || date.day() === 6
        recentAttendanceFormatted.push({
          date: dateStr,
          status: isWeekend ? 'weekend' : 'absent',
          hours: 0
        })
      }
    }

    const response = {
      member: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        createdAt: member.createdAt,
        managerId: member.managerId
      },
      stats: {
        attendanceRate: Math.min(attendanceRate, 100),
        avgHours: Number(avgHours.toFixed(1)),
        totalDays: workingDaysPassedInMonth,
        presentDays,
        lateArrivals,
        productivity: Math.min(productivity, 100),
        totalHours: Number(totalHours.toFixed(1))
      },
      recentAttendance: recentAttendanceFormatted.reverse() // Most recent first
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error getting member details:', error)
    return NextResponse.json({ error: 'Failed to get member details' }, { status: 500 })
  }
}
