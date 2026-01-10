"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function inviteUser(email: string) {
  try {
    const supabase = createAdminClient();

    const { headers } = await import("next/headers");
    const headersList = await headers();
    const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL;

    // Create user with a temporary random password
    const tempPassword = Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      // Create a profile for the invited user
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          id: data.user.id,
          program_email: email,
        });

      if (profileError) {
        console.error("Error creating profile for invited user:", profileError);
      }

      // Send password reset email (this is the "invitation")
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/update-password`,
      });

      if (resetError) {
        console.error("Error sending invitation email:", resetError);
        return { error: "User created but failed to send invitation email." };
      }

      revalidatePath("/user-management");
      
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          first_name: null,
          last_name: null,
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
