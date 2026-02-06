create extension if not exists "pgcrypto";

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  phone text,
  cnpj text,
  address text,
  created_at timestamptz default now()
);

create unique index if not exists clients_user_name_idx on clients (user_id, name);

create table if not exists appts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  client_id uuid references clients on delete set null,
  service text not null,
  start_at bigint not null,
  end_at bigint not null,
  status text not null,
  location text,
  notes text,
  completed_at bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists receivables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  client_id uuid references clients on delete set null,
  customer text not null,
  description text,
  due_date date not null,
  amount_cents bigint not null,
  status text not null,
  method text not null,
  paid_at bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  description text not null,
  due_date date not null,
  amount_cents bigint not null,
  status text not null,
  category text,
  method text,
  paid_at bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Migração (executar uma vez no Supabase SQL Editor):
-- ALTER TABLE receivables
--   ALTER COLUMN due_date TYPE date USING to_timestamp(due_date/1000)::date;
-- ALTER TABLE payables
--   ALTER COLUMN due_date TYPE date USING to_timestamp(due_date/1000)::date;
-- ALTER TABLE payables ADD COLUMN IF NOT EXISTS method text;

create table if not exists cash_opening (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  ym text not null,
  amount_cents bigint not null,
  updated_at timestamptz default now(),
  unique (user_id, ym)
);

alter table clients enable row level security;
alter table appts enable row level security;
alter table receivables enable row level security;
alter table payables enable row level security;
alter table cash_opening enable row level security;

create policy "clients_select" on clients
  for select using (true);
create policy "clients_insert" on clients
  for insert with check (true);
create policy "clients_update" on clients
  for update using (true);
create policy "clients_delete" on clients
  for delete using (true);

create policy "appts_select" on appts
  for select using (true);
create policy "appts_insert" on appts
  for insert with check (true);
create policy "appts_update" on appts
  for update using (true);
create policy "appts_delete" on appts
  for delete using (true);

create policy "receivables_select" on receivables
  for select using (true);
create policy "receivables_insert" on receivables
  for insert with check (true);
create policy "receivables_update" on receivables
  for update using (true);
create policy "receivables_delete" on receivables
  for delete using (true);

create policy "payables_select" on payables
  for select using (true);
create policy "payables_insert" on payables
  for insert with check (true);
create policy "payables_update" on payables
  for update using (true);
create policy "payables_delete" on payables
  for delete using (true);

create policy "cash_opening_select" on cash_opening
  for select using (true);
create policy "cash_opening_insert" on cash_opening
  for insert with check (true);
create policy "cash_opening_update" on cash_opening
  for update using (true);
create policy "cash_opening_delete" on cash_opening
  for delete using (true);
