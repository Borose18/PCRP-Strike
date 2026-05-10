-- Run this in your Supabase SQL editor to set up the database

-- Players table: one row per Discord ID
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  discord_id text unique not null,
  username text not null,
  created_at timestamptz default now()
);

-- Strikes table: every action taken against a player
create table if not exists strikes (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade not null,
  discord_id text not null,
  username text not null,
  type text not null check (type in ('strike', 'ban')),
  level integer check (
    (type = 'strike' and level in (1, 2, 3)) or
    (type = 'ban' and level is null)
  ),
  reason text not null,
  issued_by text not null,
  removed boolean default false,
  removed_by text,
  removed_at timestamptz,
  created_at timestamptz default now()
);

-- Index for fast lookups by discord_id
create index if not exists strikes_discord_id_idx on strikes(discord_id);
create index if not exists strikes_player_id_idx on strikes(player_id);
