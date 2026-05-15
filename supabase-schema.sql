-- Supabase database schema for GhostWire Terminal
-- Includes tables used by the app and recommended RLS policies.

-- Optional: enable uuid helper if not already enabled
create extension if not exists "pgcrypto";

-- 1) players table: profile + online presence
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  is_online boolean not null default false,
  last_active timestamptz not null default now()
);

-- 2) sessions table: saved game state per player
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  username text not null,
  last_state jsonb not null default '{}'::jsonb,
  last_active timestamptz not null default now()
);

-- Indexes for queries used by the app
create index if not exists idx_players_is_online on players(is_online) where is_online = true;
create index if not exists idx_sessions_player_id on sessions(player_id);

-- Enable Row Level Security
alter table players enable row level security;
alter table sessions enable row level security;

-- Players table policies
create policy "Players: user can select own profile"
  on players
  for select
  using (auth.uid() = id::text);

create policy "Players: user can insert own profile"
  on players
  for insert
  with check (auth.uid() = id::text);

create policy "Players: user can update own profile"
  on players
  for update
  using (auth.uid() = id::text)
  with check (auth.uid() = id::text);

-- Sessions table policies
create policy "Sessions: user can select own sessions"
  on sessions
  for select
  using (auth.uid() = player_id::text);

create policy "Sessions: user can insert own session"
  on sessions
  for insert
  with check (auth.uid() = player_id::text);

create policy "Sessions: user can update own sessions"
  on sessions
  for update
  using (auth.uid() = player_id::text)
  with check (auth.uid() = player_id::text);

create policy "Sessions: user can delete own sessions"
  on sessions
  for delete
  using (auth.uid() = player_id::text);
