ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS calories_goal integer DEFAULT 1650,
  ADD COLUMN IF NOT EXISTS protein_goal numeric DEFAULT 107,
  ADD COLUMN IF NOT EXISTS fiber_goal numeric DEFAULT 25,
  ADD COLUMN IF NOT EXISTS water_glasses_goal integer DEFAULT 11;