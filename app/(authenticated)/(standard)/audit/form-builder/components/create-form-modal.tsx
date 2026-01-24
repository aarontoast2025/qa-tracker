"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, FileText, Type } from "lucide-react";
import { createForm } from "../../actions";
import { IconInput } from "@/components/icon-input";
import { IconTextarea } from "@/components/icon-textarea";

export function CreateFormModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        const result = await createForm({
            title,
            description,
            status: 'draft',
        });

        if (result.error) {
            alert(result.error);
        } else {
            setIsOpen(false);
            setTitle("");
            setDescription("");
            // Optionally redirect to the new form
            if (result.data?.id) {
                router.push(`/audit/form-builder/${result.data.id}`);
            }
        }
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Form
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Create New Audit Form
            </DialogTitle>
            <DialogDescription>
              Start building a new audit form. You can add questions and groups later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <IconInput
              id="title"
              label="Title"
              icon={Type}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Monthly Compliance Audit"
              required
            />
            <IconTextarea
              id="description"
              label="Description"
              icon={FileText}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this form's purpose."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="gap-2">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Form
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
