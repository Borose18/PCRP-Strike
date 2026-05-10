'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS, ROLE_PERMISSIONS, type Role } from '@/lib/roles'
import { supabase } from '@/lib/supabase'
import IssueStrikeForm from '@/components/IssueStrikeForm'
import PlayerProfiles from '@/components/PlayerProfiles'
import FullLog from '@/components/FullLog'
import styles from './dashboard.module.css'

export type Player = {
  id: string
  discord_id: string
  username: string
  created_at: string
}

export type Strike = {
  id: string
  player_id: string
  discord_id: string
  username: string
  type: 'strike' | 'ban'
  level: number | null
  reason: string
  issued_by: string
  removed: boolean
  removed_by: string | null
  removed_at: string | null
  created_at: string
}

interface SessionUser {
  discord_id: string
  username: string
  avatar: string | null
  role: Role
}

function getAvatarUrl(discordId: string, avatar: string | null) {
  if (!avatar) return null
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`
}

export default function Dashboard() {
  const router = useRouter()
  const [session, setSession] = useState<SessionUser | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [strikes, setStrikes] = useState<Strike[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profiles' | 'log'>('profiles')

  useEffect(() => {
    // Read session from cookie via API
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data.user) { router.push('/login'); return }
        setSession(data.user)
      })
      .catch(() => router.push('/login'))
  }, [router])

  const fetchData = useCallback(async () => {
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from('players').select('*').order('created_at', { ascending: false }),
      supabase.from('strikes').select('*').order('created_at', { ascending: false }),
    ])
    if (p) setPlayers(p)
    if (s) setStrikes(s)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (session) fetchData()
  }, [session, fetchData])

  function logout() {
    window.location.href = '/api/auth/logout'
  }

  if (!session) return null

  const perms = ROLE_PERMISSIONS[session.role]
  const activeStrikes = strikes.filter(s => !s.removed)
  const avatarUrl = getAvatarUrl(session.discord_id, session.avatar)

  const stats = {
    total: activeStrikes.length,
    s1: activeStrikes.filter(s => s.type === 'strike' && s.level === 1).length,
    s2: activeStrikes.filter(s => s.type === 'strike' && s.level === 2).length,
    s3: activeStrikes.filter(s => s.type === 'strike' && s.level === 3).length,
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e8a838" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <div className={styles.siteName}>PCRP Strike System</div>
            <div className={styles.siteSub}>Pacific Coast RP</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.roleTag}>{ROLE_LABELS[session.role]}</span>
          {avatarUrl && <img src={avatarUrl} alt="" className={styles.avatar} />}
          <span className={styles.staffName}>{session.username}</span>
          <button className={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.stats}>
          <div className={styles.stat}><div className={styles.statLabel}>Total active</div><div className={styles.statVal}>{stats.total}</div></div>
          <div className={styles.stat}><div className={styles.statLabel}>Strike 1</div><div className={`${styles.statVal} ${styles.s1}`}>{stats.s1}</div></div>
          <div className={styles.stat}><div className={styles.statLabel}>Strike 2</div><div className={`${styles.statVal} ${styles.s2}`}>{stats.s2}</div></div>
          <div className={styles.stat}><div className={styles.statLabel}>Strike 3 / Bans</div><div className={`${styles.statVal} ${styles.s3}`}>{stats.s3}</div></div>
        </div>

        <div className={styles.grid}>
          {perms.canIssueStrikes && (
            <div className={styles.formCol}>
              <IssueStrikeForm
                players={players}
                strikes={strikes}
                staffName={session.username}
                perms={perms}
                onSuccess={fetchData}
              />
            </div>
          )}

          <div className={perms.canIssueStrikes ? styles.logCol : styles.logColFull}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${activeTab === 'profiles' ? styles.tabActive : ''}`} onClick={() => setActiveTab('profiles')}>Player profiles</button>
              <button className={`${styles.tab} ${activeTab === 'log' ? styles.tabActive : ''}`} onClick={() => setActiveTab('log')}>Full log</button>
            </div>

            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : activeTab === 'profiles' ? (
              <PlayerProfiles players={players} strikes={strikes} perms={perms} staffName={session.username} onSuccess={fetchData} />
            ) : (
              <FullLog strikes={strikes} perms={perms} staffName={session.username} onSuccess={fetchData} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
