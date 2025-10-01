import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Project from '@/models/Project'
import Task from '@/models/Task'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const project = await Project.findById(params.id)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Check access
  const hasAccess = can(u.role, ['admin']) ||
    project.owners.some((id: any) => id.toString() === u.id) ||
    project.members.some((id: any) => id.toString() === u.id)

  if (!hasAccess) return forbidden()

  return NextResponse.json(project.sprints || [])
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const project = await Project.findById(params.id)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Only admins and project owners can create sprints
  const canCreate = can(u.role, ['admin']) ||
    project.owners.some((id: any) => id.toString() === u.id)

  if (!canCreate) return forbidden()

  const sprintData = await req.json()
  const newSprint = {
    _id: new Date().getTime().toString(), // Simple ID generation
    name: sprintData.name,
    startDate: sprintData.startDate,
    endDate: sprintData.endDate,
    goal: sprintData.goal,
    status: 'planning',
    tasks: [],
    velocity: 0
  }

  project.sprints = project.sprints || []
  project.sprints.push(newSprint)
  await project.save()

  return NextResponse.json(newSprint)
}
