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
import { IconTextarea } from "@/components/icon-textarea";
import { createRole } from "@/app/(authenticated)/(standard)/roles-permissions/actions";
import { Loader2, ShieldCheck, Shield, FileText, Plus, X, Save } from "lucide-react";

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoleModal({
  isOpen,
  onClose,
}: CreateRoleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name || !description) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createRole(name, description);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setLoading(false);
      setName("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Create New Role
          </DialogTitle>
          <DialogDescription>
            Define a new role for the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <IconInput
            id="new-role-name"
            label="Role Name"
            icon={Shield}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Moderator"
          />

          <IconTextarea
            id="new-role-description"
            label="Description"
            icon={FileText}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What can this role do?"
          />
        </div>

        <DialogFooter className="flex flex-row justify-end items-center gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading} className="gap-2 px-6">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading} className="gap-2 px-6">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
