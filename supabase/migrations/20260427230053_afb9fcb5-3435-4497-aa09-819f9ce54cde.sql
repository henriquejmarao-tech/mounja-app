ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_application_time time;

CREATE OR REPLACE VIEW public.scheduled_dose_reminder_candidates AS
WITH ranked_injections AS (
  SELECT
    i.user_id,
    i.date,
    i.dose,
    i.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY i.user_id
      ORDER BY i.date DESC, i.created_at DESC, i.id DESC
    ) AS rn
  FROM public.injections i
),
last_injections AS (
  SELECT
    user_id,
    dose,
    ((date::timestamp + COALESCE(created_at AT TIME ZONE 'America/Sao_Paulo', date::timestamp)::time) AT TIME ZONE 'America/Sao_Paulo') AS fallback_last_dose_at,
    date
  FROM ranked_injections
  WHERE rn = 1
)
SELECT
  li.user_id,
  li.dose,
  p.medication,
  ((li.date::timestamp + COALESCE(p.preferred_application_time, (li.fallback_last_dose_at AT TIME ZONE 'America/Sao_Paulo')::time)) AT TIME ZONE 'America/Sao_Paulo') AS last_dose_at,
  (((li.date + make_interval(days => COALESCE(p.application_interval_days, 7)))::timestamp + COALESCE(p.preferred_application_time, (li.fallback_last_dose_at AT TIME ZONE 'America/Sao_Paulo')::time)) AT TIME ZONE 'America/Sao_Paulo') AS scheduled_dose_at
FROM last_injections li
JOIN public.profiles p ON p.id = li.user_id;

ALTER VIEW public.scheduled_dose_reminder_candidates SET (security_invoker = true);