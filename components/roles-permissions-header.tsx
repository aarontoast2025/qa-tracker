"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateRoleModal } from "./create-role-modal";

interface RolesPermissionsHeaderProps {
  currentUserPermissions: string[];
}

export function RolesPermissionsHeader({ currentUserPermissions }: RolesPermissionsHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Manage system roles and define what users can see and do.
          </p>
        </div>
        <div className="flex gap-2">
          {currentUserPermissions.includes('roles.add') && (
            <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
              <ShieldCheck className="h-4 w-4" />
              Create New Role
            </Button>
          )}
        </div>
      </div>

      <CreateRoleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
