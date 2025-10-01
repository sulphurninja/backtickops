import { NextRequest, NextResponse } from 'next/server'
import dayjs from 'dayjs'
import { dbConnect } from '@/lib/db'
import Attendance from '@/models/Attendance'
import { getUserFromAuth, forbidden } from '@/lib/utils'

export async function POST(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const date = dayjs().format('YYYY-MM-DD')

  // Check if checked in today
  const existing = await Attendance.findOne({ userId: u.id, date })
  if (!existing?.checkIn) {
    return NextResponse.json({ error: 'Must check in first' }, { status: 400 })
  }

  if (existing.checkOut) {
    return NextResponse.json({ error: 'Already checked out today' }, { status: 400 })
  }

  await Attendance.findOneAndUpdate(
    { userId: u.id, date },
    {
      $set: {
        checkOut: new Date(),
        status: u.role === 'employee' ? 'pending' : 'approved'
      }
    }
  )

  return NextResponse.json({ ok: true })
}
