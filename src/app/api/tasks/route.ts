import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Task from '@/models/Task'
import Project from '@/models/Project'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const status = searchParams.get('status')
  const assigneeId = searchParams.get('assignee')

  let query: any = {}

  // Project filter
  if (projectId) {
    query.projectId = projectId

    // Check if user has access to this project
    const project = await Project.findById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const hasProjectAccess = can(u.role, ['admin']) ||
      project.owners.some((id: any) => id.toString() === u.id) ||
      project.members.some((id: any) => id.toString() === u.id)

    if (!hasProjectAccess) {
      return forbidden()
    }
  } else if (u.role === 'employee') {
    // Employees can only see their own tasks if no project specified
    query.assignee = u.id
  }

  // Status filter
  if (status) {
    query.status = status
  }

  // Assignee filter
  if (assigneeId) {
    query.assignee = assigneeId
  }

  const tasks = await Task.find(query)
    .populate('assignee', 'name email')
    .populate('reporter', 'name email')
    .populate('projectId', 'name code')
    .sort({ updatedAt: -1 })

  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const taskData = await req.json()

  // Check if user can create tasks in this project
  if (taskData.projectId) {
    const project = await Project.findById(taskData.projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const canCreateTask = can(u.role, ['admin']) ||
      project.owners.some((id: any) => id.toString() === u.id)

    if (!canCreateTask) {
      return forbidden()
    }
  } else if (!can(u.role, ['admin', 'manager'])) {
    return forbidden()
  }

  // Set reporter as current user
  taskData.reporter = u.id

  const task = await Task.create(taskData)

  const populated = await Task.findById(task.id)
    .populate('assignee', 'name email')
    .populate('reporter', 'name email')
    .populate('projectId', 'name code')

  return NextResponse.json(populated)
}
