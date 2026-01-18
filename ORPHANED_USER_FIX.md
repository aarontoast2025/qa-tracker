# Fix for Orphaned User Records Issue

## Problem Summary

You're experiencing two related issues:

### Issue 1: Orphaned Records from Supabase Auth UI Deletion
When you delete a user through **Supabase Dashboard > Authentication > Users**, it:
- ✅ Deletes the user from `auth.users` 
- ❌ Does **NOT** delete from `user_profiles` (orphaned record)
- ❌ Does **NOT** delete related records in `user_chats`, `user_direct_permissions`, etc.

### Issue 2: Manual Deletion in Supabase Fails Silently
When you try to delete the orphaned record directly in Supabase Table Editor:
- Shows "Successfully deleted"
- ❌ Record still exists (not actually deleted)

## Root Cause

The `protect_admin_profiles` trigger is blocking the deletion. According to your documentation (`SUPABASE_DATABASE_FUNCTIONS.md`):

```sql
CREATE TRIGGER tr_protect_admin_profiles
    BEFORE DELETE OR UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_admin_profiles();
```

This trigger:
- Checks if the target user is/was an Admin
- Checks if the current user (actor) is an Admin  
- **BLOCKS the deletion** if target is Admin AND actor is NOT Admin
- **Blocks CASCADE deletions** that involve admin profiles

Even when using the Supabase UI with your admin credentials, the trigger still blocks it because it checks `auth.uid()` which may not be set in the table editor context.

## Solutions

### Solution 1: Fix the `deleteUser` Function (RECOMMENDED)

Update your `app/(authenticated)/user-management/actions.ts` file to delete from `user_profiles` BEFORE deleting from auth:

**Current code (BROKEN):**
```typescript
export async function deleteUser(userId: string) {
  try {
    const canDelete = await hasPermission('users.delete');
    if (!canDelete) return { error: "You do not have permission to delete users." };

    const safety = await checkCanModifyUser(userId);
    if (!safety.allowed) return { error: safety.error };

    const supabase = createAdminClient();

    // Delete User from Auth
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Error deleting user:", error);
      return { error: error.message };
    }

    revalidatePath("/user-management");
    return { success: true };
  } catch (error: any) {
    console.error("Unexpected error deleting user:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
}
```

**Fixed code:**
```typescript
export async function deleteUser(userId: string) {
  try {
    const canDelete = await hasPermission('users.delete');
    if (!canDelete) return { error: "You do not have permission to delete users." };

    const safety = await checkCanModifyUser(userId);
    if (!safety.allowed) return { error: safety.error };

    const supabase = createAdminClient();

    // IMPORTANT: Delete from user_profiles FIRST to trigger CASCADE deletions
    // This will delete related records: user_chats, user_direct_permissions, etc.
    // The service_role key bypasses RLS and the protect_admin_profiles trigger
    const { error: profileError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting user profile:", profileError);
      return { error: `Failed to delete user profile: ${profileError.message}` };
    }

    // Then delete from Auth (this removes login ability)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      // Profile is already deleted, but auth failed - this is still somewhat successful
      return { error: `User profile deleted but auth deletion failed: ${authError.message}` };
    }

    revalidatePath("/user-management");
    return { success: true };
  } catch (error: any) {
    console.error("Unexpected error deleting user:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
}
```

**Why this works:**
- The `createAdminClient()` uses the **service_role** key
- Service role bypasses RLS policies AND triggers
- Deleting from `user_profiles` first triggers CASCADE deletions to related tables
- Then deletes from auth to remove login ability

### Solution 2: Clean Up Existing Orphaned Records via SQL

If you already have orphaned records, run this SQL in Supabase SQL Editor:

```sql
-- Find orphaned records first
SELECT up.* 
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE au.id IS NULL;

-- If the above query shows orphaned records, delete them:
-- Temporarily disable the trigger
ALTER TABLE public.user_profiles DISABLE TRIGGER tr_protect_admin_profiles;

-- Delete the orphaned records (CASCADE will handle related tables)
DELETE FROM public.user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = up.id
);

-- Re-enable the trigger
ALTER TABLE public.user_profiles ENABLE TRIGGER tr_protect_admin_profiles;
```

### Solution 3: Prevent Future Issues

**Always use the application's "Remove User" button** in the User Management page instead of deleting through Supabase Dashboard.

## Testing the Fix

After applying Solution 1:

1. Go to your User Management page
2. Try deleting a non-admin user
3. Verify:
   - ✅ User deleted from `auth.users`
   - ✅ User deleted from `user_profiles`  
   - ✅ Related records deleted from `user_chats`
   - ✅ Related records deleted from `user_direct_permissions`

## Foreign Key CASCADE Behavior

When you delete from `user_profiles` (with service_role):

| Table | Column | Relationship | Action |
|-------|--------|--------------|--------|
| `user_chats` | `sender_id` | → `user_profiles.id` | **CASCADE DELETE** |
| `user_chats` | `receiver_id` | → `user_profiles.id` | **CASCADE DELETE** |
| `user_direct_permissions` | `user_id` | → `user_profiles.id` | **CASCADE DELETE** |

## Important Notes

1. **Service Role Bypasses Triggers**: The fix works because `createAdminClient()` uses the `SUPABASE_SERVICE_ROLE_KEY`, which bypasses the `protect_admin_profiles` trigger.

2. **Order Matters**: You MUST delete from `user_profiles` BEFORE deleting from `auth.users`. The reverse order creates orphaned records.

3. **Admin Protection**: The `checkCanModifyUser()` function still prevents non-admins from deleting admin accounts at the application level.

4. **Storage Cleanup**: User avatars in `storage.objects` are NOT automatically deleted. Consider adding manual cleanup:
   ```typescript
   // After deleting profile, also delete avatar
   const { data: files } = await supabase.storage
     .from('avatars')
     .list(userId);
   
   if (files && files.length > 0) {
     const filePaths = files.map(file => `${userId}/${file.name}`);
     await supabase.storage.from('avatars').remove(filePaths);
   }
   ```

## References

- See `SUPABASE_DATABASE_FUNCTIONS.md` for full trigger documentation
- See `SUPABASE_RLS_POLICIES.md` for RLS policy details
- See `app/(authenticated)/user-management/actions.ts` for current implementation
