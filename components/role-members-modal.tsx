"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getUsersByRole } from "@/app/(authenticated)/roles-permissions/actions";
import { Loader2, Users, Mail } from "lucide-react";

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  company_email: string | null;
}

interface RoleMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string | null;
  roleName: string | null;
}

export function RoleMembersModal({ isOpen, onClose, roleId, roleName }: RoleMembersModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && roleId) {
      loadUsers();
    }
  }, [isOpen, roleId]);

  const loadUsers = async () => {
    if (!roleId) return;
    setLoading(true);
    const result = await getUsersByRole(roleId);
    if (result.users) {
      setUsers(result.users);
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Users assigned to "{roleName}"
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading members...</p>
            </div>
          ) : users.length > 0 ? (
            <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {users.map((user) => {
                const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
                return (
                  <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary overflow-hidden border">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials || "?"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {user.company_email || "No email"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Users className="h-10 w-10 opacity-20 mb-2" />
              <p className="text-sm">No users assigned to this role yet.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
