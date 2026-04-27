CREATE OR REPLACE FUNCTION public.sync_profile_next_dose_on_schedule_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.preferred_application_time IS DISTINCT FROM OLD.preferred_application_time THEN
    UPDATE public.profiles
    SET next_dose_scheduled_at = public.next_preferred_dose_at(NEW.preferred_application_time, now())
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

REVOKE EXECUTE ON FUNCTION public.sync_profile_next_dose_on_schedule_change() FROM PUBLIC, anon, authenticated;