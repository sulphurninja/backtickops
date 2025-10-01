// ========== models/Task.ts ==========
import { Schema, models, model } from 'mongoose'
const TaskSchema = new Schema({
title: String,
description: String,
status: { type: String, enum: ['todo','doing','done'], default: 'todo' },
assignee: { type: Schema.Types.ObjectId, ref: 'User' },
projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
due: Date,
tags: [String],
priority: { type: Number, default: 3 }
}, { timestamps: true })
export default models.Task || model('Task', TaskSchema)
