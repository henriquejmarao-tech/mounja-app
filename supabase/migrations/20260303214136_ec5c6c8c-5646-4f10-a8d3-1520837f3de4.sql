
CREATE TABLE public.workout_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD'),
  warmup TEXT,
  main_workout TEXT,
  cooldown TEXT,
  duration_minutes INTEGER,
  intensity TEXT,
  focus_area TEXT,
  tip TEXT,
  context_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.workout_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own workout suggestions"
  ON public.workout_suggestions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout suggestions"
  ON public.workout_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout suggestions"
  ON public.workout_suggestions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
