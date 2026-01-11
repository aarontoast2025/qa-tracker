-- Add reply feature to chat
-- Run this in your Supabase SQL Editor

-- 1. Add reply_to_id column to track which message this is replying to
alter table public.user_chats 
add column if not exists reply_to_id uuid references public.user_chats(id) on delete set null;

-- 2. Create index for better performance when fetching replies
create index if not exists user_chats_reply_to_id_idx on public.user_chats (reply_to_id);

-- 3. Verify the column was added
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'user_chats' and column_name = 'reply_to_id';
