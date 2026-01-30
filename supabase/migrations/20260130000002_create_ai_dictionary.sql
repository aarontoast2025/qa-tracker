create table public.ai_dictionary_terms (
  id uuid not null default gen_random_uuid (),
  term text not null,
  definition text null,
  
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  
  constraint ai_dictionary_terms_pkey primary key (id),
  constraint ai_dictionary_terms_term_key unique (term)
) TABLESPACE pg_default;

-- Create trigger for updated_at
create trigger update_ai_dictionary_terms_modtime BEFORE
update on ai_dictionary_terms for EACH row
execute FUNCTION update_modified_column ();

-- Enable RLS
alter table public.ai_dictionary_terms enable row level security;

-- Public policies
create policy "Public select access dictionary"
  on public.ai_dictionary_terms
  for select
  to anon, authenticated
  using (true);

create policy "Public insert access dictionary"
  on public.ai_dictionary_terms
  for insert
  to anon, authenticated
  with check (true);

create policy "Public update access dictionary"
  on public.ai_dictionary_terms
  for update
  to anon, authenticated
  using (true);

create policy "Public delete access dictionary"
  on public.ai_dictionary_terms
  for delete
  to anon, authenticated
  using (true);
