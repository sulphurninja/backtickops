// ========== app/api/timebox/[date]/route.ts ==========
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Timebox from '@/models/Timebox'
import { getUserFromAuth, forbidden } from '@/lib/utils'
export async function GET(req: NextRequest, { params }: { params: { date: string } }){
await dbConnect(); const u = getUserFromAuth(req); if(!u) return forbidden()
const doc = await Timebox.findOneAndUpdate(
{ userId: u.id, date: params.date },
{ $setOnInsert: { top3: ['', '', ''], brainDump: [], blocks: [], productivityScore: 0 } },
{ upsert: true, new: true }
)
return NextResponse.json(doc)
}
export async function PUT(req: NextRequest, { params }: { params: { date: string } }){
await dbConnect(); const u = getUserFromAuth(req); if(!u) return forbidden()
const body = await req.json()
const doc = await Timebox.findOneAndUpdate(
{ userId: u.id, date: params.date },
{ $set: body },
{ new: true }
)
return NextResponse.json(doc)
}
