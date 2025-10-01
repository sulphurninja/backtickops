import { NextRequest, NextResponse } from 'next/server'
import dayjs from 'dayjs'
import { dbConnect } from '@/lib/db'
import Attendance from '@/models/Attendance'
import { getUserFromAuth, forbidden } from '@/lib/utils'

export async function POST(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const { latitude, longitude, distance } = await req.json()
  const date = dayjs().format('YYYY-MM-DD')

  // Check if already checked in today
  const existing = await Attendance.findOne({ userId: u.id, date })
  if (existing?.checkIn) {
    return NextResponse.json({ error: 'Already checked in today' }, { status: 400 })
  }

  await Attendance.findOneAndUpdate(
    { userId: u.id, date },
    {
      $set: {
        checkIn: new Date(),
        location: { latitude, longitude },
        distance,
        status: u.role === 'employee' ? 'pending' : 'approved'
      }
    },
    { upsert: true }
  )

  return NextResponse.json({ ok: true, status: u.role === 'employee' ? 'pending' : 'approved' })
}
