import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Attendance from '@/models/Attendance'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin', 'manager'])) return forbidden()

  const { action } = await req.json()

  const updateData = {
    status: action === 'approve' ? 'approved' : 'rejected',
    approvedBy: u.id,
    approvedAt: new Date()
  }

  const updated = await Attendance.findByIdAndUpdate(params.id, updateData, { new: true })
    .populate('userId', 'name email')

  return NextResponse.json(updated)
}
