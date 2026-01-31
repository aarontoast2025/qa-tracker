-- Create a new storage bucket for knowledge base assets
insert into storage.buckets (id, name, public)
values ('knowledge_base_assets', 'knowledge_base_assets', true)
on conflict (id) do nothing;

-- Set up security policies for the bucket
create policy "Authenticated users can upload knowledge base assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'knowledge_base_assets');

create policy "Authenticated users can update their knowledge base assets"
on storage.objects for update
to authenticated
using (bucket_id = 'knowledge_base_assets');

create policy "Authenticated users can delete their knowledge base assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'knowledge_base_assets');

create policy "Anyone can view knowledge base assets"
on storage.objects for select
to public
using (bucket_id = 'knowledge_base_assets');
