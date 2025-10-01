import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin', 'manager'])) return forbidden()

  let teamMembers
  if (u.role === 'admin') {
    // Admin sees all users
    teamMembers = await User.find({}, { passwordHash: 0 })
      .populate('managerId', 'name email')
      .sort({ name: 1 })
  } else {
    // Manager sees only their team
    teamMembers = await User.find({ managerId: u.id }, { passwordHash: 0 })
      .sort({ name: 1 })
  }

  return NextResponse.json(teamMembers)
}
