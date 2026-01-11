-- Migration: Add User Direct Permissions
-- Run this in your Supabase SQL Editor

-- 1. Create the user_direct_permissions table for granular overrides
create table if not exists public.user_direct_permissions (
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  permission_id uuid references public.user_permissions(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, permission_id)
);

-- 2. Enable Row Level Security (RLS)
alter table public.user_direct_permissions enable row level security;

-- 3. Create RLS Policies
drop policy if exists "User direct permissions access policy" on public.user_direct_permissions;
drop policy if exists "Admins can insert direct permissions" on public.user_direct_permissions;
drop policy if exists "Admins can update direct permissions" on public.user_direct_permissions;
drop policy if exists "Admins can delete direct permissions" on public.user_direct_permissions;

create policy "User direct permissions access policy"
  on public.user_direct_permissions for select
  using ( (select auth.role()) = 'authenticated' );

create policy "Admins can insert direct permissions"
  on public.user_direct_permissions for insert
  with check ( public.has_role('Admin') );

create policy "Admins can update direct permissions"
  on public.user_direct_permissions for update
  using ( public.has_role('Admin') );

create policy "Admins can delete direct permissions"
  on public.user_direct_permissions for delete
  using ( public.has_role('Admin') );
