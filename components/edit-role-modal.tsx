"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { updateRolePermissions } from "@/app/(authenticated)/(standard)/roles-permissions/actions";
import { Loader2, Shield, ChevronDown, ChevronRight, Save, X, Lock } from "lucide-react";
import * as React from "react";
import { Badge } from "./ui/badge";

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
  user_role_permissions: { permission_id: string }[];
}

interface EditRoleModalProps {
  role: Role | null;
  isOpen: boolean;
  onClose: () => void;
  allPermissions: Permission[];
}

export function EditRoleModal({
  role,
  isOpen,
  onClose,
  allPermissions,
}: EditRoleModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role) {
      setSelectedPermissions(
        role.user_role_permissions?.map((p) => p.permission_id) || []
      );
      setError(null);
      // Collapse all groups by default when opening
      setExpandedGroups({});
    }
  }, [role, isOpen]);

  const handleTogglePermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const handleSave = async () => {
    if (!role) return;
    setLoading(true);
    setError(null);

    const result = await updateRolePermissions(role.id, selectedPermissions);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setLoading(false);
      onClose();
    }
  };

  if (!role) return null;

  // Group permissions for display
  const groupedPermissions = allPermissions.reduce((acc: Record<string, Permission[]>, curr) => {
    if (!acc[curr.group_name]) acc[curr.group_name] = [];
    acc[curr.group_name].push(curr);
    return acc;
  }, {});

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Edit Permissions: {role.name}
          </DialogTitle>
          <DialogDescription>
            Select the permissions you want to assign to this role.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          {role.name === 'Admin' ? (
            <div className="p-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
              <Lock className="h-12 w-12 text-primary mx-auto mb-4 opacity-20" />
              <p className="font-bold text-lg">Administrator Access</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                The Admin role has unrestricted access to all system features. Permissions cannot be modified for security.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(groupedPermissions).map(([group, perms]) => (
                <div key={group} className="border rounded-md overflow-hidden bg-card">
                  <button
                    className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => toggleGroup(group)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedGroups[group] ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-bold text-sm">{group}</span>
                      <Badge variant="secondary" className="h-4 px-1 text-[9px] font-normal">
                        {perms.length}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {perms.filter(p => selectedPermissions.includes(p.id)).length} selected
                    </div>
                  </button>
                  
                  {expandedGroups[group] && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      {perms.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-start space-x-3 group"
                        >
                          <Checkbox
                            id={`modal-perm-${permission.id}`}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => handleTogglePermission(permission.id)}
                            className="mt-0.5"
                          />
                          <div className="grid gap-1 leading-tight">
                            <label
                              htmlFor={`modal-perm-${permission.id}`}
                              className="text-sm font-medium cursor-pointer group-hover:text-primary transition-colors"
                            >
                              {permission.name}
                            </label>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {permission.code}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t bg-muted/20">
          <Button variant="outline" onClick={onClose} disabled={loading} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          {role.name !== 'Admin' && (
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Permissions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}