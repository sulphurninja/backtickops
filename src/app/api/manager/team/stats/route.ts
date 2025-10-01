import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import Attendance from '@/models/Attendance'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'
import dayjs from 'dayjs'

export async function GET(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin', 'manager'])) return forbidden()

  try {
    // Get team members
    let teamMembers
    if (u.role === 'admin') {
      teamMembers = await User.find({ role: { $ne: 'admin' } }, { _id: 1, name: 1 })
    } else {
      teamMembers = await User.find({ managerId: u.id }, { _id: 1, name: 1 })
    }

    const teamMemberIds = teamMembers.map(member => member._id)

    // Get attendance for current month
    const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD')
    const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD')

    const attendanceRecords = await Attendance.find({
      userId: { $in: teamMemberIds },
      date: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'approved'
    })

    // Calculate working days passed in current month
    const today = dayjs()
    const startOfMonthDate = dayjs().startOf('month')
    let workingDaysPassedInMonth = 0
    let current = startOfMonthDate

    while (current.isBefore(today, 'day') || current.isSame(today, 'day')) {
      if (current.day() !== 0 && current.day() !== 6) { // Not weekend
        workingDaysPassedInMonth++
      }
      current = current.add(1, 'day')
    }

    // Calculate stats for each member
    const stats = teamMembers.map(member => {
      const memberAttendance = attendanceRecords.filter(r =>
        r.userId.toString() === member._id.toString()
      )

      const totalHours = memberAttendance.reduce((sum, record) => {
        if (record.checkIn && record.checkOut) {
          const checkIn = dayjs(record.checkIn)
          const checkOut = dayjs(record.checkOut)
          const hours = checkOut.diff(checkIn, 'minute') / 60
          return sum + Math.max(0, Math.min(hours, 12)) // Cap at 12 hours per day
        }
        return sum
      }, 0)

      const presentDays = memberAttendance.length
      const avgHours = presentDays > 0 ? totalHours / presentDays : 0
      const attendanceRate = workingDaysPassedInMonth > 0
        ? Math.round((presentDays / workingDaysPassedInMonth) * 100)
        : 0

      const lastAttendance = memberAttendance
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

      return {
        userId: member._id.toString(),
        name: member.name,
        presentDays,
        totalDays: workingDaysPassedInMonth,
        avgHours: Number(avgHours.toFixed(1)),
        attendanceRate: Math.min(attendanceRate, 100),
        lastCheckIn: lastAttendance?.checkIn || null,
        totalHours: Number(totalHours.toFixed(1))
      }
    })

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error getting team stats:', error)
    return NextResponse.json({ error: 'Failed to get team stats' }, { status: 500 })
  }
}
