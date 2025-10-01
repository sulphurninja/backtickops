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

  const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin'])) return forbidden()

  const { name, email, password, role } = await req.json()

  if (await User.findOne({ email })) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ name, email, passwordHash, role })

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  })
}
