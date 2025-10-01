// ========== app/api/auth/login/route.ts ==========
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import { signAccess } from '@/lib/auth'
export async function POST(req: NextRequest){
const { email, password } = await req.json()
await dbConnect()
const user = await User.findOne({ email })
if(!user) return NextResponse.json({ error: 'invalid' }, { status: 401 })
const ok = await bcrypt.compare(password, user.passwordHash)
if(!ok) return NextResponse.json({ error: 'invalid' }, { status: 401 })
const token = signAccess({ id:user.id, role:user.role, name:user.name })
return NextResponse.json({ token, user:{ id:user.id, name:user.name, role:user.role } })
}
