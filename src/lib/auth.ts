import jwt from 'jsonwebtoken'
export type JwtUser = { id: string; role: 'admin'|'manager'|'employee'; name: string }
export function signAccess(payload: JwtUser) {
return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '45m' })
}
export function verifyAccess(token: string): JwtUser | null {
try { return jwt.verify(token, process.env.JWT_SECRET!) as JwtUser } catch { return null }
}
