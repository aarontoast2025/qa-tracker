"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/supabase/permissions";
import { createClient } from "@/lib/supabase/server";

// Helper to prevent non-admins from modifying admins
async function checkCanModifyUser(targetUserId: string) {
  const supabase = await createClient();
  
  // 1. Check if current user is Admin
  const { data: isActorAdmin } = await supabase.rpc('has_role', { role_name: 'Admin' });
  
  // If actor is admin, they can do anything (subject to permissions checked by caller)
  if (isActorAdmin) return { allowed: true };

  // 2. Fetch target user's role
  // Use admin client to ensure we can read the role regardless of RLS
  const adminClient = createAdminClient();
  const { data: targetProfile } = await adminClient
    .from('user_profiles')
    .select('user_roles(name)')
    .eq('id', targetUserId)
    .single();
    
  const targetRoleName = (targetProfile?.user_roles as any)?.name;
  
  if (targetRoleName === 'Admin') {
    return { allowed: false, error: "You cannot modify an Administrator account." };
  }
  
  return { allowed: true };
}

export async function inviteUser(email: string, roleId?: string) {
  try {
    const supabase = createAdminClient();
    const supabaseServer = await createClient();

    // Get the origin from headers (most reliable in Vercel)
    const { headers } = await import("next/headers");
    const headersList = await headers();
    
    // Try to get origin from various header sources
    let origin: string = headersList.get("x-forwarded-host") || 
                        headersList.get("host") || 
                        process.env.SITE_URL || 
                        process.env.NEXT_PUBLIC_SITE_URL || 
                        "";
    
    // Add protocol if not present
    if (origin && !origin.startsWith("http")) {
      const protocol = origin.includes("localhost") ? "http" : "https";
      origin = `${protocol}://${origin}`;
    }
    
    // Final fallback
    if (!origin || origin.includes("null")) {
      origin = "https://qa-tracker-toast.vercel.app";
    }

    // Remove trailing slash if present
    origin = origin.replace(/\/$/, '');

    const redirectUrl = `${origin}/auth/callback?next=/auth/update-password&flow=invite`;
    
    console.log('[inviteUser] Origin:', origin);
    console.log('[inviteUser] Redirect URL:', redirectUrl);

    // Check Permission
    const canInvite = await hasPermission('users.invite');
    if (!canInvite) return { error: "You do not have permission to invite users." };

    // Prevent non-admins from inviting users as Admin
    if (roleId) {
       const { data: role } = await supabase
        .from('user_roles')
        .select('name')
        .eq('id', roleId)
        .single();
        
       if (role?.name === 'Admin') {
         const { data: isActorAdmin } = await supabaseServer.rpc('has_role', { role_name: 'Admin' });
         if (!isActorAdmin) return { error: "Only Administrators can invite new Admins." };
       }
    }

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('[inviteUser] Error:', error);
      return { error: error.message };
    }
    
    console.log('[inviteUser] Success - User invited:', data.user?.email);

    if (data.user) {
      if (roleId) {
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ role_id: roleId })
          .eq("id", data.user.id);
          
        if (updateError) {
          console.error("Error updating user role after invite:", updateError);
        }
      }

      let roleName = "Viewer";
      if (roleId) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("name")
          .eq("id", roleId)
          .single();
        if (roleData) roleName = roleData.name;
      }

      revalidatePath("/user-management");
      
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          first_name: null,
          last_name: null,
          role: roleName,
          status: "invited",
          last_sign_in_at: null,
          created_at: data.user.created_at,
        },
      };
    }

    return { error: "Failed to invite user." };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function suspendUser(userId: string, suspend: boolean) {
  try {
    // Check Permission
    const canSuspend = await hasPermission('users.suspend');
    if (!canSuspend) return { error: "You do not have permission to suspend/unsuspend users." };

    // Check Safety (Admin protection)
    const safety = await checkCanModifyUser(userId);
    if (!safety.allowed) return { error: safety.error };

    const supabase = createAdminClient();

    // 1. Update Profile
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({ is_suspended: suspend })
      .eq("id", userId);

    if (profileError) return { error: profileError.message };

    // 2. Update Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: suspend ? "876000h" : "0s",
    });

    if (authError) return { error: authError.message };

    revalidatePath("/user-management");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function resendInvitation(email: string) {
  try {
    // Check Permission
    const canInvite = await hasPermission('users.invite');
    if (!canInvite) return { error: "You do not have permission to invite users." };

    // For resend, we might want to check if the target is admin, but usually pending invites aren't full admins yet.
    // But if they are invited AS admin, maybe we should protect? 
    // Since we can't easily get ID from email here without query, and it's less critical (just email), 
    // we skip strict check or we'd need to lookup user by email first.
    // Let's lookup user by email to be safe.
    const supabase = createAdminClient();
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const targetUser = users.find(u => u.email === email);
    
    if (targetUser) {
        const safety = await checkCanModifyUser(targetUser.id);
        if (!safety.allowed) return { error: safety.error };
    }

    // Get the origin from headers (most reliable in Vercel)
    const { headers } = await import("next/headers");
    const headersList = await headers();
    
    // Try to get origin from various header sources
    let origin: string = headersList.get("x-forwarded-host") || 
                        headersList.get("host") || 
                        process.env.SITE_URL || 
                        process.env.NEXT_PUBLIC_SITE_URL || 
                        "";
    
    // Add protocol if not present
    if (origin && !origin.startsWith("http")) {
      const protocol = origin.includes("localhost") ? "http" : "https";
      origin = `${protocol}://${origin}`;
    }
    
    // Final fallback
    if (!origin || origin.includes("null")) {
      origin = "https://qa-tracker-toast.vercel.app";
    }

    // Remove trailing slash if present
    origin = origin.replace(/\/$/, '');

    const redirectUrl = `${origin}/auth/callback?next=/auth/update-password&flow=invite`;
    
    console.log('[resendInvitation] Origin:', origin);
    console.log('[resendInvitation] Redirect URL:', redirectUrl);

    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
    });
    
    if (error) {
      console.error('[resendInvitation] Error:', error);
      return { error: error.message };
    }
    
    console.log('[resendInvitation] Success - Invitation resent to:', email);

    revalidatePath("/user-management");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function getUserDetails(userId: string) {
  try {
    const supabase = createAdminClient();
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) return { error: error.message };

    // Fetch Direct Permissions
    const { data: directPerms, error: directError } = await supabase
      .from("user_direct_permissions")
      .select("permission_id")
      .eq("user_id", userId);
    
    if (directError) return { error: directError.message };

    // Fetch All Permissions
    const { data: allPerms, error: allError } = await supabase
      .from("user_permissions")
      .select("*");

    if (allError) return { error: allError.message };

    // Fetch All Role Permissions
    const { data: rolePerms, error: roleError } = await supabase
      .from("user_role_permissions")
      .select("role_id, permission_id");

    if (roleError) return { error: roleError.message };

    return { 
      profile, 
      directPermissions: directPerms.map((p: any) => p.permission_id),
      allPermissions: allPerms,
      rolePermissions: rolePerms
    };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function updateUserDirectPermissions(userId: string, permissionIds: string[]) {
  try {
    // Check Permission
    const canManagePermissions = await hasPermission('users.permission');
    if (!canManagePermissions) return { error: "You do not have permission to manage user permissions." };

    // Check Safety
    const safety = await checkCanModifyUser(userId);
    if (!safety.allowed) return { error: safety.error };

    const supabase = createAdminClient();
    
    // 1. Delete existing direct permissions
    const { error: deleteError } = await supabase
      .from("user_direct_permissions")
      .delete()
      .eq("user_id", userId);

    if (deleteError) return { error: deleteError.message };

    // 2. Insert new permissions
    if (permissionIds.length > 0) {
      const { error: insertError } = await supabase
        .from("user_direct_permissions")
        .insert(
          permissionIds.map(permId => ({
            user_id: userId,
            permission_id: permId
          }))
        );

      if (insertError) return { error: insertError.message };
    }

    revalidatePath("/user-management");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function updateUserProfile(userId: string, data: any) {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    // Allow if updating own profile OR has 'users.update' permission
    const isSelf = user?.id === userId;
    if (!isSelf) {
      const canUpdate = await hasPermission('users.update');
      if (!canUpdate) return { error: "You do not have permission to update other users." };
      
      // Check Safety only if not self (though Admin updating self is fine)
      const safety = await checkCanModifyUser(userId);
      if (!safety.allowed) return { error: safety.error };
    }

    const supabase = createAdminClient();
    
    const { error } = await supabase
      .from("user_profiles")
      .update(data)
      .eq("id", userId);

    if (error) return { error: error.message };

    revalidatePath("/user-management");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function updateUserAccount(userId: string, email: string, roleId: string) {
  try {
    // Check Permission
    const canManageAccount = await hasPermission('users.account');
    if (!canManageAccount) return { error: "You do not have permission to manage user accounts." };

    // Check Safety (prevent modifying Admin)
    const safety = await checkCanModifyUser(userId);
    if (!safety.allowed) return { error: safety.error };
    
    const supabase = createAdminClient();
    const supabaseServer = await createClient();

    // Prevent promoting to Admin if not Admin
    if (roleId) {
       const { data: role } = await supabase
        .from('user_roles')
        .select('name')
        .eq('id', roleId)
        .single();
        
       if (role?.name === 'Admin') {
         const { data: isActorAdmin } = await supabaseServer.rpc('has_role', { role_name: 'Admin' });
         if (!isActorAdmin) return { error: "Only Administrators can assign the Admin role." };
       }
    }

    // 1. Update Email in Auth if provided
    if (email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        email: email,
        email_confirm: true, // Confirm the email automatically for the user
      });
      if (authError) return { error: authError.message };
    }

    // 2. Update Role in Profile
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({ role_id: roleId })
      .eq("id", userId);

    if (profileError) return { error: profileError.message };

    revalidatePath("/user-management");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function sendPasswordReset(email: string) {
  try {
    // Check Permission
    const canManageAccount = await hasPermission('users.account');
    if (!canManageAccount) return { error: "You do not have permission to send password resets." };

    const supabase = createAdminClient();
    
    // Safety Check by Email
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const targetUser = users.find(u => u.email === email);
    if (targetUser) {
        const safety = await checkCanModifyUser(targetUser.id);
        if (!safety.allowed) return { error: safety.error };
    }

    // Get the origin from headers (most reliable in Vercel)
    const { headers } = await import("next/headers");
    const headersList = await headers();
    
    // Try to get origin from various header sources
    let origin: string = headersList.get("x-forwarded-host") || 
                        headersList.get("host") || 
                        process.env.SITE_URL || 
                        process.env.NEXT_PUBLIC_SITE_URL || 
                        "";
    
    // Add protocol if not present
    if (origin && !origin.startsWith("http")) {
      const protocol = origin.includes("localhost") ? "http" : "https";
      origin = `${protocol}://${origin}`;
    }
    
    // Final fallback
    if (!origin || origin.includes("null")) {
      origin = "https://qa-tracker-toast.vercel.app";
    }

    // Remove trailing slash if present
    origin = origin.replace(/\/$/, '');

    const redirectUrl = `${origin}/auth/callback?next=/auth/update-password&flow=recovery`;
    
    console.log('[sendPasswordReset] Origin:', origin);
    console.log('[sendPasswordReset] Redirect URL:', redirectUrl);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('[sendPasswordReset] Error:', error);
      return { error: error.message };
    }
    
    console.log('[sendPasswordReset] Success - Password reset sent to:', email);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function deleteUser(userId: string) {
  try {
    // Check Permission
    const canDelete = await hasPermission('users.delete');
    if (!canDelete) return { error: "You do not have permission to delete users." };

    // Check Safety (Admin protection)
    const safety = await checkCanModifyUser(userId);
    if (!safety.allowed) return { error: safety.error };

    const supabase = createAdminClient();

    // First, verify the user exists in user_profiles
    const { data: existingProfile, error: checkError } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name")
      .eq("id", userId)
      .single();

    if (checkError) {
      console.error("Error checking user profile:", checkError);
      return { error: `User profile not found: ${checkError.message}` };
    }

    console.log("Found user profile to delete:", existingProfile);

    // IMPORTANT: Delete from user_profiles FIRST to trigger CASCADE deletions
    // This will delete related records: user_chats, user_direct_permissions, etc.
    // The service_role key bypasses RLS and the protect_admin_profiles trigger
    const { data: deleteData, error: profileError, count } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", userId)
      .select();

    console.log("Delete result:", { deleteData, profileError, count });

    if (profileError) {
      console.error("Error deleting user profile:", profileError);
      return { error: `Failed to delete user profile: ${profileError.message}` };
    }

    // Verify deletion
    const { data: verifyProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (verifyProfile) {
      console.error("PROFILE STILL EXISTS AFTER DELETE!", verifyProfile);
      return { error: "Profile deletion failed - record still exists in database" };
    }

    console.log("Profile successfully deleted, now deleting from auth...");

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
