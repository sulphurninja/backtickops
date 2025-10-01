// ========== lib/db.ts ==========
import mongoose from 'mongoose'
let cached: typeof mongoose | null = null
export async function dbConnect() {
if (cached) return cached
const uri = process.env.MONGODB_URI!
cached = await mongoose.connect(uri, { dbName: 'backtick_ops' })
return cached
}
