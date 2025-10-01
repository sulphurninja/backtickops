import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Project from '@/models/Project'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'
import dayjs from 'dayjs'

// Create a simple standup collection (you might want to create a separate Standup model)
import { Schema, models, model } from 'mongoose'

const StandupSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD format
  yesterday: String,
  today: String,
  blockers: String
}, { timestamps: true })

StandupSchema.index({ projectId: 1, userId: 1, date: 1 }, { unique: true })

const Standup = models.Standup || model('Standup', StandupSchema)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || dayjs().format('YYYY-MM-DD')

  try {
    const project = await Project.findById(params.id)
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Check access
    const hasAccess = can(u.role, ['admin']) ||
      project.owners.some((id: any) => id.toString() === u.id) ||
      project.members.some((id: any) => id.toString() === u.id)

    if (!hasAccess) return forbidden()

    const entries = await Standup.find({ projectId: params.id, date })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 })

    const formattedEntries = entries.map(entry => ({
      userId: entry.userId._id.toString(),
      user: { name: entry.userId.name, email: entry.userId.email },
      yesterday: entry.yesterday,
      today: entry.today,
      blockers: entry.blockers,
      createdAt: entry.createdAt
    }))

    return NextResponse.json({ date, entries: formattedEntries })

  } catch (error) {
    console.error('Error fetching standup:', error)
    return NextResponse.json({ error: 'Failed to fetch standup' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  try {
    const project = await Project.findById(params.id)
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Check access
    const hasAccess = can(u.role, ['admin']) ||
      project.owners.some((id: any) => id.toString() === u.id) ||
      project.members.some((id: any) => id.toString() === u.id)

    if (!hasAccess) return forbidden()

    const { yesterday, today, blockers } = await req.json()
    const date = dayjs().format('YYYY-MM-DD')

    // Upsert standup entry
    const entry = await Standup.findOneAndUpdate(
      { projectId: params.id, userId: u.id, date },
      { yesterday, today, blockers },
      { upsert: true, new: true }
    ).populate('userId', 'name email')

    return NextResponse.json({
      userId: entry.userId._id.toString(),
      user: { name: entry.userId.name, email: entry.userId.email },
      yesterday: entry.yesterday,
      today: entry.today,
      blockers: entry.blockers,
      createdAt: entry.createdAt
    })

  } catch (error) {
    console.error('Error submitting standup:', error)
    return NextResponse.json({ error: 'Failed to submit standup' }, { status: 500 })
  }
}
