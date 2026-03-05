
-- Add private group support
ALTER TABLE public.community_groups 
  ADD COLUMN is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN invite_code text UNIQUE DEFAULT NULL;

-- Function to generate a random 6-char invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT upper(substr(md5(random()::text), 1, 6))
$$;

-- Security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Security definer function to find group by invite code
CREATE OR REPLACE FUNCTION public.find_group_by_code(_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.community_groups
  WHERE invite_code = upper(trim(_code))
  LIMIT 1
$$;

-- Drop old SELECT policy and create new one that respects privacy
DROP POLICY "Anyone can view groups" ON public.community_groups;

CREATE POLICY "Users can view public or joined groups"
  ON public.community_groups FOR SELECT
  TO authenticated
  USING (
    is_private = false 
    OR created_by = auth.uid() 
    OR public.is_group_member(auth.uid(), id)
  );

-- Also restrict questions visibility to groups user can see
DROP POLICY "Anyone can view questions" ON public.community_questions;

CREATE POLICY "Users can view questions from accessible groups"
  ON public.community_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_groups g
      WHERE g.id = group_id
      AND (g.is_private = false OR g.created_by = auth.uid() OR public.is_group_member(auth.uid(), g.id))
    )
  );

-- Restrict votes visibility similarly  
DROP POLICY "Anyone can view votes" ON public.community_votes;

CREATE POLICY "Users can view votes from accessible questions"
  ON public.community_votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_questions q
      JOIN public.community_groups g ON g.id = q.group_id
      WHERE q.id = question_id
      AND (g.is_private = false OR g.created_by = auth.uid() OR public.is_group_member(auth.uid(), g.id))
    )
  );
