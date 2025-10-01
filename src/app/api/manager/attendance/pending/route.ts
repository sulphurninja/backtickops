import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Attendance from '@/models/Attendance'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin', 'manager'])) return forbidden()

  const pendingRecords = await Attendance.find({ status: 'pending' })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })

  return NextResponse.json(pendingRecords)
}
