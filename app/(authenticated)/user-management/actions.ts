"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function inviteUser(email: string) {
  try {
    const supabase = createAdminClient();

    const headersList = (await import("next/headers")).headers();
    const origin = (await headersList).get("origin") || process.env.NEXT_PUBLIC_SITE_URL;

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth/confirm?next=/auth/update-password`,
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
