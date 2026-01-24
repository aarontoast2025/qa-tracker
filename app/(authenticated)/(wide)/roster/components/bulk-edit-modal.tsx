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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EmployeeInput, RosterMetadata } from "../types";
import { Loader2 } from "lucide-react";

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<EmployeeInput>) => Promise<void>;
  metadata: RosterMetadata;
  selectedCount: number;
}

export function BulkEditModal({
  isOpen,
  onClose,
  onSave,
  metadata,
  selectedCount,
}: BulkEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [updates, setUpdates] = useState<Partial<EmployeeInput>>({});

  const handleUpdate = (field: keyof EmployeeInput, value: string) => {
    if (value === "_no_change_") {
        const newUpdates = { ...updates };
        delete newUpdates[field];
        setUpdates(newUpdates);
    } else {
        setUpdates((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(updates).length === 0) {
        onClose();
        return;
    }
    
    setLoading(true);
    try {
      await onSave(updates);
      setUpdates({}); // Reset form
      onClose();
    } catch (error) {
      console.error("Failed to bulk update", error);
    } finally {
      setLoading(false);
    }
  };

  const renderSelect = (
    field: keyof EmployeeInput,
    label: string,
    options: string[]
  ) => (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={field} className="text-right">
        {label}
      </Label>
      <Select
        value={updates[field] as string || "_no_change_"}
        onValueChange={(value) => handleUpdate(field, value)}
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="No Change" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="_no_change_">
                <span className="text-muted-foreground italic">No Change</span>
            </SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Edit Employees</DialogTitle>
          <DialogDescription>
            Updating {selectedCount} selected employees. Select new values for the fields you want to change.
            Fields left as "No Change" will retain their current values.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {renderSelect("role", "Role", metadata.roles)}
          {renderSelect("skill", "Skill", metadata.skills)}
          {renderSelect("tier", "Tier", metadata.tiers)}
          {renderSelect("channel", "Channel", metadata.channels)}
          {renderSelect("supervisor", "Supervisor", metadata.supervisors)}
          {renderSelect("status", "Status", metadata.statuses)}
          {renderSelect("location", "Location", metadata.locations)}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || Object.keys(updates).length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
