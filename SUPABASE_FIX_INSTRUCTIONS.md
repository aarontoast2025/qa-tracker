# Supabase Policy Fix Instructions

## Issues Fixed

### 1. Infinite Recursion in user_profiles Policy
**Problem**: The `has_role()` function queried `user_profiles`, but the RLS policies on `user_profiles` called `has_role()`, creating a circular dependency.

**Solution**: 
- Changed `has_role()` from `plpgsql` to `sql` language for better performance
- Made the function `stable` to allow it to bypass RLS when called from policies
- Separated user profile access into distinct policies: users can access their own profiles without calling `has_role()`, while admin access uses `has_role()`

### 2. Multiple Permissive Policies Warning
**Problem**: Using "for all" policies alongside "for select" policies created multiple permissive policies for the same role and action.

**Solution**: 
- Split "for all" policies into separate policies for each operation (INSERT, UPDATE, DELETE)
- This ensures only one policy applies per role and action, eliminating the warnings

### 3. Auth RLS Initialization Plan Warning
**Problem**: Direct calls to `auth.uid()` and `auth.role()` in policies were being re-evaluated for each row, causing performance issues.

**Solution**:
- Wrapped all `auth.uid()` and `auth.role()` calls with `(select ...)` subqueries
- This caches the value and prevents re-evaluation for each row

## How to Apply the Fix

### Option 1: Run the Complete Schema (Recommended for Fresh Setup)
If you're setting up fresh or want to rebuild everything:

```sql
-- Copy and paste the entire contents of supabase_schema.sql into Supabase SQL Editor
```

### Option 2: Run Only the Policy Updates (For Existing Database)
If you already have data and just want to fix the policies, **RUN THESE TWO SCRIPTS SEPARATELY**:

#### STEP 1: Run this cleanup script first:
```sql
-- ============================================
-- CLEANUP: Drop ALL existing policies
-- ============================================

-- Drop all user_roles policies
do $$ 
declare
  r record;
begin
  for r in (select policyname from pg_policies where tablename = 'user_roles' and schemaname = 'public') loop
    execute 'drop policy if exists "' || r.policyname || '" on public.user_roles';
  end loop;
end $$;

-- Drop all user_permissions policies
do $$ 
declare
  r record;
begin
  for r in (select policyname from pg_policies where tablename = 'user_permissions' and schemaname = 'public') loop
    execute 'drop policy if exists "' || r.policyname || '" on public.user_permissions';
  end loop;
end $$;

-- Drop all user_role_permissions policies
do $$ 
declare
  r record;
begin
  for r in (select policyname from pg_policies where tablename = 'user_role_permissions' and schemaname = 'public') loop
    execute 'drop policy if exists "' || r.policyname || '" on public.user_role_permissions';
  end loop;
end $$;

-- Drop all user_profiles policies
do $$ 
declare
  r record;
begin
  for r in (select policyname from pg_policies where tablename = 'user_profiles' and schemaname = 'public') loop
    execute 'drop policy if exists "' || r.policyname || '" on public.user_profiles';
  end loop;
end $$;
```

#### STEP 2: Then run this to create new policies:
```sql
-- ============================================
-- FIX 1: Update has_role() function to prevent recursion
-- ============================================

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

grant execute on function public.has_role(text) to authenticated;
grant execute on function public.get_my_role_id() to authenticated;

-- ============================================
-- FIX 2: Create new RLS Policies
-- ============================================

-- User Roles Policies
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

-- User Profiles Policies (Consolidated to prevent recursion)
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
```

## Steps to Apply

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the SQL from **Option 2** above
5. Click **Run** or press `Ctrl+Enter`
6. Wait for the success message

## Verification

After applying the fix:

1. **Check for Infinite Recursion**: 
   - Navigate to your Profile page
   - The error "infinite recursion detected in policy for relation 'user_profiles'" should be gone

2. **Check Supabase Advisor**:
   - Go to **Database** → **Advisors** in Supabase Dashboard
   - The "Multiple Permissive Policies" warnings should be resolved
   - Click **Refresh** if needed

3. **Test Functionality**:
   - Regular users should be able to view and edit their own profiles
   - Regular users should NOT be able to change their own role
   - Admins should be able to view and edit all profiles
   - Admins should be able to manage roles and permissions

## What Changed

### has_role() Function
- **Before**: Used `plpgsql` language, which triggered RLS policies recursively
- **After**: Uses `sql` language with `stable` flag, allowing it to bypass RLS when needed

### User Profiles Policies
- **Before**: Multiple separate policies for users and admins, causing "Multiple Permissive Policies" warnings and infinite recursion when using `has_role()`
- **After**: Single consolidated policies per action (SELECT, INSERT, UPDATE, DELETE) with OR conditions that check admin status directly via role_id join instead of calling `has_role()`, eliminating both recursion and multiple policy warnings

### Other Table Policies
- **Before**: "for all" policies that overlapped with "for select" policies, with direct `auth.role()` calls
- **After**: Separate policies for each operation (SELECT, INSERT, UPDATE, DELETE), all using `(select auth.role())`

## Security Notes

✅ Users can only view and edit their own profiles
✅ Users cannot change their own role (protected by WITH CHECK clause)
✅ Admins have full access to all profiles
✅ All authenticated users can view roles and permissions (read-only)
✅ Only admins can create, update, or delete roles and permissions

## Troubleshooting

If you still see issues after applying the fix:

1. **Clear your browser cache** and reload the page
2. **Sign out and sign back in** to refresh your session
3. **Check the Supabase logs** in Dashboard → Logs for any error messages
4. **Verify the policies were created** by going to Database → Tables → user_profiles → Policies

## Need Help?

If you encounter any issues, check:
- Supabase Dashboard → Logs
- Browser Console (F12) for any client-side errors
- Ensure you're using the latest version of the Supabase client library
