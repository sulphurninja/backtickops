import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Project from '@/models/Project'
import Task from '@/models/Task'
import User from '@/models/User'
import { getUserFromAuth, forbidden } from '@/lib/utils'
import { can } from '@/lib/rbac'
import dayjs from 'dayjs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const u = getUserFromAuth(req)
  if (!u) return forbidden()

  const { searchParams } = new URL(req.url)
  const range = searchParams.get('range') || 'month'

  try {
    const project = await Project.findById(params.id)
      .populate('owners members', 'name email')

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check access
    const hasAccess = can(u.role, ['admin']) ||
      project.owners.some((owner: any) => owner._id.toString() === u.id) ||
      project.members.some((member: any) => member._id.toString() === u.id)

    if (!hasAccess) return forbidden()

    // Calculate date range
    const endDate = dayjs()
    const startDate = range === 'week' ? endDate.subtract(1, 'week') :
      range === 'quarter' ? endDate.subtract(3, 'month') :
        endDate.subtract(1, 'month')

    // Get tasks for the project
    const tasks = await Task.find({
      projectId: params.id,
      createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    }).populate('assignee', 'name email')

    // Calculate overview metrics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'done').length
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
    const overdueTasks = tasks.filter(t =>
      t.dueDate && dayjs(t.dueDate).isBefore(dayjs(), 'day') && t.status !== 'done'
    ).length

    // Calculate team velocity (story points completed per sprint)
    const completedStoryPoints = tasks
      .filter(t => t.status === 'done')
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0)

    const currentSprint = project.sprints?.find((s: any) => s.status === 'active')
    const teamVelocity = currentSprint ? completedStoryPoints : 0

    // Generate burndown data (simplified)
    const burndownData = []
    const sprintDays = currentSprint ? dayjs(currentSprint.endDate).diff(currentSprint.startDate, 'day') : 14
    const totalPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)

    for (let i = 0; i <= sprintDays; i++) {
      const date = currentSprint ? dayjs(currentSprint.startDate).add(i, 'day') : dayjs().subtract(sprintDays - i, 'day')
      const remainingIdeal = Math.max(0, totalPoints - (totalPoints / sprintDays) * i)
      const remainingActual = totalPoints - completedStoryPoints * (i / sprintDays)

      burndownData.push({
        date: date.format('YYYY-MM-DD'),
        remaining: Math.max(0, remainingActual),
        ideal: remainingIdeal
      })
    }

    // Calculate team performance
    const teamMembers = [...project.owners, ...project.members]
    const teamPerformance = await Promise.all(
      teamMembers.map(async (member: any) => {
        const memberTasks = tasks.filter(t => t.assignee?._id.toString() === member._id.toString())
        const completedMemberTasks = memberTasks.filter(t => t.status === 'done')

        // Calculate average completion time
        const completionTimes = completedMemberTasks
          .filter(t => t.startDate && t.completedDate)
          .map(t => dayjs(t.completedDate).diff(t.startDate, 'day'))

        const averageCompletionTime = completionTimes.length > 0
          ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
          : 0

        return {
          userId: member._id.toString(),
          name: member.name,
          tasksCompleted: completedMemberTasks.length,
          tasksInProgress: memberTasks.filter(t => t.status === 'in-progress').length,
          averageCompletionTime,
          storyPointsCompleted: completedMemberTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)
        }
      })
    )

    // Sprint progress
    const sprintProgress: any = {}
    if (currentSprint) {
      const sprintTasks = tasks.filter(t => currentSprint.tasks?.includes(t._id.toString()))
      const sprintCompleted = sprintTasks.filter(t => t.status === 'done').length
      const sprintProgress_calculated = sprintTasks.length > 0 ? (sprintCompleted / sprintTasks.length) * 100 : 0

      // Calculate velocity trend (simplified)
      const previousSprint = project.sprints?.find((s: any) => s.status === 'completed')
      let velocityTrend: 'up' | 'down' | 'stable' = 'stable'

      if (previousSprint && previousSprint.velocity) {
        if (teamVelocity > previousSprint.velocity * 1.1) velocityTrend = 'up'
        else if (teamVelocity < previousSprint.velocity * 0.9) velocityTrend = 'down'
      }

      sprintProgress.currentSprint = {
        name: currentSprint.name,
        progress: sprintProgress_calculated,
        daysRemaining: Math.max(0, dayjs(currentSprint.endDate).diff(dayjs(), 'day')),
        velocityTrend
      }
    }

    // Time metrics
    const completedTasksWithTimes = tasks.filter(t =>
      t.status === 'done' && t.startDate && t.completedDate
    )

    const averageTaskDuration = completedTasksWithTimes.length > 0
      ? completedTasksWithTimes.reduce((sum, task) =>
        sum + dayjs(task.completedDate).diff(task.startDate, 'day'), 0
      ) / completedTasksWithTimes.length
      : 0

    // Simulate blocker resolution and code review times (you can implement actual tracking)
    const blockerResolutionTime = averageTaskDuration * 0.3 // Estimate 30% of task time for blockers
    const codeReviewTime = 4.5 // Average hours for code review

    const timeMetrics = {
      averageTaskDuration,
      blockerResolutionTime,
      codeReviewTime
    }

    // Risk assessment
    const riskFactors = []
    const recommendations = []
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    // Assess various risk factors
    if (overdueTasks > totalTasks * 0.2) {
      riskFactors.push(`High overdue task ratio (${Math.round((overdueTasks / totalTasks) * 100)}%)`)
      recommendations.push('Review and reprioritize overdue tasks')
      riskLevel = 'high'
    }

    if (averageTaskDuration > 7) {
      riskFactors.push('Tasks taking longer than expected to complete')
      recommendations.push('Break down large tasks into smaller, manageable pieces')
      if (riskLevel === 'low') riskLevel = 'medium'
    }

    if (currentSprint && dayjs().isAfter(dayjs(currentSprint.endDate).subtract(2, 'day'))) {
      const sprintTasks = tasks.filter(t => currentSprint.tasks?.includes(t._id.toString()))
      const sprintCompleted = sprintTasks.filter(t => t.status === 'done').length
      const completionRate = sprintTasks.length > 0 ? sprintCompleted / sprintTasks.length : 0

      if (completionRate < 0.8) {
        riskFactors.push('Sprint unlikely to complete on time')
        recommendations.push('Consider moving incomplete items to next sprint')
        if (riskLevel !== 'high') riskLevel = 'medium'
      }
    }

    const teamWorkload = teamPerformance.reduce((sum, member) => sum + member.tasksInProgress, 0)
    if (teamWorkload > teamMembers.length * 3) {
      riskFactors.push('Team may be overloaded with too many concurrent tasks')
      recommendations.push('Implement WIP limits and focus on task completion')
      if (riskLevel === 'low') riskLevel = 'medium'
    }

    // Add positive factors if no risks found
    if (riskFactors.length === 0) {
      riskFactors.push('No significant risk factors identified')
      recommendations.push('Continue current practices and monitor regularly')
    }

    const riskAssessment = {
      level: riskLevel,
      factors: riskFactors,
      recommendations
    }

    // Compile analytics data
    const analyticsData = {
      overview: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        teamVelocity,
        burndownData: burndownData.slice(-14) // Last 14 days
      },
      teamPerformance: teamPerformance.sort((a, b) => b.tasksCompleted - a.tasksCompleted),
      sprintProgress,
      timeMetrics,
      riskAssessment
    }

    return NextResponse.json(analyticsData)

  } catch (error) {
    console.error('Error generating analytics:', error)
    return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 })
  }
}
