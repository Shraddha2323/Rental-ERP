create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  property_name text not null,
  unit_name text not null,
  lease_start date,
  lease_end date,
  monthly_rent numeric(12, 2) not null default 0,
  deposit_amount numeric(12, 2) not null default 0,
  outstanding_amount numeric(12, 2) not null default 0,
  status text not null default 'active' check (status in ('active', 'notice', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenants_status_idx on public.tenants (status);
create index if not exists tenants_property_unit_idx on public.tenants (property_name, unit_name);

alter table public.tenants enable row level security;

-- Starter policy for a private prototype.
-- This lets the anon key read and insert tenant records from your deployed app.
-- Before sharing widely, replace this with Supabase Auth policies.
create policy "prototype_select_tenants"
  on public.tenants
  for select
  to anon
  using (true);

create policy "prototype_insert_tenants"
  on public.tenants
  for insert
  to anon
  with check (true);

insert into public.tenants (
  name,
  phone,
  email,
  property_name,
  unit_name,
  lease_start,
  lease_end,
  monthly_rent,
  deposit_amount,
  outstanding_amount,
  status
) values
  (
    'Amit Sharma',
    '+91 98765 43210',
    'amit@example.com',
    'Green Heights',
    'A-1202',
    '2026-01-01',
    '2026-12-31',
    42000,
    126000,
    0,
    'active'
  ),
  (
    'Priya Mehta',
    '+91 99887 76655',
    'priya@example.com',
    'Lakeview Arcade',
    'Shop 8',
    '2025-09-01',
    '2026-08-31',
    56000,
    168000,
    12000,
    'notice'
  )
on conflict do nothing;
