"use client";

import { useState, useEffect } from "react";
import { Droppable, Draggable, DroppableProvided, DraggableProvided } from "@hello-pangea/dnd";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Trash2, PlusCircle, AlertCircle, Save } from "lucide-react";
import { updateSection, deleteSection, addItem } from "../../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ItemEditor } from "./item-editor";
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

interface SectionEditorProps {
  section: any;
  formId: string;
  dragHandleProps?: any;
}

export function SectionEditor({ section, formId, dragHandleProps }: SectionEditorProps) {
  const [title, setTitle] = useState(section.title);
  const [addingItem, setAddingItem] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = title !== section.title;

  useEffect(() => {
    setTitle(section.title);
  }, [section.title]);

  const handleSaveTitle = async () => {
    setIsSaving(true);
    try {
      await updateSection(section.id, formId, { title });
      toast.success("Section title saved");
    } catch (error) {
      toast.error("Failed to update section title");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
        await deleteSection(section.id, formId);
        toast.success("Section deleted");
    } catch (error) {
        toast.error("Failed to delete section");
    } finally {
        setShowDeleteModal(false);
    }
  };

  const handleAddItem = async () => {
    setAddingItem(true);
    try {
      await addItem(section.id, formId);
    } catch (error) {
      toast.error("Failed to add item");
    } finally {
      setAddingItem(false);
    }
  };

  return (
    <>
        <Card className="border-l-4 border-l-primary/50 relative group shadow-sm hover:shadow-md transition-all">
        <CardHeader className="py-3 px-4 bg-muted/20 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2 flex-1">
            <div {...dragHandleProps} className="cursor-grab hover:text-primary text-muted-foreground transition-colors p-1">
                <GripVertical className="h-4 w-4" />
            </div>
            <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={cn(
                    "font-semibold text-base border-transparent hover:border-input bg-transparent px-2 h-9 focus-visible:ring-1 max-w-md",
                    hasChanges && "bg-yellow-50"
                )}
                placeholder="Section Title"
            />
            {hasChanges && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100 bg-yellow-50 shadow-sm"
                    onClick={handleSaveTitle}
                    disabled={isSaving}
                    title="Save Section Title"
                >
                    <Save className={cn("h-4 w-4", isSaving && "animate-pulse")} />
                </Button>
            )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteModal(true)}>
                <Trash2 className="h-4 w-4" />
            </Button>
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-4 bg-muted/5 min-h-[100px]">
            <Droppable droppableId={section.id} type="ITEM">
            {(provided: DroppableProvided, snapshot) => (
                <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={cn(
                    "space-y-3 min-h-[60px] transition-colors rounded-md",
                    snapshot.isDraggingOver ? "bg-primary/5 ring-2 ring-primary/10" : ""
                )}
                >
                {section.form_items.length === 0 && !snapshot.isDraggingOver && (
                    <div className="text-center py-6 text-sm text-muted-foreground italic border-2 border-dashed border-muted-foreground/10 rounded">
                    No questions in this section yet.
                    </div>
                )}
                
                {section.form_items.map((item: any, itemIndex: number) => (
                    <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                    {(provided: DraggableProvided, snapshot) => (
                        <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                            "transition-all",
                            snapshot.isDragging ? "rotate-1 z-50 opacity-90" : ""
                        )}
                        >
                        <ItemEditor 
                            item={item} 
                            formId={formId} 
                            dragHandleProps={provided.dragHandleProps} 
                        />
                        </div>
                    )}
                    </Draggable>
                ))}
                {provided.placeholder}
                
                <Button 
                    variant="ghost" 
                    className="w-full h-9 text-xs font-medium text-muted-foreground hover:text-primary border-2 border-dashed border-muted-foreground/10 hover:border-primary/20 hover:bg-primary/5 transition-all mt-4"
                    onClick={handleAddItem}
                    disabled={addingItem}
                >
                    <PlusCircle className="mr-2 h-3.5 w-3.5" /> 
                    {addingItem ? "Adding..." : "Add Question"}
                </Button>
                </div>
            )}
            </Droppable>
        </CardContent>
        </Card>

        <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertCircle className="h-5 w-5" />
                        <AlertDialogTitle>Delete Section</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription>
                        Are you sure you want to delete this section? This will also delete all questions inside it. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="gap-2">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete Section
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}