-- Create the new audit_evaluations table
create table public.audit_evaluations (
  id uuid not null default gen_random_uuid (),
  form_id uuid null, -- No strict FK enforced to allow flexibility, or could FK to form_templates
  interaction_id text null,
  advocate_name text null,
  call_ani text null,
  case_number text null,
  call_duration text null,
  date_interaction timestamp with time zone null,
  date_evaluation timestamp with time zone null default now(),
  case_category text null,
  issue_concern text null,
  source_url text null,
  form_data jsonb null, -- Stores the array of items
  status text null default 'completed'::text,
  qa_score numeric null,
  
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  
  constraint audit_evaluations_pkey primary key (id)
) TABLESPACE pg_default;

-- Create trigger for updated_at
create trigger update_audit_evaluations_modtime BEFORE
update on audit_evaluations for EACH row
execute FUNCTION update_modified_column ();

-- Enable RLS
alter table public.audit_evaluations enable row level security;

-- Create public policies (since the bookmarklet is public)
-- Allow anyone to insert
create policy "Public insert access"
  on public.audit_evaluations
  for insert
  to anon, authenticated
  with check (true);

-- Allow anyone to update (if they have the ID, handled by API usually)
create policy "Public update access"
  on public.audit_evaluations
  for update
  to anon, authenticated
  using (true);

-- Allow anyone to select (needed for check existing)
create policy "Public select access"
  on public.audit_evaluations
  for select
  to anon, authenticated
  using (true);
