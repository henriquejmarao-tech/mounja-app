ALTER TABLE public.injections
ADD COLUMN IF NOT EXISTS applied_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS medication text;

UPDATE public.injections
SET applied_at = (date::timestamp + time '12:00') AT TIME ZONE 'America/Sao_Paulo'
WHERE applied_at IS NULL;

ALTER TABLE public.injections
ALTER COLUMN applied_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_injections_user_applied_at_desc
ON public.injections (user_id, applied_at DESC);

CREATE OR REPLACE FUNCTION public.sync_injection_date_from_applied_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.applied_at IS NULL THEN
    NEW.applied_at := (NEW.date::timestamp + time '12:00') AT TIME ZONE 'America/Sao_Paulo';
  END IF;

  NEW.date := (NEW.applied_at AT TIME ZONE 'America/Sao_Paulo')::date;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_injection_date_from_applied_at ON public.injections;
CREATE TRIGGER trg_sync_injection_date_from_applied_at
BEFORE INSERT OR UPDATE OF applied_at, date ON public.injections
FOR EACH ROW
EXECUTE FUNCTION public.sync_injection_date_from_applied_at();

CREATE OR REPLACE FUNCTION public.compute_next_dose_scheduled_at(_user_id uuid, _auto_advance boolean DEFAULT true, _from timestamp with time zone DEFAULT now())
RETURNS timestamp with time zone
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
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

  SELECT date, created_at, applied_at
  INTO last_injection
  FROM public.injections
  WHERE user_id = _user_id
  ORDER BY COALESCE(applied_at, (date::timestamp + time '12:00') AT TIME ZONE tz) DESC, created_at DESC, id DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN public.next_preferred_dose_at(profile_record.preferred_application_time, _from);
  END IF;

  dose_time := COALESCE(
    profile_record.preferred_application_time,
    (COALESCE(last_injection.applied_at, (last_injection.date::timestamp + time '12:00') AT TIME ZONE tz) AT TIME ZONE tz)::time,
    '12:00'::time
  );

  scheduled_at := ((((COALESCE(last_injection.applied_at, (last_injection.date::timestamp + time '12:00') AT TIME ZONE tz) AT TIME ZONE tz)::date + interval_days)::timestamp + dose_time) AT TIME ZONE tz);

  IF _auto_advance THEN
    WHILE scheduled_at < _from LOOP
      scheduled_at := scheduled_at + make_interval(days => interval_days);
    END LOOP;
  END IF;

  RETURN scheduled_at;
END;
$function$;