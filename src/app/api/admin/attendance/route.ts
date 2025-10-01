import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Attendance from '@/models/Attendance'
import User from '@/models/User'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin'])) return forbidden()

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  // Get all users and their attendance for the specified date
  const users = await User.find({}, { name: 1, email: 1 })
  const attendanceRecords = await Attendance.find({ date })
    .populate('userId', 'name email')

  // Create a map of attendance by userId
  const attendanceMap = new Map()
  attendanceRecords.forEach(record => {
    attendanceMap.set(record.userId._id.toString(), record)
  })

  // Build complete records including users with no attendance
  const completeRecords = users.map(user => {
    const attendance = attendanceMap.get(user._id.toString())
    return attendance || {
      _id: `missing-${user._id}`,
      userId: { _id: user._id, name: user.name, email: user.email },
      date,
      mode: 'office'
    }
  })

  return NextResponse.json(completeRecords)
}
