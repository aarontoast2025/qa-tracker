"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tag as TagIcon, MessageSquare, Check } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  optionId: string;
  tag?: any;
  formId: string;
  onSave: (tag: any, formId: string) => Promise<void>;
  options?: any[];
}

export function TagModal({ isOpen, onClose, optionId, tag, formId, onSave, options = [] }: TagModalProps) {
  const [label, setLabel] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState(optionId);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tag) {
      setLabel(tag.tag_label || "");
      setFeedback(tag.feedback_text || "");
      setSelectedOptionId(tag.option_id || optionId);
    } else {
      setLabel("");
      setFeedback("");
      setSelectedOptionId(optionId);
    }
  }, [tag, isOpen, optionId]);

  const handleSave = async () => {
    if (!label.trim() || !feedback.trim() || !selectedOptionId) return;
    
    setIsSaving(true);
    try {
      await onSave({
        id: tag?.id,
        option_id: selectedOptionId,
        tag_label: label,
        feedback_text: feedback
      }, formId);
      onClose();
    } catch (error) {
      console.error("Failed to save tag:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TagIcon className="h-5 w-5 text-primary" />
            {tag ? "Edit Targeted Tag" : "Add Targeted Tag"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Trigger Option
            </Label>
            <Select value={selectedOptionId} onValueChange={setSelectedOptionId}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select trigger option..." />
                </SelectTrigger>
                <SelectContent>
                    {options.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                            {opt.label} {opt.is_correct ? "(Good)" : "(Bad)"}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tag Label
            </Label>
            <Input
              id="tag-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder='e.g., "Polite Opening"'
              className="col-span-3"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tag-feedback" className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <MessageSquare className="h-3 w-3" /> Feedback Template
            </Label>
            <Textarea
              id="tag-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter the automated feedback text..."
              className="col-span-3 min-h-[150px] resize-none leading-relaxed"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? "Saving..." : (
              <>
                <Check className="h-4 w-4" />
                Save Tag Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
