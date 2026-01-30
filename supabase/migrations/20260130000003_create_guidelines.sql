-- Create guidelines table
create table public.guidelines (
  id uuid not null default gen_random_uuid (),
  topic text not null, -- e.g., 'Case Notes', 'Escalations'
  title text not null, -- e.g., 'Template', 'Expert Team Process'
  content text null,   -- The actual template or short instruction
  description text null, -- The long definition/explanation
  skill text null,     -- e.g., 'Payroll', 'POS Device'
  tags text[] null,    -- For connecting related guidelines
  
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  
  constraint guidelines_pkey primary key (id)
) TABLESPACE pg_default;

-- Create trigger for updated_at
create trigger update_guidelines_modtime BEFORE
update on guidelines for EACH row
execute FUNCTION update_modified_column ();

-- Enable RLS
alter table public.guidelines enable row level security;

-- Policies (Standard authenticated access for now)
create policy "Authenticated users can select guidelines"
  on public.guidelines for select
  to authenticated
  using (true);

create policy "Authenticated users can insert guidelines"
  on public.guidelines for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update guidelines"
  on public.guidelines for update
  to authenticated
  using (true);

create policy "Authenticated users can delete guidelines"
  on public.guidelines for delete
  to authenticated
  using (true);
