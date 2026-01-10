import { createClient } from "./server";

/**
 * Checks if the current user has a specific permission code.
 * Admins are granted all permissions by default.
 */
export async function hasPermission(permissionCode: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // 1. Check if user is Admin (Admins have all permissions)
  const { data: isAdmin } = await supabase.rpc('has_role', { role_name: 'Admin' });
  if (isAdmin) return true;

  // 2. Check for specific permission
  const { data: hasPerm } = await supabase
    .from('user_profiles')
    .select(`
      user_roles!inner (
        user_role_permissions!inner (
          user_permissions!inner (
            code
          )
        )
      )
    `)
    .eq('id', user.id)
    .eq('user_roles.user_role_permissions.user_permissions.code', permissionCode)
    .maybeSingle();

  return !!hasPerm;
}

/**
 * Gets all permission codes for the current user.
 */
export async function getMyPermissions(): Promise<string[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // If admin, we could return all or a special flag. 
  // For simplicity, let's fetch what's assigned.
  
  const { data } = await supabase
    .from('user_profiles')
    .select(`
      user_roles (
        name,
        user_role_permissions (
          user_permissions (
            code
          )
        )
      )
    `)
    .eq('id', user.id)
    .single();

  if (!data?.user_roles) return [];
  
  // If admin, they might not have explicit permissions in the join table 
  // if we rely on the 'Admin' role logic.
  if (data.user_roles.name === 'Admin') {
    const { data: allPerms } = await supabase.from('user_permissions').select('code');
    return allPerms?.map(p => p.code) || [];
  }

  const permissions = data.user_roles.user_role_permissions
    .map((urp: any) => urp.user_permissions.code);

  return permissions;
}
