"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Shield, Settings, ShieldCheck, Fingerprint, Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditRoleModal } from "./edit-role-modal";
import { EditRoleDetailsModal } from "./edit-role-details-modal";

interface Permission {
  id: string;
  name: string;
  code: string;
  group_name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
  user_profiles?: { count: number }[];
  user_role_permissions: { 
    permission_id: string;
    user_permissions: {
      name: string;
      code: string;
    }
  }[];
}

interface RolesListProps {
  roles: Role[];
  allPermissions: Permission[];
}

export function RolesList({ roles, allPermissions }: RolesListProps) {
  const [editingPermissionsRole, setEditingPermissionsRole] = useState<Role | null>(null);
  const [editingDetailsRole, setEditingDetailsRole] = useState<Role | null>(null);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleEditPermissions = (role: Role) => {
    setEditingPermissionsRole(role);
    setIsPermModalOpen(true);
  };

  const handleEditDetails = (role: Role) => {
    setEditingDetailsRole(role);
    setIsDetailModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles?.map((role) => {
          const userCount = role.user_profiles?.[0]?.count || 0;
          
          return (
            <Card key={role.id} className="flex flex-col border-t-4 border-t-primary shadow-sm hover:shadow-md transition-all">
              <CardHeader className="relative">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  
                  {role.name === 'Admin' ? (
                    <Badge variant="destructive" className="font-semibold uppercase text-[10px] tracking-wider">
                      Full Access
                    </Badge>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full"
                      onClick={() => handleEditDetails(role)}
                      title="Edit Role Details"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CardTitle className="mt-4 flex items-center gap-2">
                  {role.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                  {role.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 border-y bg-muted/5 py-4 my-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Fingerprint className="h-3.5 w-3.5" />
                    <span>ID: {role.id.substring(0, 8)}...</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Created: {new Date(role.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{role.name === 'Admin' ? 'Unlimited' : (role.user_role_permissions?.length || 0)} Permissions</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <Users className="h-3.5 w-3.5" />
                      <span>{userCount} Users</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <Button 
                  variant="outline" 
                  className="w-full text-xs h-9 gap-2 border hover:bg-primary hover:text-primary-foreground transition-all"
                  onClick={() => handleEditPermissions(role)}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Edit Permissions
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <EditRoleModal
        role={editingPermissionsRole}
        isOpen={isPermModalOpen}
        onClose={() => setIsPermModalOpen(false)}
        allPermissions={allPermissions}
      />

      <EditRoleDetailsModal
        role={editingDetailsRole}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </>
  );
}
