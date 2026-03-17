ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_seen boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_plan text DEFAULT null;