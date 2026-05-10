'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import styles from './login.module.css'

function LoginContent() {
  const params = useSearchParams()
  const error = params.get('error')

  const errorMessages: Record<string, string> = {
    no_access: "Your Discord account doesn't have access to PCRP staff tools. Contact your server owner.",
    token_failed: "Discord login failed. Try again.",
    no_code: "Login was cancelled. Try again.",
    server_error: "Something went wrong. Try again.",
  }

  function handleLogin() {
    const clientId = '1502905619106107503'
    const redirectUri = encodeURIComponent(window.location.origin + '/api/auth/callback')
    window.location.href = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify`
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e8a838" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h1 className={styles.title}>PCRP Strike System</h1>
        <p className={styles.sub}>Pacific Coast RP — Staff Portal</p>

        {error && (
          <div className={styles.error}>
            {errorMessages[error] || 'Something went wrong. Try again.'}
          </div>
        )}

        <button className={styles.discordBtn} onClick={handleLogin}>
          <svg width="20" height="20" viewBox="0 0 71 55" fill="white">
            <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a.2.2 0 0 0-.2.1 40.8 40.8 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.8 37.8 0 0 0 25.4.5a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.5 4.9a.2.2 0 0 0-.1.1C1.5 18.1-1 31 .3 43.6a.2.2 0 0 0 .1.2 58.8 58.8 0 0 0 17.7 8.9.2.2 0 0 0 .2-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4l1.1-.8a.2.2 0 0 1 .2 0c11.5 5.3 24 5.3 35.4 0a.2.2 0 0 1 .2 0l1.1.8a.2.2 0 0 1 0 .4 36.2 36.2 0 0 1-5.5 2.6.2.2 0 0 0-.1.3 47 47 0 0 0 3.6 5.9.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.7-8.9.2.2 0 0 0 .1-.2c1.5-15.3-2.6-28.1-10.9-39.7a.2.2 0 0 0-.1-.1zM23.7 36c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1c3.6 0 6.5 3.2 6.4 7.1 0 3.9-2.8 7.1-6.4 7.1zm23.7 0c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1c3.6 0 6.5 3.2 6.4 7.1 0 3.9-2.8 7.1-6.4 7.1z"/>
          </svg>
          Sign in with Discord
        </button>

        <p className={styles.note}>Only authorized PCRP staff can access this portal.</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
