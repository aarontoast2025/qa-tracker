"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

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
    return { profile };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function sendPasswordReset(email: string) {
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

