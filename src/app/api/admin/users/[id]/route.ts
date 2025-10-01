import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin'])) return forbidden()

  const { name, email, role } = await req.json()
  const user = await User.findByIdAndUpdate(
    params.id,
    { name, email, role },
    { new: true, select: '-passwordHash' }
  )

  return NextResponse.json(user)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin'])) return forbidden()

  await User.findByIdAndDelete(params.id)
  return NextResponse.json({ success: true })
}
