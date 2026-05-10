'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Strike } from '@/app/page'
import type { RolePermissions } from '@/lib/roles'
import styles from './FullLog.module.css'

interface Props {
  strikes: Strike[]
  perms: RolePermissions
  staffName: string
  onSuccess: () => void
}

type Filter = 'all' | '1' | '2' | '3' | 'ban'

export default function FullLog({ strikes, perms, staffName, onSuccess }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [removing, setRemoving] = useState<string | null>(null)

  const filtered = strikes.filter(s => {
    if (filter === 'ban') return s.type === 'ban'
    if (filter !== 'all') return s.type === 'strike' && s.level === parseInt(filter)
    return true
  }).filter(s =>
    !search || s.username.toLowerCase().includes(search.toLowerCase()) ||
    s.discord_id.includes(search) || s.issued_by.toLowerCase().includes(search.toLowerCase())
  )

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

  const filters: { val: Filter; label: string }[] = [
    { val: 'all', label: 'All' },
    { val: '1', label: 'Strike 1' },
    { val: '2', label: 'Strike 2' },
    { val: '3', label: 'Strike 3' },
    { val: 'ban', label: 'Instant ban' },
  ]

  return (
    <div>
      <input className={styles.search} placeholder="Search username, Discord ID, or staff..." value={search} onChange={e => setSearch(e.target.value)} />
      <div className={styles.filterRow}>
        {filters.map(f => (
          <button key={f.val} className={`${styles.filterBtn} ${filter === f.val ? styles.filterActive : ''}`} onClick={() => setFilter(f.val)}>{f.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>{strikes.length === 0 ? 'No records yet.' : 'No results.'}</div>
      ) : filtered.map(s => {
        const isBan = s.type === 'ban'
        const canRemove = s.removed ? false : isBan ? perms.canRemoveBans : perms.canRemoveStrikes
        return (
          <div key={s.id} className={`${styles.entry} ${s.removed ? styles.entryRemoved : ''}`}>
            <div className={`${styles.badge} ${isBan ? styles.badgeBan : s.level === 1 ? styles.badge1 : s.level === 2 ? styles.badge2 : styles.badge3}`}>
              {isBan ? 'BAN' : `S${s.level}`}
            </div>
            <div className={styles.body}>
              <div className={styles.top}>
                <span className={styles.username}>{s.username}</span>
                <span className={styles.discordId}>{s.discord_id}</span>
                {s.removed && <span className={styles.removedTag}>Removed</span>}
              </div>
              <div className={styles.reason}>{s.reason}</div>
              <div className={styles.meta}>
                Issued by {s.issued_by} · {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {s.removed && s.removed_by && <> · Removed by {s.removed_by}</>}
              </div>
            </div>
            {canRemove && (
              <button className={styles.removeBtn} onClick={() => removeStrike(s)} disabled={removing === s.id}>
                {removing === s.id ? '...' : 'Remove'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
