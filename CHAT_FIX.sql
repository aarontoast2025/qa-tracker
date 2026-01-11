-- OPTIMIZED Fix for Chat Delete, Edit, and Clear functionality
-- Run this in your Supabase SQL Editor

-- 1. Add updated_at column if it doesn't exist
alter table public.user_chats 
add column if not exists updated_at timestamp with time zone;

-- 2. Add DELETE policy - Users can delete messages they SENT or RECEIVED
-- This allows for both individual message deletion and clearing entire conversations
drop policy if exists "Users can delete their own sent messages" on public.user_chats;
drop policy if exists "Users can delete their own messages" on public.user_chats;
create policy "Users can delete their own messages"
  on public.user_chats for delete
  using (
    (select auth.uid()) = sender_id OR (select auth.uid()) = receiver_id
  );

-- 3. REPLACE the old UPDATE policy with a combined one
-- This eliminates the "multiple permissive policies" warning
drop policy if exists "Users can update their own received chats" on public.user_chats;
drop policy if exists "Users can update their own sent messages" on public.user_chats;
drop policy if exists "Users can update their own chats" on public.user_chats;

-- Single optimized UPDATE policy that handles both cases:
-- - Senders can update their own messages (for editing content)
-- - Receivers can update messages sent to them (for marking as read)
create policy "Users can update their own chats"
  on public.user_chats for update
  using (
    (select auth.uid()) = sender_id OR (select auth.uid()) = receiver_id
  )
  with check (
    (select auth.uid()) = sender_id OR (select auth.uid()) = receiver_id
  );

-- 4. Verify all policies
select 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies 
where tablename = 'user_chats'
order by cmd, policyname;
