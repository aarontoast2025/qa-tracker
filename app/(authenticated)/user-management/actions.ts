"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/supabase/permissions";
import { createClient } from "@/lib/supabase/server";

export async function inviteUser(email: string, roleId?: string) {
  try {
    const supabase = createAdminClient();

    const { headers } = await import("next/headers");
    const headersList = await headers();
    let origin = headersList.get("origin");
    
    // Fallback for origin if not present in headers
    if (!origin) {
      const host = headersList.get("host");
      const protocol = host?.includes("localhost") ? "http" : "https";
      origin = `${protocol}://${host}`;
    }
    
    // Final fallback to env var
    if (!origin || origin.includes("null")) {
      origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    }

    // Use inviteUserByEmail which sends a proper invitation
    // Redirect directly to update-password page which handles session establishment client-side
    const redirectUrl = `${origin}/auth/update-password`;

    // Check Permission
    const canInvite = await hasPermission('users.invite');
    if (!canInvite) return { error: "You do not have permission to invite users." };

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      // If a roleId was provided, update the profile that was created by the trigger
      // Note: The trigger handle_new_user should have already created a profile.
      if (roleId) {
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ role_id: roleId })
          .eq("id", data.user.id);
          
        if (updateError) {
          console.error("Error updating user role after invite:", updateError);
        }
      }

      // Fetch the role name for the UI update
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

    const supabase = createAdminClient();

    // 1. Update Profile
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({ is_suspended: suspend })
      .eq("id", userId);

    if (profileError) return { error: profileError.message };

    // 2. Update Auth (Ban the user so they can't log in)
    // 'none' or '876000h' (100 years) to ban, '0s' to unban
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

    const supabase = createAdminClient();
    
    const { headers } = await import("next/headers");
    const headersList = await headers();
    let origin = headersList.get("origin");
    
    // Fallback for origin if not present in headers
    if (!origin) {
      const host = headersList.get("host");
      const protocol = host?.includes("localhost") ? "http" : "https";
      origin = `${protocol}://${host}`;
    }
    
    // Final fallback to env var
    if (!origin || origin.includes("null")) {
      origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    }

    const redirectUrl = `${origin}/auth/update-password`;

    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
    });

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

    const supabase = createAdminClient();

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
    // Check Permission - reusing users.account as it controls password reset sending
    const canManageAccount = await hasPermission('users.account');
    if (!canManageAccount) return { error: "You do not have permission to send password resets." };

    const supabase = createAdminClient();
    
    const { headers } = await import("next/headers");
    const headersList = await headers();
    let origin = headersList.get("origin");
    
    // Fallback for origin if not present in headers
    if (!origin) {
      const host = headersList.get("host");
      const protocol = host?.includes("localhost") ? "http" : "https";
      origin = `${protocol}://${host}`;
    }
    
    // Final fallback to env var
    if (!origin || origin.includes("null")) {
      origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    }

    const redirectUrl = `${origin}/auth/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) return { error: error.message };
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

