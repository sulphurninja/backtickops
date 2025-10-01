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

  let query: any = { status: 'pending' }

  if (u.role === 'manager') {
    // Get team member IDs
    const teamMembers = await User.find({ managerId: u.id }, { _id: 1 })
    const teamMemberIds = teamMembers.map(member => member._id)
    query.userId = { $in: teamMemberIds }
  }

  const pendingRecords = await Attendance.find(query)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })

  return NextResponse.json(pendingRecords)
}
