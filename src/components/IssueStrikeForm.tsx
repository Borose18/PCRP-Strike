'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Player, Strike } from '@/app/page'
import styles from './IssueStrikeForm.module.css'

const STRIKE_INFO = {
  1: { label: 'Strike 1 — Official Warning', action: 'Verbal or written warning + mandatory retraining. No suspension.' },
  2: { label: 'Strike 2 — Temporary Suspension', action: 'Kick + 48-hour Discord timeout + whitelist/role suspension.' },
  3: { label: 'Strike 3 — Permanent Ban', action: 'Kick + permanent server ban + permanent Discord ban + community ban.' },
}

function getActiveStrikes(discordId: string, strikes: Strike[]) {
  return strikes.filter(s => s.discord_id === discordId && !s.removed)
}

function nextLevel(discordId: string, strikes: Strike[]) {
  const active = getActiveStrikes(discordId, strikes).filter(s => s.type === 'strike')
  return Math.min(active.length + 1, 3) as 1 | 2 | 3
}

function isBanned(discordId: string, strikes: Strike[]) {
  return getActiveStrikes(discordId, strikes).some(s => s.type === 'ban' || s.level === 3)
}

import type { RolePermissions } from '@/lib/roles'

interface Props {
  players: Player[]
  strikes: Strike[]
  staffName: string
  perms: RolePermissions
  onSuccess: () => void
}

export default function IssueStrikeForm({ players, strikes, staffName, perms, onSuccess }: Props) {
  const [username, setUsername] = useState('')
  const [discordId, setDiscordId] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modal, setModal] = useState<null | 'strike' | 'ban'>(null)
  const [error, setError] = useState('')

  const matchedPlayer = players.find(p => p.discord_id === discordId.trim())
  const banned = discordId.trim() ? isBanned(discordId.trim(), strikes) : false
  const next = discordId.trim() && !banned ? nextLevel(discordId.trim(), strikes) : 1
  const isKnown = !!matchedPlayer
  const priorCount = discordId.trim() ? getActiveStrikes(discordId.trim(), strikes).filter(s => s.type === 'strike').length : 0

  useEffect(() => {
    if (matchedPlayer && !username) setUsername(matchedPlayer.username)
  }, [matchedPlayer, username])

  function onIdChange(val: string) {
    setDiscordId(val)
    const p = players.find(pl => pl.discord_id === val.trim())
    if (p) setUsername(p.username)
  }

  function validate() {
    if (!username.trim()) { setError('Enter the Discord username.'); return false }
    if (!discordId.trim()) { setError('Enter the Discord ID.'); return false }
    if (!/^\d{17,19}$/.test(discordId.trim())) { setError('Discord ID must be 17–19 digits.'); return false }
    if (!reason.trim()) { setError('Enter a reason.'); return false }
    setError('')
    return true
  }

  async function submit(type: 'strike' | 'ban') {
    if (!validate()) return
    setModal(type)
  }

  async function confirm() {
    setSubmitting(true)
    const did = discordId.trim()
    const uname = username.trim()

    let playerId: string
    if (matchedPlayer) {
      playerId = matchedPlayer.id
      await supabase.from('players').update({ username: uname }).eq('id', playerId)
    } else {
      const { data, error: pe } = await supabase.from('players').insert({ discord_id: did, username: uname }).select().single()
      if (pe || !data) { setError('Failed to create player record.'); setSubmitting(false); setModal(null); return }
      playerId = data.id
    }

    const isStrike = modal === 'strike'
    const { error: se } = await supabase.from('strikes').insert({
      player_id: playerId,
      discord_id: did,
      username: uname,
      type: modal,
      level: isStrike ? next : null,
      reason: reason.trim(),
      issued_by: staffName,
    })

    if (se) { setError('Failed to save. Try again.'); setSubmitting(false); setModal(null); return }

    setUsername(''); setDiscordId(''); setReason(''); setModal(null); setSubmitting(false)
    onSuccess()
  }

  const info = STRIKE_INFO[next]

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Issue a strike</h2>

      <div className={styles.field}>
        <label>Discord username</label>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. username" />
      </div>
      <div className={styles.field}>
        <label>Discord ID</label>
        <input value={discordId} onChange={e => onIdChange(e.target.value)} placeholder="123456789012345678" inputMode="numeric" />
        <span className={styles.hint}>Right-click profile → Copy User ID</span>
      </div>

      {discordId.trim().length > 0 && (
        banned ? (
          <div className={styles.blocked}>
            <span className={styles.blockedIcon}>⛔</span>
            <div>
              <div className={styles.blockedTitle}>Player is already banned</div>
              <div className={styles.blockedSub}>No more strikes can be issued. If they haven't been removed from the server yet, do it now.</div>
            </div>
          </div>
        ) : (
          <div className={`${styles.preview} ${styles[`preview${next}`]}`}>
            <div className={styles.previewLabel}>
              {isKnown ? `Known player — ${priorCount} prior strike${priorCount !== 1 ? 's' : ''}. ` : 'New player. '}
              Next: <strong>{info.label}</strong>
            </div>
            <div className={styles.previewAction}>{info.action}</div>
          </div>
        )
      )}

      <div className={styles.field}>
        <label>Reason</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe the infraction in detail..." />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <button className={styles.strikeBtn} onClick={() => submit('strike')} disabled={banned || submitting}>
        Issue Strike {!banned ? next : '—'}
      </button>

      <div className={styles.divider}><span>or</span></div>

      {perms.canIssueBans ? (
        <button className={styles.banBtn} onClick={() => submit('ban')} disabled={banned || submitting}>
          ☠ Instant ban
        </button>
      ) : (
        <div className={styles.banBlocked}>
          <div className={styles.banBlockedTitle}>☠ Instant ban — restricted</div>
          <div className={styles.banBlockedSub}>Contact an Admin, CD, or Owner to issue an instant ban.</div>
        </div>
      )}

      {modal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalIcon}>{modal === 'ban' ? '☠' : next === 1 ? '⚠️' : next === 2 ? '🕐' : '🔨'}</div>
            <div className={styles.modalTitle}>{modal === 'ban' ? 'Instant ban — no strikes' : info.label}</div>
            <div className={styles.modalBody}>
              Issuing against <strong>{username}</strong> ({discordId})<br /><br />
              {modal === 'ban'
                ? 'This permanently bans the player without issuing any strikes. Use for trolling, hate speech, doxxing, or anything requiring immediate removal.'
                : <><strong>Required action:</strong> {info.action}</>}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setModal(null)} disabled={submitting}>Cancel</button>
              <button className={modal === 'ban' ? styles.confirmBanBtn : styles.confirmStrikeBtn} onClick={confirm} disabled={submitting}>
                {submitting ? 'Saving...' : modal === 'ban' ? 'Ban them' : 'Confirm strike'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
