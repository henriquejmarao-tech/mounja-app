create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create table if not exists public.dose_reminders_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  scheduled_dose_at timestamp with time zone not null,
  sent_at timestamp with time zone not null default now(),
  unique (user_id, scheduled_dose_at)
);

alter table public.dose_reminders_sent enable row level security;

create index if not exists idx_dose_reminders_sent_user_scheduled
  on public.dose_reminders_sent (user_id, scheduled_dose_at);

create or replace view public.scheduled_dose_reminder_candidates as
with ranked_injections as (
  select
    i.user_id,
    i.date,
    i.dose,
    i.created_at,
    row_number() over (
      partition by i.user_id
      order by i.date desc, i.created_at desc, i.id desc
    ) as rn
  from public.injections i
),
last_injections as (
  select
    user_id,
    dose,
    ((date::timestamp + time '12:00') at time zone 'America/Sao_Paulo') as last_dose_at
  from ranked_injections
  where rn = 1
)
select
  li.user_id,
  li.dose,
  p.medication,
  li.last_dose_at,
  li.last_dose_at + make_interval(days => coalesce(p.application_interval_days, 7)) as scheduled_dose_at
from last_injections li
join public.profiles p on p.id = li.user_id;

alter view public.scheduled_dose_reminder_candidates set (security_invoker = true);