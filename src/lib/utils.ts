// ========== lib/utils.ts ==========
import { NextRequest, NextResponse } from 'next/server'
import { verifyAccess } from './auth'
export function getUserFromAuth(req: NextRequest) {
const hdr = req.headers.get('authorization') || ''
const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : ''
return token ? verifyAccess(token) : null
}
export function forbidden() { return NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
