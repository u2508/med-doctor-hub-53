create table if not exists public.triage_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chief_complaint text,
  selected_symptoms text[] default '{}'::text[],
  patient_context jsonb default '{}'::jsonb,
  urgency text not null check (
    urgency in ('emergency', 'urgent', 'soon', 'routine', 'self_care')
  ),
  possible_conditions jsonb default '[]'::jsonb,
  recommended_specialty text,
  alternate_specialties text[] default '{}'::text[],
  reasoning text,
  red_flags text[] default '{}'::text[],
  self_care text[] default '{}'::text[],
  doctor_questions text[] default '{}'::text[],
  appointment_summary text,
  ai_disclaimer text,
  raw_ai_response jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.triage_assessments enable row level security;

create policy "Patients can insert their own triage assessments"
on public.triage_assessments
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Patients can view their own triage assessments"
on public.triage_assessments
for select
to authenticated
using (auth.uid() = user_id);

create policy "Patients can update their own triage assessments"
on public.triage_assessments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update on public.triage_assessments to authenticated;

alter table public.appointments
add column if not exists triage_assessment_id uuid references public.triage_assessments(id) on delete set null;
