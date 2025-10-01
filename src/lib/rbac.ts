// ========== lib/rbac.ts ==========
export type Role = 'admin'|'manager'|'employee'
export const can = (userRole: Role, allowed: Role[]) => allowed.includes(userRole)


