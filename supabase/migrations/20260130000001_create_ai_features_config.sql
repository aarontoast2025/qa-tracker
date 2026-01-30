create table public.ai_features_config (
  id uuid not null default gen_random_uuid (),
  feature_key text not null, -- e.g. 'summary', 'case_notes_checker'
  model_name text null,
  prompt_template text null,
  temperature numeric null default 0.7,
  
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  
  constraint ai_features_config_pkey primary key (id),
  constraint ai_features_config_key_unique unique (feature_key)
) TABLESPACE pg_default;

-- Create trigger for updated_at
create trigger update_ai_features_config_modtime BEFORE
update on ai_features_config for EACH row
execute FUNCTION update_modified_column ();

-- Enable RLS
alter table public.ai_features_config enable row level security;

-- Public policies (since bookmarklet is public/unauthenticated in this context, or we can secure it later)
-- For now, allow public access to read/write for simplicity with the bookmarklet
create policy "Public select access ai config"
  on public.ai_features_config
  for select
  to anon, authenticated
  using (true);

create policy "Public insert access ai config"
  on public.ai_features_config
  for insert
  to anon, authenticated
  with check (true);

create policy "Public update access ai config"
  on public.ai_features_config
  for update
  to anon, authenticated
  using (true);
