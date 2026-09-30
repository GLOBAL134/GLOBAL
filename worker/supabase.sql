create table if not exists public.applications (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  country text not null,
  purpose text,
  service text,
  comment text,
  source text not null default 'website',
  status text not null default 'NEW' check (status in ('NEW','IN_PROGRESS','CONTACTED','COMPLETED'))
);

alter table public.applications enable row level security;
revoke all on table public.applications from anon, authenticated;
grant select, insert, update, delete on table public.applications to service_role;
-- The Worker writes with SUPABASE_SERVICE_ROLE_KEY on the server only.
