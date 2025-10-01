import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Task from '@/models/Task'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  let query: any = {}
  if (u.role === 'employee') {
    query.assignee = u.id
  }
  if (projectId) {
    query.projectId = projectId
  }

  const tasks = await Task.find(query)
    .populate('assignee', 'name email')
    .populate('projectId', 'name code')
    .sort({ createdAt: -1 })

  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin', 'manager'])) return forbidden()

  const taskData = await req.json()
  const task = await Task.create(taskData)

  const populated = await Task.findById(task.id)
    .populate('assignee', 'name email')
    .populate('projectId', 'name code')

  return NextResponse.json(populated)
}
