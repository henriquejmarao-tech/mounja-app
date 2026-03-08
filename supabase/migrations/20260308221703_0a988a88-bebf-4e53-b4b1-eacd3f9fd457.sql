
-- Create meal_logs table
CREATE TABLE public.meal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  photo_url TEXT,
  description TEXT,
  calories INTEGER,
  protein NUMERIC,
  fiber NUMERIC,
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own meals" ON public.meal_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals" ON public.meal_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meals" ON public.meal_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals" ON public.meal_logs FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for meal photos
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-photos', 'meal-photos', true);

-- Storage RLS policies
CREATE POLICY "Users can upload meal photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view meal photos" ON storage.objects FOR SELECT USING (bucket_id = 'meal-photos');
CREATE POLICY "Users can delete own meal photos" ON storage.objects FOR DELETE USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
