"use client";

import { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Plus, Loader2 } from "lucide-react";
import { updateSectionOrder, updateItemOrder, addSection, updateFormStatus } from "../../actions";
import { toast } from "sonner";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SectionEditor } from "./section-editor";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FormBuilderEditorProps {
  form: any;
  initialSections: any[];
}

export function FormBuilderEditor({ form, initialSections }: FormBuilderEditorProps) {
  const [sections, setSections] = useState<any[]>(initialSections);
  const [isClient, setIsClient] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const initAttempted = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sync state with server props
  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  // Auto-initialize empty form
  useEffect(() => {
    const initForm = async () => {
        if (initialSections.length === 0 && !initAttempted.current) {
            initAttempted.current = true;
            setInitializing(true);
            try {
                // Optimistic add
                const tempId = "temp-" + Date.now();
                setSections([{ id: tempId, title: "New Section", form_items: [], order_index: 0 }]);
                
                await addSection(form.id, "New Section");
                // Server revalidate will update props -> updating state
            } catch (e) {
                console.error("Auto-init failed:", e);
                toast.error("Failed to initialize form. Please verify database tables exist.");
                // We don't revert optimistic state here so user can try manually adding or we see the UI
            } finally {
                setInitializing(false);
            }
        }
    };
    initForm();
  }, [initialSections.length, form.id]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result;

    if (!destination) return;

    if (type === "SECTION") {
      const newSections = Array.from(sections);
      const [removed] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, removed);

      setSections(newSections);
      
      try {
        await updateSectionOrder(form.id, newSections);
      } catch (error) {
        toast.error("Failed to save section order");
        setSections(sections); // Revert
      }
    } else if (type === "ITEM") {
      const sourceSectionId = source.droppableId;
      const destSectionId = destination.droppableId;

      const sourceSectionIndex = sections.findIndex(s => s.id === sourceSectionId);
      const destSectionIndex = sections.findIndex(s => s.id === destSectionId);

      if (sourceSectionIndex === -1 || destSectionIndex === -1) return;

      const newSections = [...sections];
      const sourceItems = [...newSections[sourceSectionIndex].form_items];
      const destItems = sourceSectionId === destSectionId 
        ? sourceItems 
        : [...newSections[destSectionIndex].form_items];

      const [removed] = sourceItems.splice(source.index, 1);
      (removed as any).section_id = destSectionId;

      destItems.splice(destination.index, 0, removed);

      newSections[sourceSectionIndex] = { ...newSections[sourceSectionIndex], form_items: sourceItems };
      newSections[destSectionIndex] = { ...newSections[destSectionIndex], form_items: destItems };

      setSections(newSections);

      try {
        const itemsToUpdate = sourceSectionId === destSectionId 
            ? destItems 
            : [...sourceItems, ...destItems];
            
        await updateItemOrder(form.id, itemsToUpdate);
      } catch (error) {
        toast.error("Failed to save item order");
        setSections(sections);
      }
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
        await updateFormStatus(form.id, status);
        toast.success(`Form marked as ${status}`);
    } catch (e) {
        toast.error("Failed to update status");
    }
  };

  const handleAddSection = async () => {
      try {
          await addSection(form.id, "New Section");
          toast.success("Section added");
      } catch (e) {
          toast.error("Failed to add section");
      }
  };

  if (!isClient) {
    return (
        <div className="flex items-center justify-center h-screen text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading editor...
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/audit/form-builder">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{form.title}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={form.status === 'active' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 uppercase">
                {form.status}
              </Badge>
              <span>{sections.length} Sections • {sections.reduce((acc, s) => acc + s.form_items.length, 0)} Questions</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Settings className="h-4 w-4" /> Status
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStatusChange('draft')}>Draft</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('active')}>Active</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('archived')}>Archived</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections" type="SECTION">
          {(provided: DroppableProvided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              className="space-y-8 pb-20"
            >
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided: DraggableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <SectionEditor 
                        section={section} 
                        formId={form.id} 
                        dragHandleProps={provided.dragHandleProps} 
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              {sections.length > 0 && (
                  <div className="flex justify-center pt-4 opacity-50 hover:opacity-100 transition-opacity">
                      <Button variant="ghost" onClick={handleAddSection} className="gap-2">
                          <Plus className="h-4 w-4" /> Add Another Section
                      </Button>
                  </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}