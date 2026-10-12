-- SitePulse initial schema. Apply with: supabase db push
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_url text not null check (char_length(target_url) <= 2048),
  status text not null default 'completed' check (status in ('queued','running','completed','failed')),
  overall_score smallint check (overall_score between 0 and 100),
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audits_user_created_idx on public.audits(user_id, created_at desc);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  event_type text not null default 'audit',
  created_at timestamptz not null default now(),
  unique(user_id, request_id)
);
create index if not exists usage_events_user_created_idx on public.usage_events(user_id, created_at desc);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text,
  provider_customer_id text unique,
  provider_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free','pro')),
  status text not null default 'inactive' check (status in ('inactive','trialing','active','past_due','canceled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_reports (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.audits enable row level security;
alter table public.usage_events enable row level security;
alter table public.subscriptions enable row level security;
alter table public.shared_reports enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users read own audits" on public.audits;
create policy "Users read own audits" on public.audits for select to authenticated using (auth.uid() = user_id);
-- No client insert/update/delete policy: trusted Edge Functions should write audit reports.

drop policy if exists "Users read own usage" on public.usage_events;
create policy "Users read own usage" on public.usage_events for select to authenticated using (auth.uid() = user_id);
-- No client write policy: quota accounting must be server-authoritative.

drop policy if exists "Users read own subscription" on public.subscriptions;
create policy "Users read own subscription" on public.subscriptions for select to authenticated using (auth.uid() = user_id);
-- Only trusted billing webhooks/admin functions may change subscription records.

drop policy if exists "Users manage own share settings" on public.shared_reports;
create policy "Users read own share settings" on public.shared_reports for select to authenticated using (auth.uid() = owner_id);
-- Share-token creation and revocation should be implemented through an authenticated Edge Function.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  insert into public.subscriptions (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
