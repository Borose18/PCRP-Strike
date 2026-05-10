'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Player, Strike } from '@/app/page'
import type { RolePermissions } from '@/lib/roles'
import styles from './PlayerProfiles.module.css'

interface Props {
  players: Player[]
  strikes: Strike[]
  perms: RolePermissions
  staffName: string
  onSuccess: () => void
}

function getActiveStrikes(playerId: string, strikes: Strike[]) {
  return strikes.filter(s => s.player_id === playerId && !s.removed)
}

function getStatus(active: Strike[]) {
  if (active.some(s => s.type === 'ban' || s.level === 3)) return { label: 'Banned', cls: 'banned' }
  const max = Math.max(0, ...active.filter(s => s.type === 'strike').map(s => s.level ?? 0))
  if (max === 2) return { label: 'Suspended', cls: 'suspended' }
  if (max === 1) return { label: 'Warned', cls: 'warned' }
  return { label: 'Clean', cls: 'clean' }
}

function initials(name: string) {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'
}

export default function PlayerProfiles({ players, strikes, perms, staffName, onSuccess }: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Player | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const filtered = players.filter(p =>
    !search || p.username.toLowerCase().includes(search.toLowerCase()) || p.discord_id.includes(search)
  ).sort((a, b) => {
    const as = strikes.filter(s => s.player_id === a.id)
    const bs = strikes.filter(s => s.player_id === b.id)
    const at = as.length ? new Date(as[0].created_at).getTime() : 0
    const bt = bs.length ? new Date(bs[0].created_at).getTime() : 0
    return bt - at
  })

  async function removeStrike(strike: Strike) {
    setRemoving(strike.id)
    await supabase.from('strikes').update({
      removed: true,
      removed_by: staffName,
      removed_at: new Date().toISOString(),
    }).eq('id', strike.id)
    setRemoving(null)
    onSuccess()
  }

  const selectedStrikes = selected ? strikes.filter(s => s.player_id === selected.id) : []
  const selectedActive = selectedStrikes.filter(s => !s.removed)

  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        <input className={styles.search} placeholder="Search username or Discord ID..." value={search} onChange={e => setSearch(e.target.value)} />
        {filtered.length === 0 ? (
          <div className={styles.empty}>{players.length === 0 ? 'No players on record yet.' : 'No results.'}</div>
        ) : filtered.map(p => {
          const active = getActiveStrikes(p.id, strikes)
          const status = getStatus(active)
          const normalStrikes = active.filter(s => s.type === 'strike')
          return (
            <div key={p.id} className={`${styles.playerCard} ${selected?.id === p.id ? styles.playerCardActive : ''}`} onClick={() => setSelected(p)}>
              <div className={`${styles.avatar} ${styles[`av${status.cls}`]}`}>{initials(p.username)}</div>
              <div className={styles.playerInfo}>
                <div className={styles.playerName}>{p.username}</div>
                <div className={styles.playerId}>{p.discord_id}</div>
              </div>
              <div className={styles.playerRight}>
                <div className={styles.pipRow}>
                  {active.map(s => (
                    <div key={s.id} className={`${styles.pip} ${s.type === 'ban' ? styles.pipBan : s.level === 1 ? styles.pip1 : s.level === 2 ? styles.pip2 : styles.pip3}`} />
                  ))}
                </div>
                <span className={`${styles.statusTag} ${styles[`st${status.cls}`]}`}>{status.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <div className={styles.profile}>
          <div className={styles.profileHeader}>
            <div className={styles.profileName}>{selected.username}</div>
            <div className={styles.profileId}>{selected.discord_id}</div>
            <div className={styles.profileStatus}>
              <span className={`${styles.statusTag} ${styles[`st${getStatus(selectedActive).cls}`]}`}>{getStatus(selectedActive).label}</span>
              <span className={styles.profileCount}>{selectedActive.length} active record{selectedActive.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className={styles.profileSection}>Strike history</div>
          {selectedStrikes.length === 0 ? (
            <div className={styles.empty}>No records.</div>
          ) : [...selectedStrikes].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(s => {
            const isBan = s.type === 'ban'
            const canRemove = s.removed ? false : isBan ? perms.canRemoveBans : perms.canRemoveStrikes
            return (
              <div key={s.id} className={`${styles.strikeEntry} ${s.removed ? styles.strikeRemoved : ''}`}>
                <div className={styles.strikeTop}>
                  <span className={`${styles.badge} ${isBan ? styles.badgeBan : s.level === 1 ? styles.badge1 : s.level === 2 ? styles.badge2 : styles.badge3}`}>
                    {isBan ? 'Instant Ban' : `Strike ${s.level}`}
                  </span>
                  {s.removed && <span className={styles.removedTag}>Removed</span>}
                  <span className={styles.strikeTime}>{new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className={styles.strikeReason}>{s.reason}</div>
                <div className={styles.strikeMeta}>
                  Issued by {s.issued_by}
                  {s.removed && s.removed_by && <> · Removed by {s.removed_by}</>}
                </div>
                {canRemove && (
                  <button className={styles.removeBtn} onClick={() => removeStrike(s)} disabled={removing === s.id}>
                    {removing === s.id ? 'Removing...' : 'Remove'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!selected && (
        <div className={styles.noSelect}>
          <div className={styles.noSelectIcon}>👤</div>
          Select a player to view their profile
        </div>
      )}
    </div>
  )
}
