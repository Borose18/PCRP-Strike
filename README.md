# PCRP Strike System

Staff violation tracker for Pacific Coast RP.

---

## Setup

### 1. Supabase database

1. Go to your Supabase project → SQL Editor
2. Paste and run the contents of `supabase-schema.sql`
3. That creates the `players` and `strikes` tables

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

NEXT_PUBLIC_KEY_OWNER=your-owner-key-here
NEXT_PUBLIC_KEY_CD=your-cd-key-here
NEXT_PUBLIC_KEY_ADMIN=your-admin-key-here
NEXT_PUBLIC_KEY_STAFF=your-staff-key-here
```

**Change the keys to anything you want** — share each key only with people who should have that role.

### 3. Deploy to Vercel

1. Push this folder to a GitHub repo
2. Import the repo in Vercel
3. Add all 6 environment variables in Vercel → Project Settings → Environment Variables
4. Deploy

---

## Role permissions

| Action              | Owner | CD  | Admin | Staff |
|---------------------|-------|-----|-------|-------|
| View all records    | ✅    | ✅  | ✅    | ✅    |
| Issue strikes       | ✅    | ✅  | ✅    | ❌    |
| Issue instant bans  | ✅    | ✅  | ✅    | ❌    |
| Remove strikes      | ✅    | ✅  | ✅    | ❌    |
| Remove bans         | ✅    | ✅  | ❌    | ❌    |

---

## Strike system

- **Strike 1** — Official warning + mandatory retraining
- **Strike 2** — 48-hour suspension + Discord timeout + whitelist suspension
- **Strike 3** — Permanent ban (server + Discord + community)
- **Instant ban** — Immediate removal, no strikes recorded. For trolling, hate speech, doxxing, etc.

Strike level is automatic — the system tracks each player by Discord ID and assigns the next level.
Players with Strike 3 or an instant ban are locked out of further strikes.
