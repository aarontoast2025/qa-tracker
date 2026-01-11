-- 0. Cleanup old tables (from previous naming convention)
drop table if exists public.role_permissions;
drop table if exists public.permissions;
drop table if exists public.roles;

-- 1. Create user_roles table
create table if not exists public.user_roles (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create user_permissions table with grouping
create table if not exists public.user_permissions (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  code text unique not null, -- e.g., 'users.view'
  group_name text not null, -- e.g., 'User Management', 'Settings'
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create user_role_permissions join table
create table if not exists public.user_role_permissions (
  role_id uuid references public.user_roles(id) on delete cascade not null,
  permission_id uuid references public.user_permissions(id) on delete cascade not null,
  primary key (role_id, permission_id)
);

-- 3.5. Create user_direct_permissions table for granular user overrides
create table if not exists public.user_direct_permissions (
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  permission_id uuid references public.user_permissions(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, permission_id)
);

-- 4. Create or Update user_profiles table
create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  role_id uuid references public.user_roles(id),
  
  -- Personal Details
  first_name text,
  last_name text,
  middle_name text,
  personal_email text,
  home_address text,
  birthday date,
  mobile_number text,
  emergency_number text,
  emergency_person text,
  viber_number text,
  internet_provider text,
  internet_speed text,

  -- Employment Details
  company text,
  employee_id text,
  program text,
  nt_login text,
  company_email text,
  program_email text,
  zoom_id text,
  hire_date date,
  computer_name text,
  computer_type text, -- 'Laptop' or 'Desktop'
  vpn_ip text,
  ms_office_license text,
  unit_serial_number text,

  is_suspended boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Migration: Add role_id column and fix references if table existed
do $$
begin
  -- Add role_id if missing
  if not exists (select 1 from information_schema.columns where table_name='user_profiles' and column_name='role_id') then
    alter table public.user_profiles add column role_id uuid references public.user_roles(id);
  else
    -- Update reference in case it was pointing to the old 'roles' table
    alter table public.user_profiles drop constraint if exists user_profiles_role_id_fkey;
    alter table public.user_profiles add constraint user_profiles_role_id_fkey foreign key (role_id) references public.user_roles(id);
  end if;
end $$;

-- 5. Helper functions to check roles and permissions WITHOUT recursion
-- Uses security definer with explicit RLS bypass to prevent infinite recursion
create or replace function public.has_role(role_name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_profiles up
    join public.user_roles r on up.role_id = r.id
    where up.id = auth.uid() and r.name = role_name
  );
$$;

create or replace function public.get_my_role_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select role_id from public.user_profiles where id = auth.uid();
$$;

-- Grant execute permission to authenticated users
grant execute on function public.has_role(text) to authenticated;
grant execute on function public.get_my_role_id() to authenticated;

-- 6. Enable Row Level Security (RLS)
alter table public.user_roles enable row level security;
alter table public.user_permissions enable row level security;
alter table public.user_role_permissions enable row level security;
alter table public.user_profiles enable row level security;

-- 7. RLS Policies (Optimized to avoid multiple permissive policies and improve performance)

-- User Roles Policies
drop policy if exists "User roles access policy" on public.user_roles;
drop policy if exists "Admins can insert roles" on public.user_roles;
drop policy if exists "Admins can update roles" on public.user_roles;
drop policy if exists "Admins can delete roles" on public.user_roles;
drop policy if exists "Admins can manage roles" on public.user_roles;
drop policy if exists "Authenticated users can view roles" on public.user_roles;

create policy "User roles access policy"
  on public.user_roles for select
  using ( (select auth.role()) = 'authenticated' );

create policy "Admins can insert roles"
  on public.user_roles for insert
  with check ( public.has_role('Admin') );

create policy "Admins can update roles"
  on public.user_roles for update
  using ( public.has_role('Admin') );

create policy "Admins can delete roles"
  on public.user_roles for delete
  using ( public.has_role('Admin') );

-- User Permissions Policies
drop policy if exists "User permissions access policy" on public.user_permissions;
drop policy if exists "Admins can insert permissions" on public.user_permissions;
drop policy if exists "Admins can update permissions" on public.user_permissions;
drop policy if exists "Admins can delete permissions" on public.user_permissions;
drop policy if exists "Admins can manage permissions" on public.user_permissions;
drop policy if exists "Authenticated users can view permissions" on public.user_permissions;

create policy "User permissions access policy"
  on public.user_permissions for select
  using ( (select auth.role()) = 'authenticated' );

create policy "Admins can insert permissions"
  on public.user_permissions for insert
  with check ( public.has_role('Admin') );

create policy "Admins can update permissions"
  on public.user_permissions for update
  using ( public.has_role('Admin') );

create policy "Admins can delete permissions"
  on public.user_permissions for delete
  using ( public.has_role('Admin') );

-- User Role Permissions Policies
drop policy if exists "User role permissions access policy" on public.user_role_permissions;
drop policy if exists "Admins can insert role permissions" on public.user_role_permissions;
drop policy if exists "Admins can update role permissions" on public.user_role_permissions;
drop policy if exists "Admins can delete role permissions" on public.user_role_permissions;
drop policy if exists "Admins can manage role permissions" on public.user_role_permissions;

create policy "User role permissions access policy"
  on public.user_role_permissions for select
  using ( (select auth.role()) = 'authenticated' );

create policy "Admins can insert role permissions"
  on public.user_role_permissions for insert
  with check ( public.has_role('Admin') );

create policy "Admins can update role permissions"
  on public.user_role_permissions for update
  using ( public.has_role('Admin') );

create policy "Admins can delete role permissions"
  on public.user_role_permissions for delete
  using ( public.has_role('Admin') );

-- User Direct Permissions Policies
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

-- User Profiles Policies (Consolidated to prevent recursion and multiple permissive policies)
drop policy if exists "Profiles are viewable by owner or admins" on public.user_profiles;
drop policy if exists "Profiles can be inserted by owner or admins" on public.user_profiles;
drop policy if exists "Profiles are updatable by owner or admins" on public.user_profiles;
drop policy if exists "Only admins can delete profiles" on public.user_profiles;
drop policy if exists "Users can view own profile" on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;
drop policy if exists "Users can insert own profile" on public.user_profiles;
drop policy if exists "Admins can view all profiles" on public.user_profiles;
drop policy if exists "Admins can manage all profiles" on public.user_profiles;
drop policy if exists "Admins can insert profiles" on public.user_profiles;
drop policy if exists "Admins can update all profiles" on public.user_profiles;
drop policy if exists "Admins can delete profiles" on public.user_profiles;
drop policy if exists "Admins can view all profiles via role check" on public.user_profiles;

-- Single SELECT policy: Users can view own profile OR admins
create policy "Profiles are viewable by owner or admins"
  on public.user_profiles for select
  using ( 
    (select auth.uid()) = id 
    or public.has_role('Admin')
  );

-- Single INSERT policy: Users can insert own profile OR admins
create policy "Profiles can be inserted by owner or admins"
  on public.user_profiles for insert
  with check ( 
    (select auth.uid()) = id 
    or public.has_role('Admin')
  );

-- Single UPDATE policy: Users can update own profile (with role protection) OR admins
create policy "Profiles are updatable by owner or admins"
  on public.user_profiles for update
  using ( 
    (select auth.uid()) = id 
    or public.has_role('Admin')
  )
  with check ( 
    -- Admins can update anything
    public.has_role('Admin')
    or (
      -- Users can only update their own profile and cannot change their role
      (select auth.uid()) = id 
      and (
        role_id = public.get_my_role_id()
        or role_id is null
      )
    )
  );

-- DELETE policy: Only admins can delete profiles
create policy "Only admins can delete profiles"
  on public.user_profiles for delete
  using ( public.has_role('Admin') );

-- 8. Trigger function for new users
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  default_role_id uuid;
begin
  select id into default_role_id from public.user_roles where name = 'Viewer';
  
  insert into public.user_profiles (id, program_email, role_id)
  values (new.id, new.email, default_role_id);
  return new;
end;
$$;

-- Ensure trigger exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 9. Seed initial data and migrate existing users
insert into public.user_roles (name, description) values 
  ('Admin', 'Full access to all system features and settings.'),
  ('Editor', 'Can manage users and content but cannot change system settings.'),
  ('Viewer', 'Read-only access to most features.')
on conflict (name) do nothing;

-- Data Migration: Ensure existing users without a role get the Viewer role
update public.user_profiles 
set role_id = (select id from public.user_roles where name = 'Viewer')
where role_id is null;

insert into public.user_permissions (name, code, group_name, description) values 
  ('View Users', 'users.view', 'User Management', 'Ability to see the list of users'),
  ('Invite Users', 'users.invite', 'User Management', 'Ability to send invitations to new users'),
  ('Manage Roles', 'roles.manage', 'User Management', 'Ability to create and edit roles'),
  ('Access User Management', 'users.access', 'Access Control', 'Ability to access the User Management page'),
  ('Access Roles & Permissions', 'roles.access', 'Access Control', 'Ability to access the Roles & Permissions page'),
  ('View Profile', 'profile.view', 'Profile', 'Ability to view own profile'),
  ('Update Profile', 'profile.update', 'Profile', 'Ability to update own profile')
on conflict (code) do nothing;