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
import { Plus, Loader2, Type, HelpCircle, FileText } from "lucide-react";
import { IconInput } from "@/components/icon-input";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (question: string, shortName: string) => Promise<void>;
}

export function AddItemModal({ isOpen, onClose, onAdd }: AddItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [shortName, setShortName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    setLoading(true);
    try {
      await onAdd(question, shortName);
      setQuestion("");
      setShortName("");
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
              <HelpCircle className="h-5 w-5 text-primary" />
              Add Line Item
            </DialogTitle>
            <DialogDescription>
              Create a new question or line item for this group.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <IconInput
              id="item-question"
              label="Full Line Item Name"
              icon={Type}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Was the resolution provided to the customer?"
              required
              autoFocus
            />
            <IconInput
              id="item-short-name"
              label="Short Name (Internal)"
              icon={FileText}
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="e.g., Resolution Provided"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="gap-2">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
