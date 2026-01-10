import { createClient } from "@/lib/supabase/server";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionGroupsTable } from "@/components/permission-groups-table";
import { RolesList } from "@/components/roles-list";
import { RolesPermissionsHeader } from "@/components/roles-permissions-header";

export default async function RolesPermissionsPage() {
  const supabase = await createClient();

  // Fetch roles with their permissions and user count
  const { data: roles } = await supabase
    .from("user_roles")
    .select(`
      *,
      user_role_permissions (
        permission_id,
        user_permissions (
          name,
          code
        )
      ),
      user_profiles (count)
    `)
    .order("name");

  // Fetch all permissions grouped by group_name
  const { data: permissions } = await supabase
    .from("user_permissions")
    .select("*")
    .order("group_name, name");

  // Group permissions for display
  const groupedPermissions = (permissions || []).reduce((acc: Record<string, any[]>, curr) => {
    if (!acc[curr.group_name]) acc[curr.group_name] = [];
    acc[curr.group_name].push(curr);
    return acc;
  }, {});

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      <RolesPermissionsHeader />

      <RolesList roles={roles || []} allPermissions={permissions || []} />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Permission Groups</CardTitle>
          <CardDescription>
            List of all available permissions in the system. Click on a group name to expand or collapse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PermissionGroupsTable groupedPermissions={groupedPermissions} />
        </CardContent>
      </Card>
    </div>
  );
}