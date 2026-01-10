"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateRolePermissions(
  roleId: string,
  permissionIds: string[]
) {
  try {
    const supabase = createAdminClient();

    // 1. Delete existing permissions for this role
    const { error: deleteError } = await supabase
      .from("user_role_permissions")
      .delete()
      .eq("role_id", roleId);

    if (deleteError) {
      return { error: deleteError.message };
    }

    // 2. Insert new permissions
    if (permissionIds.length > 0) {
      const { error: insertError } = await supabase
        .from("user_role_permissions")
        .insert(
          permissionIds.map((pId) => ({
            role_id: roleId,
            permission_id: pId,
          }))
        );

      if (insertError) {
        return { error: insertError.message };
      }
    }

    revalidatePath("/roles-permissions");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function updateRoleDetails(
  roleId: string,
  name: string,
  description: string
) {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("user_roles")
      .update({ name, description })
      .eq("id", roleId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/roles-permissions");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function createRole(name: string, description: string) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("user_roles")
      .insert({ name, description })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/roles-permissions");
    return { success: true, role: data };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function deleteRole(roleId: string) {
  try {
    const supabase = createAdminClient();

    // 1. Check if users are assigned to this role
    const { count, error: countError } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .eq("role_id", roleId);

    if (countError) return { error: countError.message };
    
    if (count && count > 0) {
      return { 
        error: `Cannot delete role. There are ${count} users currently assigned to this role. Please move them to another role first.` 
      };
    }

    // 2. Delete the role (Cascade will handle user_role_permissions)
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", roleId);

    if (deleteError) return { error: deleteError.message };

    revalidatePath("/roles-permissions");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

