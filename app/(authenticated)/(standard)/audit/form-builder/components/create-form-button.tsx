"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { createForm } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CreateFormButtonProps {
    mode?: "button" | "card";
}

export function CreateFormButton({ mode = "button" }: CreateFormButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setLoading(true);
    try {
      const newForm = await createForm(title, description);
      setOpen(false);
      setTitle("");
      setDescription("");
      toast.success("Form created successfully");
      router.push(`/audit/form-builder/${newForm.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "button" ? (
            <Button className="gap-2">
                <Plus className="h-4 w-4" /> Create New Form
            </Button>
        ) : (
            <div 
                className={cn(
                    "flex flex-col items-center justify-center h-full min-h-[200px] border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group p-6",
                )}
            >
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                    <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-semibold text-lg text-foreground/80 group-hover:text-primary transition-colors">Create New Form</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">
                    Start from scratch with a new audit template
                </p>
            </div>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Audit Form</DialogTitle>
          <DialogDescription>
            Give your form a title and description to get started.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g., Weekly Quality Audit"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe the purpose of this form..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Form
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}