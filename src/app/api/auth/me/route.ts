import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const raw = req.cookies.get('pcrp_session')?.value
  if (!raw) return NextResponse.json({ user: null })

  try {
    const cookie = JSON.parse(raw)

    const { data: staffRole } = await supabase
      .from('staff_roles')
      .select('role, username')
      .eq('discord_id', cookie.discord_id)
      .single()

    if (!staffRole) return NextResponse.json({ user: null })

    return NextResponse.json({
      user: {
        discord_id: cookie.discord_id,
        username: cookie.username,
        avatar: cookie.avatar,
        role: staffRole.role,
      }
    })
  } catch {
    return NextResponse.json({ user: null })
  }
}
