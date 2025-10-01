// ========== models/User.ts ==========
import { Schema, models, model } from 'mongoose'
const UserSchema = new Schema({
name: String,
email: { type: String, unique: true, index: true },
passwordHash: String,
role: { type: String, enum: ['admin','manager','employee'], default: 'employee' },
spotify: {
accessToken: String, refreshToken: String, expiresAt: Date
}
}, { timestamps: true })
export default models.User || model('User', UserSchema)
