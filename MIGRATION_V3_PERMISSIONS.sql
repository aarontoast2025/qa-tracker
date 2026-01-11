-- Migration: Refactor Permissions
-- Run this in your Supabase SQL Editor

-- 1. Remove redundant permissions
-- Note: Cascading deletes might be needed if these are referenced in user_role_permissions or user_direct_permissions.
-- We will delete them from permissions table, allowing cascade to clean up join tables.
delete from public.user_permissions 
where code in ('users.access', 'roles.access', 'roles.manage');

-- 2. Insert new Roles & Permissions permissions
insert into public.user_permissions (name, code, group_name, description) values 
  ('View Roles', 'roles.view', 'Access Control', 'Ability to view the list of system roles'),
  ('Add Roles', 'roles.add', 'Access Control', 'Ability to create new system roles'),
  ('Update Roles', 'roles.update', 'Access Control', 'Ability to edit existing system roles'),
  ('Delete Roles', 'roles.delete', 'Access Control', 'Ability to delete system roles'),
  ('Manage Role Permissions', 'roles.permission', 'Access Control', 'Ability to assign permissions to roles')
on conflict (code) do nothing;
