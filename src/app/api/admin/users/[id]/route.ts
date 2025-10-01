import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin'])) return forbidden()

  const { name, email, role, managerId } = await req.json()

  const updateData: any = { name, email, role }
  if (role === 'employee' && managerId) {
    updateData.managerId = managerId
  } else {
    updateData.$unset = { managerId: 1 }
  }

  const user = await User.findByIdAndUpdate(params.id, updateData, { new: true })
    .populate('managerId', 'name email')
    .select('-passwordHash')

  return NextResponse.json(user)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin'])) return forbidden()

  await User.findByIdAndDelete(params.id)
  return NextResponse.json({ success: true })
}
