import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', req.url))
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL('/login?error=token_failed', req.url))
    }

    // Get Discord user info
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const discordUser = await userRes.json()

    // Check if user has a role in Supabase
    const { data: staffRole } = await supabase
      .from('staff_roles')
      .select('role, username')
      .eq('discord_id', discordUser.id)
      .single()

    if (!staffRole) {
      return NextResponse.redirect(new URL('/login?error=no_access', req.url))
    }

    // Update username in staff_roles to keep it current
    await supabase
      .from('staff_roles')
      .update({ username: discordUser.username })
      .eq('discord_id', discordUser.id)

    // Set session cookie and redirect to dashboard
    const session = {
      discord_id: discordUser.id,
      username: discordUser.username,
      avatar: discordUser.avatar,
      role: staffRole.role,
    }

    const response = NextResponse.redirect(new URL('/', req.url))
    response.cookies.set('pcrp_session', JSON.stringify(session), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (err) {
    return NextResponse.redirect(new URL('/login?error=server_error', req.url))
  }
}
