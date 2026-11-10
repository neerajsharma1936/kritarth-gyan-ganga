-- Kritarth Gyan Ganga: fresh Supabase schema foundation.
-- This schema intentionally stores each existing application record in a JSONB `data` field
-- so the current React object shapes can be migrated without destructive field renaming.
-- Apply in Supabase SQL Editor on a NEW project. Do not run against a database containing data.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('super_admin','admin','student')),
  student_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id text primary key,
  roll_no text unique,
  name text not null default '',
  class_name text not null default '',
  archived boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id text primary key,
  teacher_id text unique,
  name text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fee_plans (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(id) on update cascade on delete restrict,
  effective_from text not null,
  class_name text not null default '',
  monthly_fee numeric(12,2) not null default 0 check (monthly_fee >= 0),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(student_id, effective_from)
);

create table if not exists public.payments (
  id text primary key,
  student_id text not null references public.students(id) on update cascade on delete restrict,
  amount numeric(12,2) not null check (amount >= 0),
  payment_date date,
  fee_month text,
  status text not null default 'paid',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id text not null references public.payments(id) on update cascade on delete restrict,
  student_id text not null references public.students(id) on update cascade on delete restrict,
  fee_month text not null,
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_salary_payments (
  id text primary key,
  teacher_id text not null references public.teachers(id) on update cascade on delete restrict,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  payment_date date,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.demo_requests (
  id text primary key default ('DEMO-' || gen_random_uuid()::text),
  student_name text not null,
  parent_name text not null default '',
  phone text not null,
  email text not null default '',
  class_name text not null default '',
  subject text not null default '',
  preferred_date date,
  preferred_time text not null default '',
  mode text not null default '',
  status text not null default 'New',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id text primary key,
  name text not null default '',
  display_order integer not null default 1,
  active boolean not null default true,
  photo_path text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_content (
  id integer primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.offers (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.class_schedule (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null default '',
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists students_class_idx on public.students(class_name);
create index if not exists students_archived_idx on public.students(archived);
create index if not exists payments_student_date_idx on public.payments(student_id, payment_date desc);
create index if not exists payments_month_idx on public.payments(fee_month);
create index if not exists demo_requests_status_idx on public.demo_requests(status, created_at desc);
create index if not exists achievements_order_idx on public.achievements(display_order);

create or replace function public.current_app_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() and is_active = true $$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.current_app_role() in ('admin','super_admin'), false) $$;

-- New Auth users receive the least-privileged role. Promote the first trusted account
-- to super_admin manually in SQL Editor after creating it in Supabase Auth.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.fee_plans enable row level security;
alter table public.payments enable row level security;
alter table public.payment_allocations enable row level security;
alter table public.teacher_salary_payments enable row level security;
alter table public.demo_requests enable row level security;
alter table public.achievements enable row level security;
alter table public.website_content enable row level security;
alter table public.payment_methods enable row level security;
alter table public.offers enable row level security;
alter table public.class_schedule enable row level security;
alter table public.audit_logs enable row level security;

-- A user can read only their own profile. Staff profile administration is reserved
-- for trusted server-side operations; do not allow users to edit their own role.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());

do $$
declare t text;
begin
  foreach t in array array['students','teachers','fee_plans','payments','payment_allocations','teacher_salary_payments','achievements','website_content','payment_methods','offers','class_schedule','audit_logs'] loop
    execute format('drop policy if exists %I on public.%I', 'staff full access', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', 'staff full access', t);
  end loop;
end $$;

-- Public visitors may submit enquiries, but cannot read or edit them.
drop policy if exists "public submit demo request" on public.demo_requests;
create policy "public submit demo request" on public.demo_requests for insert to anon, authenticated
with check (
  length(trim(student_name)) between 2 and 100
  and length(regexp_replace(phone, '\\D', '', 'g')) between 10 and 15
  and length(trim(class_name)) <= 50
  and length(trim(subject)) <= 100
);
drop policy if exists "staff manage demo requests" on public.demo_requests;
create policy "staff manage demo requests" on public.demo_requests for all to authenticated
using (public.is_staff()) with check (public.is_staff());

-- Private buckets: files are not publicly listable. Staff can manage files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
 ('student-photos','student-photos',false,5242880,array['image/jpeg','image/png','image/webp']),
 ('achievement-photos','achievement-photos',true,5242880,array['image/jpeg','image/png','image/webp']),
 ('website-assets','website-assets',true,5242880,array['image/jpeg','image/png','image/webp']),
 ('receipt-assets','receipt-assets',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "public read published image assets" on storage.objects;
create policy "public read published image assets" on storage.objects for select to anon, authenticated
using (bucket_id in ('achievement-photos','website-assets'));

drop policy if exists "staff manage app storage" on storage.objects;
create policy "staff manage app storage" on storage.objects for all to authenticated
using (bucket_id in ('student-photos','achievement-photos','website-assets','receipt-assets') and public.is_staff())
with check (bucket_id in ('student-photos','achievement-photos','website-assets','receipt-assets') and public.is_staff());
