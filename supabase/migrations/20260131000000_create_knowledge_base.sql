-- Create knowledge base pages table
create table public.knowledge_base_pages (
  id uuid not null default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),
  title text not null default 'Untitled',
  content jsonb default '[]'::jsonb,
  icon text,
  cover_image text,
  is_published boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_base_pages_pkey primary key (id)
);

-- Enable RLS
alter table public.knowledge_base_pages enable row level security;

-- Create policies
create policy "Authenticated users can select knowledge base pages"
  on public.knowledge_base_pages for select
  to authenticated
  using (true);

create policy "Authenticated users can insert knowledge base pages"
  on public.knowledge_base_pages for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update knowledge base pages"
  on public.knowledge_base_pages for update
  to authenticated
  using (true);

create policy "Authenticated users can delete knowledge base pages"
  on public.knowledge_base_pages for delete
  to authenticated
  using (true);

-- Create trigger for updated_at
create trigger update_knowledge_base_pages_modtime
  before update on public.knowledge_base_pages
  for each row
  execute function public.update_modified_column();
