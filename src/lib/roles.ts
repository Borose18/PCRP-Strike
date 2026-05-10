export type Role = 'owner' | 'cd' | 'admin' | 'staff'

export interface RolePermissions {
  canIssueStrikes: boolean
  canIssueBans: boolean
  canRemoveStrikes: boolean
  canRemoveBans: boolean
}

const ROLE_KEYS: Record<string, Role> = {
  [process.env.NEXT_PUBLIC_KEY_OWNER || 'PCRP-OWNER-2024']: 'owner',
  [process.env.NEXT_PUBLIC_KEY_CD || 'PCRP-CD-2024']: 'cd',
  [process.env.NEXT_PUBLIC_KEY_ADMIN || 'PCRP-ADMIN-2024']: 'admin',
  [process.env.NEXT_PUBLIC_KEY_STAFF || 'PCRP-STAFF-2024']: 'staff',
}

export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  owner: { canIssueStrikes: true, canIssueBans: true, canRemoveStrikes: true, canRemoveBans: true },
  cd:    { canIssueStrikes: true, canIssueBans: true, canRemoveStrikes: true, canRemoveBans: true },
  admin: { canIssueStrikes: true, canIssueBans: true, canRemoveStrikes: true, canRemoveBans: false },
  staff: { canIssueStrikes: true, canIssueBans: false, canRemoveStrikes: false, canRemoveBans: false },
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  cd: 'Community Director',
  admin: 'Admin',
  staff: 'Staff',
}

export function getRoleFromKey(key: string): Role | null {
  return ROLE_KEYS[key.trim()] ?? null
}

export function saveSession(role: Role, staffName: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem('pcrp_role', role)
  sessionStorage.setItem('pcrp_staff', staffName)
}

export function getSession(): { role: Role; staffName: string } | null {
  if (typeof window === 'undefined') return null
  const role = sessionStorage.getItem('pcrp_role') as Role | null
  const staffName = sessionStorage.getItem('pcrp_staff')
  if (!role || !staffName) return null
  return { role, staffName }
}

export function clearSession() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem('pcrp_role')
  sessionStorage.removeItem('pcrp_staff')
}
