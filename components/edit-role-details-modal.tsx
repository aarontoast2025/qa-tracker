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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { IconInput } from "@/components/icon-input";
import { IconTextarea } from "@/components/icon-textarea";
import { updateRoleDetails, deleteRole } from "@/app/(authenticated)/roles-permissions/actions";
import { Loader2, Settings, Calendar, Save, X, Shield, FileText, Trash2, AlertTriangle, Info } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
  user_profiles?: { count: number }[];
}

interface EditRoleDetailsModalProps {
  role: Role | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditRoleDetailsModal({
  role,
  isOpen,
  onClose,
}: EditRoleDetailsModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const userCount = role?.user_profiles?.[0]?.count || 0;

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description);
      setError(null);
    }
  }, [role, isOpen]);

  const handleSave = async () => {
    if (!role) return;
    setLoading(true);
    setError(null);

    const result = await updateRoleDetails(role.id, name, description);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setLoading(false);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!role) return;
    setLoading(true);
    setShowDeleteConfirm(false);

    const result = await deleteRole(role.id);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setLoading(false);
      onClose();
    }
  };

  if (!role) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Edit Role Details
            </DialogTitle>
            <DialogDescription>
              Modify the name and description for this role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex gap-2 items-start">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <IconInput
              id="role-name"
              label="Role Name"
              icon={Shield}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Moderator"
            />

            <IconTextarea
              id="role-description"
              label="Description"
              icon={FileText}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What can this role do?"
            />

            <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Created on: {new Date(role.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                <span>{userCount} Users assigned to this role</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end items-center gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading} className="gap-2 px-6">
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button 
              variant="outline" 
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2 px-6"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button onClick={handleSave} disabled={loading} className="gap-2 px-6">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Role: {role.name}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-sm text-muted-foreground">
                <p>
                  Are you sure you want to delete this role? This action <strong>cannot be undone</strong>.
                </p>
                {userCount > 0 && (
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-md text-sm border border-red-200 dark:border-red-800 flex gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <p>
                      <strong>Blocked:</strong> There are currently {userCount} users assigned to this role. 
                      You must reassign them to a different role before you can delete this role.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading || userCount > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}