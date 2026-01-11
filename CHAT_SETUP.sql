-- 1. Create the user_chats table
create table if not exists public.user_chats (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.user_profiles(id) on delete cascade not null,
  receiver_id uuid references public.user_profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security
alter table public.user_chats enable row level security;

-- 2.5 Set Replica Identity to FULL for Realtime
alter table public.user_chats replica identity full;

-- 3. Optimized RLS Policies
-- Using (select auth.uid()) prevents re-evaluation for every row, improving performance.

-- Users can only see messages where they are either the sender or the receiver
drop policy if exists "Users can view their own chats" on public.user_chats;
create policy "Users can view their own chats"
  on public.user_chats for select
  using ((select auth.uid()) = sender_id or (select auth.uid()) = receiver_id);

-- Users can only insert messages as themselves
drop policy if exists "Users can insert their own chats" on public.user_chats;
create policy "Users can insert their own chats"
  on public.user_chats for insert
  with check ((select auth.uid()) = sender_id);

-- Users can mark messages they RECEIVED as read
drop policy if exists "Users can update their own received chats" on public.user_chats;
create policy "Users can update their own received chats"
  on public.user_chats for update
  using ((select auth.uid()) = receiver_id)
  with check ((select auth.uid()) = receiver_id);

-- 4. Enable Realtime for this table (Safely)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'user_chats'
  ) then
    alter publication supabase_realtime add table public.user_chats;
  end if;
end $$;

-- 5. Performance Indexes
create index if not exists user_chats_participants_idx on public.user_chats (sender_id, receiver_id);
create index if not exists user_chats_created_at_idx on public.user_chats (created_at);

-- 6. 30-Day Auto-Deletion (using pg_cron)
create extension if not exists pg_cron;

-- Unschedule first if it exists to avoid errors on re-run
select cron.unschedule('purge-old-chats') 
where exists (select 1 from cron.job where jobname = 'purge-old-chats');

select cron.schedule(
  'purge-old-chats',
  '0 0 * * *', -- Every day at midnight
  $$ delete from public.user_chats where created_at < now() - interval '30 days' $$
);

-- 7. Grant access to authenticated users
grant all on table public.user_chats to authenticated;