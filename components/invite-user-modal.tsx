"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconInput } from "@/components/icon-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { inviteUser } from "@/app/(authenticated)/user-management/actions";
import { Loader2, Mail, Shield, UserPlus, X, Send } from "lucide-react";

interface Role {
  id: string;
  name: string;
}

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: Role[];
  onSuccess: (user: any) => void;
}

export function InviteUserModal({
  isOpen,
  onClose,
  roles,
  onSuccess,
}: InviteUserModalProps) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!email || !roleId) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await inviteUser(email, roleId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setLoading(false);
      setEmail("");
      setRoleId("");
      onSuccess(result.user);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invite New User
          </DialogTitle>
          <DialogDescription>
            Send an email invitation and assign a system role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <IconInput
            id="invite-email"
            label="Email Address"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
          />

          <div className="space-y-2">
            <Label htmlFor="invite-role">System Role</Label>
            <div className="relative">
              <div className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none">
                <Shield className="h-4 w-4" />
              </div>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger className="pl-10 h-10">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading} className="gap-2 px-6">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={loading} className="gap-2 px-6">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
