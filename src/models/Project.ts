import { Schema, models, model } from 'mongoose'

const ProjectSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  description: String,
  owners: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  methodology: {
    type: String,
    enum: ['agile', 'waterfall', 'kanban'],
    default: 'agile'
  },
  startDate: Date,
  endDate: Date,
  kanbanColumns: [{
    id: String,
    title: { type: String, required: true },
    order: { type: Number, required: true },
    wipLimit: Number, // Work in progress limit
    color: { type: String, default: '#6B7280' }
  }],
  sprints: [{
    name: String,
    startDate: Date,
    endDate: Date,
    goal: String,
    status: {
      type: String,
      enum: ['planning', 'active', 'completed'],
      default: 'planning'
    },
    velocity: Number, // Story points completed
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }]
  }],
  dailyStandup: {
    enabled: { type: Boolean, default: false },
    time: String, // e.g., "09:00"
    timezone: { type: String, default: 'Asia/Kolkata' },
    duration: { type: Number, default: 15 }, // minutes
    lastConducted: Date,
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  retrospectives: [{
    sprintId: Schema.Types.ObjectId,
    date: Date,
    whatWentWell: [String],
    whatCouldImprove: [String],
    actionItems: [String],
    conductedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  backlog: [{
    epic: String,
    features: [String],
    priority: { type: Number, default: 0 }
  }]
}, { timestamps: true })

// Default Kanban columns
ProjectSchema.pre('save', function(next) {
  if (this.isNew && this.kanbanColumns.length === 0) {
    this.kanbanColumns = [
      { id: 'backlog', title: 'Backlog', order: 0, color: '#6B7280' },
      { id: 'todo', title: 'To Do', order: 1, color: '#3B82F6' },
      { id: 'in-progress', title: 'In Progress', order: 2, color: '#F59E0B', wipLimit: 3 },
      { id: 'review', title: 'Review', order: 3, color: '#8B5CF6' },
      { id: 'done', title: 'Done', order: 4, color: '#10B981' }
    ]
  }
  next()
})

export default models.Project || model('Project', ProjectSchema)
