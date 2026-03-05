
-- Community groups table
CREATE TABLE public.community_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🌱',
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view groups
CREATE POLICY "Anyone can view groups"
  ON public.community_groups FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create groups
CREATE POLICY "Users can create groups"
  ON public.community_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Group memberships (also tracks hidden/visible for filtering)
CREATE TABLE public.community_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, group_id)
);

ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memberships"
  ON public.community_group_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join groups"
  ON public.community_group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memberships"
  ON public.community_group_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON public.community_group_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Community questions
CREATE TABLE public.community_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  question text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_questions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view questions
CREATE POLICY "Anyone can view questions"
  ON public.community_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create questions"
  ON public.community_questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own questions"
  ON public.community_questions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Community votes
CREATE TABLE public.community_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.community_questions(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('also_feel', 'dont_feel')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
  ON public.community_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can vote"
  ON public.community_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change vote"
  ON public.community_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Seed the 5 default groups
INSERT INTO public.community_groups (name, emoji, description) VALUES
  ('Iniciantes Mounjaro', '🌱', 'Para quem está começando o tratamento'),
  ('Meta: -10kg', '🎯', 'Juntos rumo ao objetivo'),
  ('Treino + Mounjaro', '💪', 'Exercícios durante o tratamento'),
  ('Receitas Low Carb', '🥗', 'Receitas que funcionam'),
  ('Bem-estar mental', '🧘', 'Cuidando da mente também');
