import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin', 'manager'])) return forbidden()

  const users = await User.find({}, { passwordHash: 0 })
    .populate('managerId', 'name email')
    .sort({ createdAt: -1 })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin'])) return forbidden()

  const { name, email, password, role, managerId } = await req.json()

  if (await User.findOne({ email })) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const userData: any = { name, email, passwordHash, role }

  if (managerId && role === 'employee') {
    userData.managerId = managerId
  }

  const user = await User.create(userData)
  const populatedUser = await User.findById(user._id)
    .populate('managerId', 'name email')
    .select('-passwordHash')

  return NextResponse.json(populatedUser)
}
