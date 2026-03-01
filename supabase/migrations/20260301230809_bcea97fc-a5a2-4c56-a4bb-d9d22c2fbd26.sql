-- Create profiles table (triage data)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  age integer,
  sex text,
  height_cm numeric,
  current_weight numeric,
  goal text,
  mounjaro_start_date date,
  current_dose text,
  application_frequency text,
  application_day text,
  has_medical_guidance boolean DEFAULT false,
  medical_specialty text,
  has_increased_dose boolean DEFAULT false,
  dose_increase_details text,
  appetite_effect integer DEFAULT 0,
  satiety_effect integer DEFAULT 0,
  compulsion_effect integer DEFAULT 0,
  common_side_effects jsonb DEFAULT '[]',
  side_effects_improvement text,
  side_effects_worsening text,
  health_conditions jsonb DEFAULT '[]',
  medications text,
  dietary_restrictions jsonb DEFAULT '[]',
  activity_level text DEFAULT 'sedentary',
  daily_water_ml integer,
  avg_sleep_hours numeric,
  weekly_workouts integer DEFAULT 0,
  tracking_preference text DEFAULT 'weekly',
  triage_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create injections table
CREATE TABLE public.injections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  dose text NOT NULL,
  site text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create daily_logs table
CREATE TABLE public.daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  weight numeric,
  waist_cm numeric,
  hip_cm numeric,
  body_fat_pct numeric,
  symptom_nausea integer DEFAULT 0,
  symptom_fatigue integer DEFAULT 0,
  symptom_headache integer DEFAULT 0,
  symptom_diarrhea integer DEFAULT 0,
  symptom_constipation integer DEFAULT 0,
  symptom_injection_pain integer DEFAULT 0,
  appetite integer DEFAULT 0,
  satiety integer DEFAULT 0,
  mood integer DEFAULT 0,
  energy integer DEFAULT 0,
  water_ml integer,
  workout_type text,
  workout_duration integer,
  food_quality text,
  food_notes text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.injections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Injections policies
CREATE POLICY "Users can view own injections" ON public.injections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own injections" ON public.injections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own injections" ON public.injections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own injections" ON public.injections FOR DELETE USING (auth.uid() = user_id);

-- Daily logs policies
CREATE POLICY "Users can view own logs" ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON public.daily_logs FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();