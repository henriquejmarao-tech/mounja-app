REVOKE EXECUTE ON FUNCTION public.sync_profile_next_dose_on_schedule_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_next_dose_on_injection_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.advance_missed_dose_schedules() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_next_dose_scheduled_at(uuid, boolean, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.next_preferred_dose_at(time, timestamptz) FROM PUBLIC, anon, authenticated;