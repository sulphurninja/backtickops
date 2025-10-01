import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Project from '@/models/Project'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const project = await Project.findById(params.id)
    .populate('owners', 'name email')
    .populate('members', 'name email')

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check if user has access
  const hasAccess = can(u.role, ['admin']) ||
    project.owners.some((owner: any) => owner._id.toString() === u.id) ||
    project.members.some((member: any) => member._id.toString() === u.id)

  // if (!hasAccess) return forbidden()

  return NextResponse.json(project)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const project = await Project.findById(params.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = project.owners.some((id: any) => id.toString() === u.id)
  if (!can(u.role, ['admin']) && !isOwner) return forbidden()

  const updates = await req.json()
  const updated = await Project.findByIdAndUpdate(params.id, updates, { new: true })
    .populate('owners', 'name email')
    .populate('members', 'name email')

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin'])) return forbidden()

  await Project.findByIdAndDelete(params.id)
  return NextResponse.json({ success: true })
}
