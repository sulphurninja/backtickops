// ========== models/Project.ts ==========
import { Schema, models, model } from 'mongoose'
const ProjectSchema = new Schema({
name: String,
code: String,
description: String,
owners: [{ type: Schema.Types.ObjectId, ref: 'User' }],
members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
status: { type: String, enum: ['active','paused','done'], default: 'active' }
}, { timestamps: true })
export default models.Project || model('Project', ProjectSchema)
