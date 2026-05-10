-- BetTrack schema — run once in Supabase SQL Editor

create table if not exists bets (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  match_date  date not null,
  match       text not null,
  league      text not null,
  market      text not null,
  selection   text not null,
  odds        numeric(10,2) not null,
  stake       numeric(10,2) not null,
  status      text not null default 'pending'
                check (status in ('pending','won','lost','void')),
  notes       text
);

create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  date        date not null,
  type        text not null check (type in ('deposit','withdrawal')),
  amount      numeric(10,2) not null,
  notes       text
);

create table if not exists settings (
  key         text primary key,
  value       text not null
);

-- Seed initial bankroll (only if row doesn't exist yet)
insert into settings (key, value)
values ('initial_bankroll', '280')
on conflict (key) do nothing;

-- Disable RLS (public shared dashboard — no auth needed)
alter table bets         disable row level security;
alter table transactions disable row level security;
alter table settings     disable row level security;

-- Enable real-time for all three tables
alter publication supabase_realtime add table bets;
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table settings;

-- ── Parlay migration (run if upgrading from initial schema) ────────────────────
-- alter table bets add column if not exists bet_type text not null default 'single';
-- alter table bets add column if not exists legs     jsonb;
-- alter table bets drop constraint if exists bets_status_check;
-- alter table bets add constraint bets_status_check
--   check (status in ('pending','won','lost','void','half-won','half-lost'));
-- alter table bets alter column odds type numeric(12,4);
