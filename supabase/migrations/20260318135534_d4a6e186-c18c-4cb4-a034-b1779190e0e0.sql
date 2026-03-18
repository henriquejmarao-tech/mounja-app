
CREATE TABLE public.premium_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'promo',
  promo_code text,
  status text NOT NULL DEFAULT 'active',
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, promo_code)
);

ALTER TABLE public.premium_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own premium access"
  ON public.premium_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
