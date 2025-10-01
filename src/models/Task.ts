import { Schema, models, model } from 'mongoose'

const TaskSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  assignee: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['backlog', 'todo', 'in-progress', 'review', 'done'],
    default: 'backlog',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  storyPoints: { type: Number, min: 1, max: 13 }, // Fibonacci for story points
  estimatedHours: Number,
  actualHours: { type: Number, default: 0 },
  dueDate: Date,
  startDate: Date,
  completedDate: Date,
  tags: [String],
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  attachments: [{
    name: String,
    url: String,
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  dependencies: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  subtasks: [{
    title: String,
    completed: { type: Boolean, default: false },
    assignee: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  workLogs: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    hours: Number,
    description: String,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true })

// Add indexes for performance
TaskSchema.index({ projectId: 1, status: 1 })
TaskSchema.index({ assignee: 1, status: 1 })
TaskSchema.index({ dueDate: 1, status: 1 })

export default models.Task || model('Task', TaskSchema)
