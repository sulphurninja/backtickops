import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Task from '@/models/Task'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const task = await Task.findById(params.id)
    .populate('assignee', 'name email')
    .populate('projectId', 'name code')

  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check if user has access (admin, manager, or assignee)
  const hasAccess = can(u.role, ['admin', 'manager']) ||
    task.assignee?._id.toString() === u.id

  if (!hasAccess) return forbidden()

  return NextResponse.json(task)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const task = await Task.findById(params.id)
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Allow user to update their own tasks or if they're admin/manager
  const canUpdate = can(u.role, ['admin', 'manager']) || task.assignee?.toString() === u.id
  if (!canUpdate) return forbidden()

  const updates = await req.json()
  const updated = await Task.findByIdAndUpdate(params.id, updates, { new: true })
    .populate('assignee', 'name email')
    .populate('projectId', 'name code')

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin', 'manager'])) return forbidden()

  await Task.findByIdAndDelete(params.id)
  return NextResponse.json({ success: true })
}
