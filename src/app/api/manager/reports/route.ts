import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import Attendance from '@/models/Attendance'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'
import dayjs from 'dayjs'

// Import Task model if it exists, otherwise we'll skip task-based calculations
let Task: any = null
try {
  Task = require('@/models/Task').default
} catch (error) {
  console.log('Task model not found, skipping task-based metrics')
}

export async function GET(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin', 'manager'])) return forbidden()

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') || dayjs().format('YYYY-MM')
  const startDate = dayjs(month).startOf('month').format('YYYY-MM-DD')
  const endDate = dayjs(month).endOf('month').format('YYYY-MM-DD')

  try {
    // Get team members based on role
    let teamMembers
    if (u.role === 'admin') {
      teamMembers = await User.find({ role: { $ne: 'admin' } }, { _id: 1, name: 1, email: 1, role: 1 })
    } else {
      teamMembers = await User.find({ managerId: u.id }, { _id: 1, name: 1, email: 1, role: 1 })
    }

    if (teamMembers.length === 0) {
      return NextResponse.json({
        totalMembers: 0,
        avgAttendanceRate: 0,
        totalWorkHours: 0,
        productivityScore: 0,
        monthlyData: [],
        memberPerformance: []
      })
    }

    const teamMemberIds = teamMembers.map(member => member._id)

    // Get attendance records for the month
    const attendanceRecords = await Attendance.find({
      userId: { $in: teamMemberIds },
      date: { $gte: startDate, $lte: endDate },
      status: 'approved'
    }).populate('userId', 'name email')

    // Get tasks for productivity calculation (if Task model exists)
    let tasks = []
    if (Task) {
      try {
        tasks = await Task.find({
          assignee: { $in: teamMemberIds },
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }).populate('assignee', 'name email')
      } catch (error) {
        console.log('Error fetching tasks:', error)
        tasks = []
      }
    }

    // Calculate member performance
    const memberPerformance = await Promise.all(teamMembers.map(async (member) => {
      const memberAttendance = attendanceRecords.filter(r =>
        r.userId._id.toString() === member._id.toString()
      )

      const memberTasks = tasks.filter((t: any) =>
        t.assignee && t.assignee._id.toString() === member._id.toString()
      )

      // Calculate attendance rate
      const workingDaysInMonth = getWorkingDaysInMonth(month)
      const presentDays = memberAttendance.length
      const attendanceRate = workingDaysInMonth > 0 ? Math.round((presentDays / workingDaysInMonth) * 100) : 0

      // Calculate average hours
      const totalHours = memberAttendance.reduce((sum, record) => {
        if (record.checkIn && record.checkOut) {
          const checkIn = dayjs(record.checkIn)
          const checkOut = dayjs(record.checkOut)
          const hours = checkOut.diff(checkIn, 'minute') / 60
          return sum + Math.max(0, Math.min(hours, 12)) // Cap at 12 hours per day
        }
        return sum
      }, 0)
      const avgHours = presentDays > 0 ? totalHours / presentDays : 0

      // Calculate productivity score
      let taskCompletionRate = 50 // Default score if no tasks
      let completedTasks = 0
      let totalTasks = memberTasks.length

      if (totalTasks > 0) {
        completedTasks = memberTasks.filter((t: any) => t.status === 'done').length
        taskCompletionRate = (completedTasks / totalTasks) * 100
      }

      // Productivity = (attendance * 0.6) + (task completion * 0.3) + (avg hours/8 * 0.1) * 100
      const hoursScore = Math.min(avgHours / 8, 1.2) * 100 // Allow slight bonus for longer hours
      const productivity = Math.round(
        (attendanceRate * 0.6) + (taskCompletionRate * 0.3) + (hoursScore * 0.1)
      )

      return {
        userId: member._id.toString(),
        name: member.name,
        email: member.email,
        attendanceRate: Math.min(attendanceRate, 100),
        avgHours: Number(avgHours.toFixed(1)),
        productivity: Math.min(productivity, 100),
        presentDays,
        totalTasks,
        completedTasks,
        totalHours: Number(totalHours.toFixed(1))
      }
    }))

    // Calculate overall metrics
    const totalMembers = teamMembers.length
    const avgAttendanceRate = memberPerformance.length > 0
      ? Math.round(memberPerformance.reduce((sum, m) => sum + m.attendanceRate, 0) / memberPerformance.length)
      : 0
    const totalWorkHours = memberPerformance.reduce((sum, m) => sum + m.totalHours, 0)
    const productivityScore = memberPerformance.length > 0
      ? Math.round(memberPerformance.reduce((sum, m) => sum + m.productivity, 0) / memberPerformance.length)
      : 0

    // Generate monthly data for the last 3 months
    const monthlyData = []
    for (let i = 2; i >= 0; i--) {
      const targetMonth = dayjs().subtract(i, 'month')
      const monthStart = targetMonth.startOf('month').format('YYYY-MM-DD')
      const monthEnd = targetMonth.endOf('month').format('YYYY-MM-DD')

      const monthAttendance = await Attendance.find({
        userId: { $in: teamMemberIds },
        date: { $gte: monthStart, $lte: monthEnd },
        status: 'approved'
      })

      const monthWorkingDays = getWorkingDaysInMonth(targetMonth.format('YYYY-MM'))
      const monthAttendanceRate = monthWorkingDays > 0 && teamMembers.length > 0
        ? Math.round((monthAttendance.length / (teamMembers.length * monthWorkingDays)) * 100)
        : 0

      const monthTotalHours = monthAttendance.reduce((sum, record) => {
        if (record.checkIn && record.checkOut) {
          const checkIn = dayjs(record.checkIn)
          const checkOut = dayjs(record.checkOut)
          const hours = checkOut.diff(checkIn, 'minute') / 60
          return sum + Math.max(0, Math.min(hours, 12))
        }
        return sum
      }, 0)

      monthlyData.push({
        month: targetMonth.format('MMM'),
        attendance: Math.min(monthAttendanceRate, 100),
        hours: Math.round(monthTotalHours)
      })
    }

    return NextResponse.json({
      totalMembers,
      avgAttendanceRate,
      totalWorkHours: Math.round(totalWorkHours),
      productivityScore,
      monthlyData,
      memberPerformance
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

// Helper function to calculate working days in a month (excluding weekends)
function getWorkingDaysInMonth(monthStr: string): number {
  const startOfMonth = dayjs(monthStr).startOf('month')
  const endOfMonth = dayjs(monthStr).endOf('month')
  let workingDays = 0

  let current = startOfMonth
  while (current.isBefore(endOfMonth) || current.isSame(endOfMonth, 'day')) {
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (current.day() !== 0 && current.day() !== 6) {
      workingDays++
    }
    current = current.add(1, 'day')
  }

  return workingDays
}
