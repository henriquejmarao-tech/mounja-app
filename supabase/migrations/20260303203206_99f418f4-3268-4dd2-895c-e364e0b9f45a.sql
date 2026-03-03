ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS health_info_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS routine_completed boolean DEFAULT false;