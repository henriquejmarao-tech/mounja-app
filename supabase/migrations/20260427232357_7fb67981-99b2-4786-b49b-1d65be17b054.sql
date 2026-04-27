ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS next_dose_scheduled_at timestamptz;

CREATE OR REPLACE FUNCTION public.next_preferred_dose_at(
  _preferred_time time,
  _from timestamptz DEFAULT now()
)
RETURNS timestamptz
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  tz CONSTANT text := 'America/Sao_Paulo';
  local_day date;
  dose_time time;
  candidate timestamptz;
BEGIN
  dose_time := COALESCE(_preferred_time, '12:00'::time);
  local_day := (_from AT TIME ZONE tz)::date;
  candidate := ((local_day::timestamp + dose_time) AT TIME ZONE tz);

  IF candidate <= _from THEN
    candidate := (((local_day + 1)::timestamp + dose_time) AT TIME ZONE tz);
  END IF;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_next_dose_scheduled_at(
  _user_id uuid,
  _auto_advance boolean DEFAULT true,
  _from timestamptz DEFAULT now()
)
RETURNS timestamptz
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  tz CONSTANT text := 'America/Sao_Paulo';
  profile_record record;
  last_injection record;
  interval_days integer;
  dose_time time;
  scheduled_at timestamptz;
BEGIN
  SELECT preferred_application_time, application_interval_days
  INTO profile_record
  FROM public.profiles
  WHERE id = _user_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  interval_days := GREATEST(COALESCE(profile_record.application_interval_days, 7), 1);

  SELECT date, created_at
  INTO last_injection
  FROM public.injections
  WHERE user_id = _user_id
  ORDER BY date DESC, created_at DESC, id DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN public.next_preferred_dose_at(profile_record.preferred_application_time, _from);
  END IF;

  dose_time := COALESCE(
    profile_record.preferred_application_time,
    (last_injection.created_at AT TIME ZONE tz)::time,
    '12:00'::time
  );

  scheduled_at := (((last_injection.date + interval_days)::timestamp + dose_time) AT TIME ZONE tz);

  IF _auto_advance THEN
    WHILE scheduled_at < _from LOOP
      scheduled_at := scheduled_at + make_interval(days => interval_days);
    END LOOP;
  END IF;

  RETURN scheduled_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_next_dose_on_schedule_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tz CONSTANT text := 'America/Sao_Paulo';
  base_day date;
  dose_time time;
  scheduled_at timestamptz;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.preferred_application_time IS DISTINCT FROM OLD.preferred_application_time THEN
    dose_time := COALESCE(NEW.preferred_application_time, '12:00'::time);
    base_day := CASE
      WHEN OLD.next_dose_scheduled_at IS NOT NULL AND OLD.next_dose_scheduled_at > now()
        THEN (OLD.next_dose_scheduled_at AT TIME ZONE tz)::date
      ELSE (now() AT TIME ZONE tz)::date
    END;

    scheduled_at := ((base_day::timestamp + dose_time) AT TIME ZONE tz);

    IF scheduled_at <= now() THEN
      scheduled_at := ((((now() AT TIME ZONE tz)::date + 1)::timestamp + dose_time) AT TIME ZONE tz);
    END IF;

    UPDATE public.profiles
    SET next_dose_scheduled_at = scheduled_at
    WHERE id = NEW.id;

    RETURN NULL;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.application_interval_days IS DISTINCT FROM OLD.application_interval_days THEN
    UPDATE public.profiles
    SET next_dose_scheduled_at = public.compute_next_dose_scheduled_at(NEW.id, true, now())
    WHERE id = NEW.id;

    RETURN NULL;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_next_dose_on_schedule_change ON public.profiles;
CREATE TRIGGER sync_profile_next_dose_on_schedule_change
AFTER UPDATE OF preferred_application_time, application_interval_days ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_next_dose_on_schedule_change();

CREATE OR REPLACE FUNCTION public.sync_profile_next_dose_on_injection_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_user_id uuid;
BEGIN
  affected_user_id := COALESCE(NEW.user_id, OLD.user_id);

  UPDATE public.profiles
  SET next_dose_scheduled_at = public.compute_next_dose_scheduled_at(affected_user_id, true, now())
  WHERE id = affected_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_next_dose_on_injection_insert ON public.injections;
CREATE TRIGGER sync_profile_next_dose_on_injection_insert
AFTER INSERT ON public.injections
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_next_dose_on_injection_change();

DROP TRIGGER IF EXISTS sync_profile_next_dose_on_injection_update ON public.injections;
CREATE TRIGGER sync_profile_next_dose_on_injection_update
AFTER UPDATE OF date, created_at, user_id ON public.injections
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_next_dose_on_injection_change();

DROP TRIGGER IF EXISTS sync_profile_next_dose_on_injection_delete ON public.injections;
CREATE TRIGGER sync_profile_next_dose_on_injection_delete
AFTER DELETE ON public.injections
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_next_dose_on_injection_change();

CREATE OR REPLACE FUNCTION public.advance_missed_dose_schedules()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  UPDATE public.profiles p
  SET next_dose_scheduled_at = public.compute_next_dose_scheduled_at(p.id, true, now())
  WHERE p.next_dose_scheduled_at IS NOT NULL
    AND p.next_dose_scheduled_at < (now() - interval '1 hour');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

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
    ((date::timestamp + COALESCE((created_at AT TIME ZONE 'America/Sao_Paulo')::time, '12:00'::time)) AT TIME ZONE 'America/Sao_Paulo') AS last_dose_at
  FROM ranked_injections
  WHERE rn = 1
)
SELECT
  p.id AS user_id,
  li.dose,
  p.medication,
  li.last_dose_at,
  p.next_dose_scheduled_at AS scheduled_dose_at
FROM public.profiles p
JOIN last_injections li ON li.user_id = p.id
WHERE p.next_dose_scheduled_at IS NOT NULL;

ALTER VIEW public.scheduled_dose_reminder_candidates SET (security_invoker = true);