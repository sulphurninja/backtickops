import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Attendance from '@/models/Attendance'
import User from '@/models/User'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin', 'manager'])) return forbidden()

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  let teamMembers
  if (u.role === 'admin') {
    teamMembers = await User.find({}, { name: 1, email: 1, role: 1 })
  } else {
    teamMembers = await User.find({ managerId: u.id }, { name: 1, email: 1, role: 1 })
  }

  const teamMemberIds = teamMembers.map(member => member._id)
  const attendanceRecords = await Attendance.find({
    date,
    userId: { $in: teamMemberIds }
  }).populate('userId', 'name email')

  // Create attendance map
  const attendanceMap = new Map()
  attendanceRecords.forEach(record => {
    attendanceMap.set(record.userId._id.toString(), record)
  })

  // Build complete records
  const completeRecords = teamMembers.map(member => {
    const attendance = attendanceMap.get(member._id.toString())
    return attendance || {
      _id: `missing-${member._id}`,
      userId: { _id: member._id, name: member.name, email: member.email },
      date,
      mode: 'office'
    }
  })

  return NextResponse.json(completeRecords)
}
