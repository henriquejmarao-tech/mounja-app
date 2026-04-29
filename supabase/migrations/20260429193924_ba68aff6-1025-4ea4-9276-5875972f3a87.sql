DROP TRIGGER IF EXISTS trg_sync_profile_next_dose_on_injection_change ON public.injections;
CREATE TRIGGER trg_sync_profile_next_dose_on_injection_change
AFTER INSERT OR UPDATE OR DELETE ON public.injections
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_next_dose_on_injection_change();