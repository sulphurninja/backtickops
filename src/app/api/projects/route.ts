import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Project from '@/models/Project'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  let query = {}
  if (u.role === 'employee') {
    query = { $or: [{ members: u.id }, { owners: u.id }] }
  }

  const projects = await Project.find(query)
    .populate('owners', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 })

  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u || !can(u.role, ['admin', 'manager'])) return forbidden()

  const { name, code, description, members } = await req.json()

  const project = await Project.create({
    name,
    code,
    description,
    owners: [u.id],
    members: members || []
  })

  const populated = await Project.findById(project.id)
    .populate('owners', 'name email')
    .populate('members', 'name email')

  return NextResponse.json(populated)
}
