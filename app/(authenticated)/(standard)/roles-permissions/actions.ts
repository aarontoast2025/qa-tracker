"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/supabase/permissions";

export async function createRole(name: string, description: string) {
  try {
    const canAdd = await hasPermission('roles.add');
    if (!canAdd) return { error: "You do not have permission to create roles." };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_roles")
      .insert({ name, description })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/roles-permissions");
    return { success: true, role: data };
  } catch (error: any) {
    console.error("Error creating role:", error);
    return { error: error.message || "Failed to create role." };
  }
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  try {
    const canManage = await hasPermission('roles.permission');
    if (!canManage) return { error: "You do not have permission to manage role permissions." };

    const supabase = await createClient();

    // Use RPC for atomic update (prevents data loss if insert fails after delete)
    const { error } = await supabase.rpc('update_role_permissions_atomic', {
      p_role_id: roleId,
      p_permission_ids: permissionIds
    });

    if (error) throw error;

    revalidatePath("/roles-permissions");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating role permissions:", error);
    return { error: error.message || "Failed to update permissions." };
  }
}

export async function updateRoleDetails(roleId: string, name: string, description: string) {
  try {
    const canUpdate = await hasPermission('roles.update');
    if (!canUpdate) return { error: "You do not have permission to update roles." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("user_roles")
      .update({ name, description })
      .eq("id", roleId);

    if (error) throw error;

    revalidatePath("/roles-permissions");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating role details:", error);
    return { error: error.message || "Failed to update role." };
  }
}

export async function deleteRole(roleId: string) {
  try {
    const canDelete = await hasPermission('roles.delete');
    if (!canDelete) return { error: "You do not have permission to delete roles." };

    const supabase = await createClient();
    
    // Check if role is Admin (cannot be deleted)
    const { data: role } = await supabase.from('user_roles').select('name').eq('id', roleId).single();
    if (role?.name === 'Admin') return { error: "The Administrator role cannot be deleted." };

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", roleId);

    if (error) throw error;

    revalidatePath("/roles-permissions");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting role:", error);
    return { error: error.message || "Failed to delete role." };
  }
}

export async function getUsersByRole(roleId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name, avatar_url, company_email")
      .eq("role_id", roleId)
      .order("first_name", { ascending: true });

    if (error) throw error;

    return { users: data || [] };
  } catch (error: any) {
    console.error("Error fetching users by role:", error);
    return { error: error.message || "Failed to fetch users." };
  }
}
