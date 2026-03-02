
CREATE TABLE public.diet_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  breakfast TEXT,
  lunch TEXT,
  dinner TEXT,
  snack TEXT,
  calories_target INTEGER,
  protein_target INTEGER,
  tip TEXT,
  context_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.diet_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diet suggestions" ON public.diet_suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own diet suggestions" ON public.diet_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own diet suggestions" ON public.diet_suggestions FOR DELETE USING (auth.uid() = user_id);
