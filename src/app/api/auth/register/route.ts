// ========== app/api/auth/register/route.ts ==========
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import { signAccess } from '@/lib/auth'
export async function POST(req: NextRequest){
const { name, email, password, role } = await req.json()
await dbConnect()
if (await User.findOne({ email })) return NextResponse.json({ error: 'exists' }, { status: 409 })
const passwordHash = await bcrypt.hash(password, 12)
const user = await User.create({ name, email, passwordHash, role: role || 'admin' })
const token = signAccess({ id: user.id, role: user.role, name: user.name })
return NextResponse.json({ token, user: { id:user.id, name:user.name, role:user.role } })
}
