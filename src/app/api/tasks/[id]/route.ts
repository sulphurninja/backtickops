import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Task from '@/models/Task'
import Project from '@/models/Project'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const task = await Task.findById(params.id)
    .populate('assignee', 'name email')
    .populate('reporter', 'name email')
    .populate('projectId', 'name code')

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  // Check if user has access to view this task
  const project = await Project.findById(task.projectId)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const hasAccess = can(u.role, ['admin']) ||
    project.owners.some((id: any) => id.toString() === u.id) ||
    project.members.some((id: any) => id.toString() === u.id) ||
    task.assignee?._id.toString() === u.id

  if (!hasAccess) return forbidden()

  return NextResponse.json(task)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const task = await Task.findById(params.id).populate('projectId')
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const updates = await req.json()

  // Determine what can be updated based on user role and relationship to task
  const isAssignee = task.assignee?.toString() === u.id
  const isAdmin = can(u.role, ['admin'])
  const isProjectOwner = task.projectId &&
    task.projectId.owners?.some((id: any) => id.toString() === u.id)

  let allowedUpdates: string[] = []

  if (isAssignee) {
    // Assignees can update status, add comments, log work, update progress
    allowedUpdates = [
      'status',
      'actualHours',
      'comments',
      'workLogs',
      'subtasks',
      'description' // Allow assignees to update description
    ]
  }

  if (isAdmin || isProjectOwner) {
    // Admins and project owners can update everything
    allowedUpdates = Object.keys(updates)
  }

  // Filter updates to only allowed fields
  const filteredUpdates: any = {}
  for (const key of allowedUpdates) {
    if (key in updates) {
      filteredUpdates[key] = updates[key]
    }
  }

  // Add automatic timestamps
  if ('status' in filteredUpdates) {
    if (filteredUpdates.status === 'in-progress' && task.status !== 'in-progress') {
      filteredUpdates.startDate = new Date()
    } else if (filteredUpdates.status === 'done' && task.status !== 'done') {
      filteredUpdates.completedDate = new Date()
    }
  }

  if (Object.keys(filteredUpdates).length === 0) {
    return forbidden()
  }

  const updated = await Task.findByIdAndUpdate(params.id, filteredUpdates, { new: true })
    .populate('assignee', 'name email')
    .populate('reporter', 'name email')
    .populate('projectId', 'name code')

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const task = await Task.findById(params.id).populate('projectId')
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  // Only admins and project owners can delete tasks
  const canDelete = can(u.role, ['admin']) ||
    (task.projectId && task.projectId.owners?.some((id: any) => id.toString() === u.id))

  if (!canDelete) return forbidden()

  await Task.findByIdAndDelete(params.id)
  return NextResponse.json({ success: true })
}
