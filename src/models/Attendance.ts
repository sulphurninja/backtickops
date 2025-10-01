import { Schema, models, model } from 'mongoose'

const AttendanceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  date: { type: String, index: true },
  checkIn: Date,
  checkOut: Date,
  location: {
    latitude: Number,
    longitude: Number
  },
  distance: Number,
  notes: String,
  mode: { type: String, enum: ['office','remote'], default: 'office' },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'approved' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date
}, { timestamps: true })

export default models.Attendance || model('Attendance', AttendanceSchema)
