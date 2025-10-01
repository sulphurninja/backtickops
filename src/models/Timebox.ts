// ========== models/Timebox.ts ==========
import { Schema, models, model, Types } from 'mongoose'
const Block = new Schema({
start: String, // HH:mm
end: String, // HH:mm
label: String,
taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
notes: String,
focused: { type: Boolean, default: false }
})
const TimeboxSchema = new Schema({
userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
date: { type: String, index: true }, // YYYY-MM-DD
top3: [String],
brainDump: [String],
blocks: [Block],
productivityScore: Number
}, { timestamps: true })
export default models.Timebox || model('Timebox', TimeboxSchema)
