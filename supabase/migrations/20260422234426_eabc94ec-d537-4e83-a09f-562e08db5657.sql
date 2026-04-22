create table if not exists public.founder_user_metadata (
  user_id uuid primary key references auth.users(id) on delete cascade,
  instagram_handle text,
  whatsapp text,
  notes text,
  talked_at timestamptz,
  contacted_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.founder_user_metadata enable row level security;

-- Sem policies: nenhum role authenticated/anon acessa.
-- Apenas service_role (usado pelas edge functions admin) pode ler/escrever.

create or replace function public.touch_founder_user_metadata_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_founder_user_metadata_touch on public.founder_user_metadata;

create trigger trg_founder_user_metadata_touch
  before update on public.founder_user_metadata
  for each row execute function public.touch_founder_user_metadata_updated_at();

create index if not exists idx_founder_user_metadata_talked_at
  on public.founder_user_metadata(talked_at desc nulls last);