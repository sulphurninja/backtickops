'use client'
import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/rbac'
import { Plus, MoreVertical, Clock, User, Calendar, Flag } from 'lucide-react'
import dayjs from 'dayjs'

interface Task {
  _id: string
  title: string
  description?: string
  assignee?: { _id: string; name: string; email: string }
  reporter: { _id: string; name: string }
  status: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  storyPoints?: number
  dueDate?: string
  tags: string[]
}

interface Column {
  id: string
  title: string
  order: number
  wipLimit?: number
  color: string
}

interface KanbanBoardProps {
  projectId: string
  tasks: Task[]
  columns: Column[]
  onTaskUpdate: (taskId: string, updates: any) => Promise<void>
  onColumnUpdate?: (columns: Column[]) => Promise<void>
  canEditColumns?: boolean
}

export default function KanbanBoard({
  projectId,
  tasks,
  columns: initialColumns,
  onTaskUpdate,
  onColumnUpdate,
  canEditColumns = false
}: KanbanBoardProps) {
  const { user } = useAuth()
  const [columns, setColumns] = useState(initialColumns)
  const [editingColumn, setEditingColumn] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState<string | null>(null)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const canMoveTask = (task: Task) => {
    // Users can only move tasks assigned to them
    // Admins and managers can move any task
    return can(user?.role || '', ['admin', 'manager']) ||
           task.assignee?._id === user?.id
  }

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination ||
        (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return
    }

    const task = tasks.find(t => t._id === draggableId)
    if (!task || !canMoveTask(task)) {
      return
    }

    // Check WIP limits
    const targetColumn = columns.find(col => col.id === destination.droppableId)
    const tasksInTargetColumn = tasks.filter(t => t.status === destination.droppableId)

    if (targetColumn?.wipLimit && tasksInTargetColumn.length >= targetColumn.wipLimit) {
      alert(`WIP limit reached for ${targetColumn.title} (${targetColumn.wipLimit})`)
      return
    }

    try {
      await onTaskUpdate(draggableId, {
        status: destination.droppableId,
        ...(destination.droppableId === 'done' && { completedDate: new Date() })
      })
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const updateColumnTitle = async (columnId: string, newTitle: string) => {
    if (!canEditColumns) return

    const updatedColumns = columns.map(col =>
      col.id === columnId ? { ...col, title: newTitle } : col
    )
    setColumns(updatedColumns)

    if (onColumnUpdate) {
      try {
        await onColumnUpdate(updatedColumns)
      } catch (error) {
        console.error('Failed to update column:', error)
        setColumns(columns) // Revert on error
      }
    }
    setEditingColumn(null)
  }

  return (
    <div className="h-full overflow-x-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 p-6 min-w-max">
          {columns.sort((a, b) => a.order - b.order).map(column => {
            const columnTasks = tasks.filter(task => task.status === column.id)
            const isOverLimit = column.wipLimit && columnTasks.length > column.wipLimit

            return (
              <div key={column.id} className="flex-shrink-0 w-80">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  {editingColumn === column.id ? (
                    <input
                      type="text"
                      defaultValue={column.title}
                      className="text-lg font-semibold bg-transparent border-b-2 border-blue-500 focus:outline-none"
                      onBlur={(e) => updateColumnTitle(column.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateColumnTitle(column.id, e.currentTarget.value)
                        } else if (e.key === 'Escape') {
                          setEditingColumn(null)
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <h3
                      className={`text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2 ${
                        canEditColumns ? 'cursor-pointer hover:text-blue-500' : ''
                      }`}
                      onClick={() => canEditColumns && setEditingColumn(column.id)}
                      style={{ borderLeft: `4px solid ${column.color}` }}
                    >
                      <span className="pl-3">{column.title}</span>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        isOverLimit ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {columnTasks.length}
                        {column.wipLimit && ` / ${column.wipLimit}`}
                      </span>
                    </h3>
                  )}

                  {can(user?.role || '', ['admin', 'manager']) && (
                    <button
                      onClick={() => setShowNewTask(column.id)}
                      className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>

                {/* Column Content */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`min-h-[200px] rounded-lg p-3 transition-colors ${
                        snapshot.isDraggingOver
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700'
                          : 'bg-zinc-50 dark:bg-zinc-900/50 border-2 border-transparent'
                      }`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable
                          key={task._id}
                          draggableId={task._id}
                          index={index}
                          isDragDisabled={!canMoveTask(task)}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white dark:bg-zinc-800 rounded-lg p-4 mb-3 shadow-sm border transition-all ${
                                snapshot.isDragging
                                  ? 'rotate-2 shadow-lg border-blue-200 dark:border-blue-700'
                                  : 'border-zinc-200 dark:border-zinc-700 hover:shadow-md'
                              } ${
                                canMoveTask(task)
                                  ? 'cursor-grab active:cursor-grabbing'
                                  : 'opacity-75 cursor-not-allowed'
                              }`}
                            >
                              {/* Task Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                  {task.storyPoints && (
                                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                                      {task.storyPoints} SP
                                    </span>
                                  )}
                                </div>
                                <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                                  <MoreVertical size={16} />
                                </button>
                              </div>

                              {/* Task Title */}
                              <h4 className="font-medium text-zinc-900 dark:text-white mb-2 line-clamp-2">
                                {task.title}
                              </h4>

                              {/* Task Description */}
                              {task.description && (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              {/* Task Tags */}
                              {task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {task.tags.slice(0, 3).map(tag => (
                                    <span
                                      key={tag}
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {task.tags.length > 3 && (
                                    <span className="px-2 py-1 text-xs bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 rounded">
                                      +{task.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Task Footer */}
                              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                <div className="flex items-center gap-3">
                                  {task.assignee && (
                                    <div className="flex items-center gap-1">
                                      <User size={12} />
                                      <span className="truncate max-w-[80px]">
                                        {task.assignee.name.split(' ')[0]}
                                      </span>
                                    </div>
                                  )}
                                  {task.dueDate && (
                                    <div className={`flex items-center gap-1 ${
                                      dayjs(task.dueDate).isBefore(dayjs(), 'day')
                                        ? 'text-red-500'
                                        : dayjs(task.dueDate).diff(dayjs(), 'day') <= 3
                                        ? 'text-yellow-500'
                                        : 'text-zinc-500 dark:text-zinc-400'
                                    }`}>
                                      <Calendar size={12} />
                                      <span>{dayjs(task.dueDate).format('MMM D')}</span>
                                    </div>
                                  )}
                                </div>

                                {!canMoveTask(task) && (
                                  <span className="text-xs text-zinc-400 italic">View only</span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* WIP Limit Warning */}
                      {isOverLimit && (
                        <div className="text-center p-2 text-red-500 text-sm font-medium">
                          ⚠ WIP Limit Exceeded
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}
