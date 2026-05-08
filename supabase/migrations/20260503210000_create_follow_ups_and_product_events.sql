create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  appointment_id uuid,
  triage_assessment_id uuid references public.triage_assessments(id) on delete set null,
  status text default 'pending' check (status in ('pending', 'completed', 'skipped')),
  scheduled_for timestamptz default now() + interval '2 days',
  response jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.follow_ups enable row level security;

create policy "Patients can manage their own follow ups"
on public.follow_ups
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  properties jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.product_events enable row level security;

create policy "Users can insert their own product events"
on public.product_events
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Admins can read product events"
on public.product_events
for select
to authenticated
using (has_role('admin', auth.uid()));
