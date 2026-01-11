-- Migration: Add New Granular Permissions
-- Run this in your Supabase SQL Editor

-- Insert new permissions
insert into public.user_permissions (name, code, group_name, description) values 
  ('Suspend Users', 'users.suspend', 'User Management', 'Ability to suspend and unsuspend users'),
  ('Update User Details', 'users.update', 'User Management', 'Ability to update personal and employment details of other users'),
  ('Manage User Accounts', 'users.account', 'User Management', 'Ability to update login email, system role, and send password resets'),
  ('Manage User Permissions', 'users.permission', 'User Management', 'Ability to assign granular permissions to users')
on conflict (code) do nothing;
