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
import { Plus, Loader2, Type, Layout } from "lucide-react";
import { IconInput } from "@/components/icon-input";

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string) => Promise<void>;
}

export function AddGroupModal({ isOpen, onClose, onAdd }: AddGroupModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setLoading(true);
    try {
      await onAdd(title);
      setTitle("");
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-primary" />
              Add New Group
            </DialogTitle>
            <DialogDescription>
              Groups help organize your audit questions into logical sections.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <IconInput
              id="group-title"
              label="Group Name"
              icon={Type}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., General Information, Process Compliance"
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="gap-2">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
