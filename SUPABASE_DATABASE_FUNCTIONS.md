# Supabase User Deletion Guide

This document explains the critical issues and considerations when deleting users in the QA Tracker application.

## Table of Contents
- [Critical Issue: Orphaned Records](#critical-issue-orphaned-records)
- [Database Functions and Triggers](#database-functions-and-triggers)
- [Proper User Deletion Process](#proper-user-deletion-process)
- [Foreign Key Relationships](#foreign-key-relationships)
- [Performance Warning: Multiple RLS Policies](#performance-warning-multiple-rls-policies)

---

## Critical Issue: Orphaned Records

### The Problem

**When you delete a user from Supabase Authentication > Users UI, it WILL leave orphaned records in the database.**

#### Why This Happens:

1. **Supabase Auth UI uses the Admin API** (`supabase.auth.admin.deleteUser()`)
2. **This only deletes from `auth.users`**, not from your application tables
3. **Database CASCADE constraints are NOT triggered** by the Auth API
4. **The `protect_admin_profiles` trigger blocks manual deletion** attempts

#### Result:
- ✅ User deleted from `auth.users`
- ❌ Record remains in `user_profiles` (orphaned)
- ❌ Related records remain in `user_chats`, `user_direct_permissions`, etc.

### Example of Orphaned Record:

```
User: Gon Lee
ID: 4e652ce2-d301-4b96-b865-94c83dcf6c6c
Status: Deleted from auth.users but still exists in user_profiles
Related Records: 23 chat messages still in database
```

---

## Database Functions and Triggers

### Overview of Database Functions

The following functions are defined in the `public` schema:

| Function Name | Type | Return Type | Security | Purpose |
|--------------|------|-------------|----------|---------|
| `delete_user_sessions` | Function | void | Definer | Forces user logout by deleting sessions |
| `get_my_role_id` | Function | uuid | Definer | Returns the role_id of the current authenticated user |
| `handle_new_user` | Trigger Function | trigger | Definer | Automatically creates user_profile when new auth user is created |
| `has_permission` | Function | boolean | Definer | Checks if user has a specific permission code |
| `has_role` | Function | boolean | Definer | Checks if current user has a specific role |
| `is_current_user_admin` | Function | boolean | Definer | Checks if current user has Admin role |
| `protect_admin_profiles` | Trigger Function | trigger | Definer | **BLOCKS deletion of admin profiles** |
| `send_email_bridge` | Function | jsonb | Definer | Forwards email events to Next.js API |
| `update_role_permissions_atomic` | Function | void | Definer | Atomic update of role permissions to prevent data loss |

### Complete SQL Definitions

#### 1. `delete_user_sessions` Function

**Purpose:** Forces a user to log out by deleting all their active sessions from the database.

**Arguments:** `p_user_id uuid`

**Return Type:** `void`

**Security:** `SECURITY DEFINER` (Restricted to `service_role`)

**Language:** `plpgsql`

```sql
CREATE OR REPLACE FUNCTION delete_user_sessions(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Delete from auth.sessions
  DELETE FROM auth.sessions WHERE user_id = p_user_id;
  
  -- Also delete from auth.refresh_tokens just to be safe
  DELETE FROM auth.refresh_tokens WHERE session_id NOT IN (SELECT id FROM auth.sessions);
END;
$$;
```

**Usage:**
- Called by the `forceLogoutUser` server action
- Permissions: `REVOKE EXECUTE FROM public`, `GRANT EXECUTE TO service_role`

---

#### 2. `get_my_role_id` Function

**Purpose:** Returns the role_id of the current authenticated user from their profile.

**Return Type:** `uuid`

**Security:** `SECURITY DEFINER`

```sql
CREATE OR REPLACE FUNCTION get_my_role_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role_id FROM public.user_profiles WHERE id = auth.uid();
$$;
```

**Usage in RLS Policies:**
- Used in UPDATE policy for `user_profiles` to ensure users can only update their own role or keep it unchanged

---

#### 3. `handle_new_user` Function

**Purpose:** Trigger function that automatically creates a user_profile record when a new user signs up through authentication.

**Return Type:** `trigger`

**Security:** `SECURITY DEFINER`

**Language:** `plpgsql`

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    default_role_id uuid;
BEGIN
    -- Get the default 'Viewer' role ID
    SELECT id INTO default_role_id FROM public.user_roles WHERE name = 'Viewer';
    
    -- Insert new user profile with default role
    INSERT INTO public.user_profiles (id, program_email, role_id)
    VALUES (new.id, new.email, default_role_id);
    
    RETURN new;
END;
$$;
```

**Trigger Configuration:**
```sql
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
```

**Behavior:**
- Fires AFTER a new user is inserted into `auth.users`
- Automatically creates corresponding record in `user_profiles`
- Assigns default "Viewer" role to new users
- Sets `program_email` to the auth email

---

#### 4. `has_permission` Function

**Purpose:** Checks if the current authenticated user has a specific permission, either through their assigned Role or via Direct Permissions.

**Arguments:** `perm_code text`

**Return Type:** `boolean`

**Security:** `SECURITY DEFINER`

**Language:** `plpgsql`

```sql
CREATE OR REPLACE FUNCTION has_permission(perm_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
  has_perm boolean;
BEGIN
  -- Allow service_role to bypass checks
  IF current_setting('role', true) = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- Check if user is Admin (Admins have all permissions)
  SELECT has_role('Admin') INTO is_admin;
  IF is_admin THEN
    RETURN true;
  END IF;

  -- Check if user has permission via Role OR Direct assignment
  SELECT EXISTS (
    -- Role Permissions
    SELECT 1
    FROM user_profiles up
    JOIN user_role_permissions urp ON up.role_id = urp.role_id
    JOIN user_permissions p ON urp.permission_id = p.id
    WHERE up.id = auth.uid() AND p.code = perm_code
    
    UNION ALL
    
    -- Direct Permissions
    SELECT 1
    FROM user_direct_permissions udp
    JOIN user_permissions p ON udp.permission_id = p.id
    WHERE udp.user_id = auth.uid() AND p.code = perm_code
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$;
```

**Usage in RLS Policies:**
- Replaces strict `has_role('Admin')` checks
- Used in `user_roles` and `user_role_permissions` policies to allow authorized non-admins to manage roles

---

#### 5. `has_role` Function

**Purpose:** Checks if the current authenticated user has a specific role by name.

**Arguments:** `role_name text`

**Return Type:** `boolean`

**Security:** `SECURITY DEFINER`

**Language:** `sql`

```sql
CREATE OR REPLACE FUNCTION has_role(role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.user_roles r ON up.role_id = r.id
    WHERE up.id = auth.uid() AND r.name = role_name
  );
$$;
```

**Usage in RLS Policies:**
- Used extensively across all tables to check for Admin role
- Examples:
  - `has_role('Admin')` - Check if user is Admin
  - Used in SELECT, INSERT, UPDATE, DELETE policies

---

#### 6. `is_current_user_admin` Function

**Purpose:** Checks if the currently authenticated user has the Admin role. This is a convenience function that wraps `has_role('Admin')`.

**Return Type:** `boolean`

**Security:** `SECURITY DEFINER`

**Language:** `plpgsql`

```sql
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. If the role is service_role (used by server actions), allow it.
    -- We trust our server actions to have performed the necessary checks.
    IF (current_setting('role', true) = 'service_role') THEN
        RETURN TRUE;
    END IF;
    
    -- 2. Otherwise, check if the authenticated user has the Admin role
    RETURN EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN user_roles r ON up.role_id = r.id
        WHERE up.id = auth.uid() AND r.name = 'Admin'
    );
END;
$$;
```

**Special Behavior:**
- Returns `TRUE` if the current role is `service_role` (server-side operations)
- Otherwise checks if user has Admin role in `user_profiles`
- Allows server actions to bypass admin checks when needed

---

#### 7. `protect_admin_profiles` Function ⚠️ **DELETION BLOCKER**

**Purpose:** Trigger function that prevents deletion or modification of admin profiles by non-admin users.

**Return Type:** `trigger`

**Security:** `SECURITY DEFINER`

**Language:** `plpgsql`

```sql
CREATE OR REPLACE FUNCTION protect_admin_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_target_admin boolean;
    is_actor_admin boolean;
    admin_role_id uuid;
BEGIN
    -- ✅ FIX: Allow service_role to bypass this trigger completely
    IF current_setting('role', true) = 'service_role' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    -- Get Admin Role ID
    SELECT id INTO admin_role_id FROM user_roles WHERE name = 'Admin';
    
    -- 2. Check if target IS or WAS an admin
    IF (TG_OP = 'DELETE') THEN
        is_target_admin := (OLD.role_id = admin_role_id);
    ELSE
        -- For UPDATE/INSERT
        is_target_admin := (OLD.role_id = admin_role_id) OR (NEW.role_id = admin_role_id);
    END IF;
    
    -- If not dealing with admin profile, allow operation
    IF NOT is_target_admin THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;
    
    -- 3. Check if actor is admin
    is_actor_admin := EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN user_roles r ON up.role_id = r.id
        WHERE up.id = auth.uid() AND r.name = 'Admin'
    );
    
    -- 4. If target is admin but actor is not, block the operation
    IF is_target_admin AND NOT is_actor_admin THEN
        RAISE EXCEPTION 'Only administrators can modify or delete admin profiles';
    END IF;
    
    -- Allow operation if actor is admin
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;
```

**Trigger Configuration:**
```sql
CREATE TRIGGER tr_protect_admin_profiles
    BEFORE DELETE OR UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_admin_profiles();
```

**Behavior:**
- Fires BEFORE DELETE or UPDATE operations on `user_profiles`
- Checks if target user is/was an Admin
- Checks if current user (actor) is an Admin
- **BLOCKS operation if:**
  - Target is Admin AND
  - Actor is NOT Admin
- **ALLOWS operation if:**
  - Target is not Admin, OR
  - Actor is Admin

**Impact on Deletion:**
- ✅ Protects admin accounts from unauthorized deletion
- ❌ Blocks cleanup of orphaned admin records
- ❌ Prevents CASCADE deletions that involve admin profiles
- ⚠️ Must be temporarily disabled to clean up orphaned records

**Workaround for Orphaned Records:**
```sql
-- Temporarily disable trigger
ALTER TABLE user_profiles DISABLE TRIGGER tr_protect_admin_profiles;

-- Perform deletion
DELETE FROM user_profiles WHERE id = '<orphaned-user-id>';

-- Re-enable trigger
ALTER TABLE user_profiles ENABLE TRIGGER tr_protect_admin_profiles;
```

---

#### 8. `send_email_bridge` Function

**Purpose:** Forwards email-related events from Supabase to your Next.js API endpoint for processing.

**Arguments:** `event jsonb`

**Return Type:** `jsonb`

**Security:** `SECURITY DEFINER`

**Language:** `plpgsql`

```sql
CREATE OR REPLACE FUNCTION send_email_bridge(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This forwards the email payload to your Next.js API
    -- Ensure the URL is correct.
    PERFORM net.http_post(
        url := 'https://qa-tracker-toast.vercel.app/api/auth/hooks/send-email',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := event
    );
    
    -- Return a success response to Supabase Auth
    RETURN jsonb_build_object('status', 'success');
END;
$$;
```

**Purpose:**
- Integrates Supabase Auth email events with your Next.js application
- Forwards email payloads to your API endpoint
- Used for custom email handling (invitations, password resets, etc.)

**Configuration:**
- Requires `pg_net` extension for HTTP requests
- URL points to your deployed Next.js application
- Called by Supabase Auth hooks

---

#### 9. `update_role_permissions_atomic` Function

**Purpose:** Safely updates role permissions in a single atomic transaction. Deletes old permissions and inserts new ones.

**Arguments:** `p_role_id uuid`, `p_permission_ids uuid[]`

**Return Type:** `void`

**Security:** `SECURITY DEFINER`

**Language:** `plpgsql`

```sql
CREATE OR REPLACE FUNCTION update_role_permissions_atomic(
  p_role_id uuid,
  p_permission_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_perm_id uuid;
BEGIN
  -- Security Check: Ensure caller has permission
  IF NOT has_permission('roles.permission') AND NOT has_role('Admin') AND current_setting('role', true) <> 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions to manage role permissions.';
  END IF;

  -- 1. Delete existing permissions
  DELETE FROM user_role_permissions
  WHERE role_id = p_role_id;

  -- 2. Insert new permissions
  IF p_permission_ids IS NOT NULL AND array_length(p_permission_ids, 1) > 0 THEN
    FOREACH v_perm_id IN ARRAY p_permission_ids
    LOOP
      INSERT INTO user_role_permissions (role_id, permission_id)
      VALUES (p_role_id, v_perm_id);
    END LOOP;
  END IF;
END;
$$;
```

**Usage:**
- Called by `updateRolePermissions` server action
- Prevents data loss if the insert fails after delete


---

### The `protect_admin_profiles` Trigger

**This is the main blocker preventing user deletion.**

#### Trigger Configuration:
```sql
Trigger Name: tr_protect_admin_profiles
Event: DELETE
Timing: BEFORE
Action: EXECUTE FUNCTION protect_admin_profiles()
```

#### Function Logic:
```plpgsql
DECLARE
    is_target_admin boolean;
    is_actor_admin boolean;
    admin_role_id uuid;
BEGIN
    -- Get Admin Role ID
    SELECT id INTO admin_role_id FROM user_roles WHERE name = 'Admin';
    
    -- Check if target IS or WAS an admin
    IF (TG_OP = 'DELETE') THEN
        is_target_admin := (OLD.role_id = admin_role_id);
    ELSE
        -- For UPDATE/INSERT
        is_target_admin := (OLD.role_id = admin_role_id) OR (NEW.role_id = admin_role_id);
    END IF;
    
    -- Check if actor is admin
    RETURN EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN user_roles ON up.role_id = r.id
        WHERE up.id = auth.uid() AND r.name = 'Admin'
    );
    
    -- If target is admin, prevent deletion unless actor is also admin
    IF is_target_admin THEN
        RAISE EXCEPTION 'Cannot delete admin profile';
    END IF;
    
    RETURN OLD;
END;
```

**This trigger prevents:**
- Deletion of admin profiles by non-admin users
- Accidental deletion of admin accounts
- Unauthorized profile removals

**However, it also blocks:**
- Cleanup of orphaned records
- Manual deletion attempts through SQL
- Cascade deletions from related tables

---

## Proper User Deletion Process

### ❌ WRONG: Using Supabase Authentication UI

**DO NOT** delete users through Supabase Dashboard > Authentication > Users

This will create orphaned records that are difficult to clean up.

### ✅ CORRECT: Using Application Delete Function

**Always use the application's "Remove User" feature** in the User Management page.

#### Recommended Implementation:

Thanks to the updated `protect_admin_profiles` trigger, the `service_role` can now directly delete users without complex workarounds.

```typescript
// RECOMMENDED (COMPLETE)
export async function deleteUser(userId: string) {
  try {
    const supabase = createAdminClient(); // Uses service_role key

    // 1. Delete from user_profiles FIRST (triggers CASCADE to related tables)
    // The service_role key bypasses RLS and the updated protect_admin_profiles trigger
    const { error: profileError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting user profile:", profileError);
      return { error: `Failed to delete user profile: ${profileError.message}` };
    }

    // 2. Delete from auth (removes login ability)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      return { error: `User profile deleted but auth deletion failed: ${authError.message}` };
    }

    revalidatePath("/user-management");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}
```

### Manual Cleanup of Orphaned Records

If orphaned records already exist, use this SQL to clean them up:

```sql
-- 1. Disable the protection trigger
ALTER TABLE user_profiles DISABLE TRIGGER tr_protect_admin_profiles;

-- 2. Delete the orphaned record (CASCADE will handle related tables)
DELETE FROM user_profiles WHERE id = '<orphaned-user-id>';

-- 3. Re-enable the protection trigger
ALTER TABLE user_profiles ENABLE TRIGGER tr_protect_admin_profiles;
```

---

## Foreign Key Relationships

### Tables Referencing `user_profiles`

| Table | Column | Foreign Key | Delete Rule | Impact |
|-------|--------|-------------|-------------|--------|
| `user_chats` | `sender_id` | `user_profiles.id` | **CASCADE** | Chat messages sent by user will be deleted |
| `user_chats` | `receiver_id` | `user_profiles.id` | **CASCADE** | Chat messages received by user will be deleted |
| `user_direct_permissions` | `user_id` | `user_profiles.id` | **CASCADE** | Direct permissions will be deleted |

### Foreign Keys FROM `user_profiles`

| Column | References | Delete Rule | Impact |
|--------|-----------|-------------|--------|
| `id` | `auth.users.id` | **CASCADE** | Profile should be deleted when auth user is deleted (but doesn't work via Auth API) |
| `role_id` | `user_roles.id` | **NO ACTION** | Cannot delete a role if users are assigned to it |

### Cascade Behavior

When you delete from `user_profiles` (with trigger disabled):
1. ✅ All `user_chats` where user is sender → **DELETED**
2. ✅ All `user_chats` where user is receiver → **DELETED**
3. ✅ All `user_direct_permissions` for user → **DELETED**
4. ✅ User's avatar in `storage.objects` → **Should be manually deleted**

---

## Performance Warning: Multiple RLS Policies

### Current Issue

Supabase shows this warning:

```
Multiple Permissive Policies Warning

Table public.user_profiles has multiple permissive policies for role 
authenticated for action SELECT. Policies include:
- "Basic profile info viewable for chat"
- "Profiles are viewable by owner or admins"

Multiple permissive policies are suboptimal for performance as each 
policy must be executed for every relevant query.
```

### The Two Policies

#### Policy 1: "Profiles are viewable by owner or admins"
```sql
((auth.uid() = id) OR has_role('Admin'::text))
```
- **Purpose:** Protect full profile access for profile pages
- **Allows:** Users to view their own profile OR admins to view all profiles

#### Policy 2: "Basic profile info viewable for chat"
```sql
true
```
- **Purpose:** Allow all authenticated users to see basic info for chat feature
- **Allows:** All authenticated users to read id, first_name, last_name, company_email

### Impact

- **Performance:** Slightly slower SELECT queries (usually negligible)
- **Functionality:** Everything works correctly
- **Security:** Provides layered access control

### Recommendation

**Option A: Keep Both Policies (Recommended)**
- Maintain the security distinction between full profile and basic info
- Accept the minor performance cost
- Only optimize if you notice actual performance issues

**Option B: Combine Policies (If Performance Critical)**
```sql
-- Drop existing policies
DROP POLICY "Profiles are viewable by owner or admins" ON user_profiles;
DROP POLICY "Basic profile info viewable for chat" ON user_profiles;

-- Create single combined policy
CREATE POLICY "user_profiles_select_policy" ON user_profiles
FOR SELECT TO authenticated
USING (true);
```

**Note:** Option B removes the distinction between full profile access and basic info access.

---

## Best Practices

### For Developers

1. **Never delete users through Supabase Auth UI** - Always use the application
2. **Update the `deleteUser` function** to handle trigger and cascade properly
3. **Test deletion thoroughly** in development before deploying
4. **Document any changes** to triggers or foreign keys
5. **Monitor for orphaned records** periodically

### For Database Administrators

1. **Backup before bulk deletions** - User data cannot be recovered
2. **Check for orphaned records** regularly:
   ```sql
   SELECT up.* FROM user_profiles up
   LEFT JOIN auth.users au ON up.id = au.id
   WHERE au.id IS NULL;
   ```
3. **Clean up orphaned records** using the manual process above
4. **Review trigger logic** if deletion requirements change

### For QA/Testing

1. **Test user deletion** in staging environment first
2. **Verify cascade deletion** works for all related tables
3. **Check that chat messages** are properly deleted
4. **Confirm no orphaned records** remain after deletion
5. **Test both admin and non-admin** user deletions

---

## Troubleshooting

### Issue: "Success. No rows returned" but record still exists

**Cause:** The `tr_protect_admin_profiles` trigger is blocking the deletion

**Solution:** Temporarily disable the trigger before deletion

### Issue: Cannot delete user - "foreign key constraint violation"

**Cause:** Related records exist in tables without CASCADE

**Solution:** Delete related records first, or add CASCADE to foreign keys

### Issue: Orphaned records accumulating

**Cause:** Users being deleted through Auth UI instead of application

**Solution:** 
1. Clean up existing orphaned records using manual process
2. Update application code to handle deletion properly
3. Train team to use application delete feature only

---

## Change Log

### 2024-01-XX - Initial Documentation
- Documented orphaned records issue
- Explained `protect_admin_profiles` trigger behavior
- Provided proper deletion process
- Added foreign key relationship details
- Documented RLS policy warning

---

## Related Documentation

- [SUPABASE_RLS_POLICIES.md](./SUPABASE_RLS_POLICIES.md) - Complete RLS policy documentation
- [User Management Actions](./app/(authenticated)/user-management/actions.ts) - Current implementation

---

**Last Updated:** 2024-01-XX
**Maintained By:** Development Team
