import { cookies } from 'next/headers'
import type { Role } from './roles'

export interface SessionUser {
  discord_id: string
  username: string
  avatar: string | null
  role: Role
}

export function getServerSession(): SessionUser | null {
  try {
    const cookieStore = cookies()
    const raw = cookieStore.get('pcrp_session')?.value
    if (!raw) return null
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export function getDiscordAvatarUrl(discordId: string, avatar: string | null) {
  if (!avatar) return null
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`
}
