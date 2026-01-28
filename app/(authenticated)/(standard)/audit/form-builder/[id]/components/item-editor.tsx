"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Trash2, GripVertical, Plus, X, Star, StarOff, AlertCircle, Check, Save, Info } from "lucide-react";
import { 
    updateItem, 
    deleteItem, 
    addOption, 
    updateOption, 
    deleteOption,
    updateOptionOrder
} from "../../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

const COLORS = [
    { label: "Green", value: "green", class: "bg-green-500" },
    { label: "Red", value: "red", class: "bg-red-500" },
    { label: "Yellow", value: "yellow", class: "bg-yellow-500" },
    { label: "Gray", value: "gray", class: "bg-gray-500" },
];

function OptionItem({ opt, provided, snapshot, onUpdate, onDelete }: any) {
    return (
        <div 
            ref={provided.innerRef} 
            {...provided.draggableProps} 
            className={cn(
                "flex gap-2 items-center bg-white p-2 rounded border group/opt relative",
                snapshot.isDragging && "shadow-lg border-primary/50"
            )}
        >
            <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground/30 hover:text-muted-foreground shrink-0">
                <GripVertical className="h-3 w-3" />
            </div>

            <div className={cn(
                "h-4 w-4 rounded-full shrink-0",
                COLORS.find(c => c.value === opt.color)?.class || "bg-gray-400"
            )} />
            
            <Input 
                value={opt.label} 
                onChange={(e) => onUpdate(opt.id, { label: e.target.value })}
                className="h-8 text-sm flex-1 border-transparent focus:border-input bg-transparent px-1"
                placeholder="Label"
            />
            
            <Select value={opt.color} onValueChange={(val) => onUpdate(opt.id, { color: val })}>
                <SelectTrigger className="w-24 h-7 text-[10px] border-none shadow-none bg-muted/50">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {COLORS.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", c.class)} />
                                {c.label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Button 
                variant="ghost" 
                size="icon" 
                type="button"
                className={cn(
                    "h-5 w-5 rounded-full transition-all shrink-0",
                    opt.is_correct ? "bg-green-50 text-green-600 border border-green-200" : "text-muted-foreground/40 hover:text-green-500"
                )}
                onClick={() => onUpdate(opt.id, { is_correct: !opt.is_correct })}
            >
                <Check className="h-3 w-3" />
            </Button>

            <Button 
                variant="ghost" 
                size="icon" 
                type="button"
                className={cn(
                    "h-7 w-7 transition-colors",
                    opt.is_default ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground/40 hover:text-yellow-500"
                )}
                onClick={() => onUpdate(opt.id, { is_default: !opt.is_default })}
            >
                {opt.is_default ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" type="button" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(opt.id)}>
                <X className="h-3 w-3" />
            </Button>
        </div>
    );
}

export function ItemEditor({ item, formId, dragHandleProps }: any) {
  const [label, setLabel] = useState(item.label || "");
  const [shortName, setShortName] = useState(item.short_name || "");
  const [type, setType] = useState(item.type);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isSavingOptions, setIsSavingOptions] = useState(false);

  // Local state for all options including newly added unsaved ones
  const [localOptions, setLocalOptions] = useState<any[]>([]);

  // Initialize and Sync local state
  useEffect(() => {
    // 1. Always sync if local state is empty (initial load)
    const isInitialLoad = localOptions.length === 0 && (item.form_item_options || []).length > 0;
    
    // 2. Sync item fields if no local changes
    if (isInitialLoad || !hasItemChanges) {
        setLabel(item.label || "");
        setShortName(item.short_name || "");
        setType(item.type);
    }
    
    // 3. Sync options if no local changes OR it's the first time we're getting them
    if (isInitialLoad || !hasOptionChanges) {
        setLocalOptions(item.form_item_options || []);
    }
  }, [item.id, item.label, item.short_name, item.type, item.form_item_options]);

  // Precise change detection
  const hasItemChanges = label !== (item.label || "") || 
                         shortName !== (item.short_name || "") || 
                         type !== item.type;

  const hasOptionChanges = localOptions.length > 0 && 
                         JSON.stringify(localOptions.map(o => ({ 
                             id: o.id, label: o.label, color: o.color, is_default: o.is_default, is_correct: o.is_correct 
                         }))) !== JSON.stringify((item.form_item_options || []).map((o: any) => ({
                             id: o.id, label: o.label, color: o.color, is_default: o.is_default, is_correct: o.is_correct
                         })));

  const handleSaveItem = async () => {
    setIsSavingItem(true);
    try {
        await updateItem(item.id, formId, { label, short_name: shortName, type });
        toast.success("Question updated");
    } catch (error) {
        toast.error("Failed to save question");
    } finally {
        setIsSavingItem(false);
    }
  };

  const handleUpdateOptionDraft = (optionId: string, updates: any) => {
    setLocalOptions(prev => prev.map(o => {
        if (o.id === optionId) {
            return { ...o, ...updates };
        }
        if (updates.is_default === true) return { ...o, is_default: false };
        return o;
    }));
  };

  const handleSaveOptions = async () => {
    setIsSavingOptions(true);
    try {
        await Promise.all(localOptions.map(opt => 
            updateOption(opt.id, formId, {
                label: opt.label,
                color: opt.color,
                is_default: opt.is_default,
                is_correct: opt.is_correct,
                value: opt.label ? opt.label.toLowerCase().replace(/\s+/g, '_') : ""
            })
        ));
        toast.success("Options saved successfully");
        // Force refresh local data to match new server state
        setLocalOptions(localOptions); 
    } catch (error) {
        toast.error("Failed to save some options");
    } finally {
        setIsSavingOptions(false);
    }
  };

  const handleAddOptionLocal = async () => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const newOpt = {
        id: tempId,
        label: "",
        color: "gray",
        is_default: false,
        is_correct: false,
        item_id: item.id,
        order_index: localOptions.length
    };
    
    setLocalOptions([...localOptions, newOpt]);
    
    try {
        const realOpt = await addOption(item.id, formId);
        if (realOpt) {
            setLocalOptions(prev => prev.map(o => o.id === tempId ? { ...o, id: realOpt.id } : o));
        }
    } catch (error) {
        toast.error("Failed to add option to database");
        setLocalOptions(prev => prev.filter(o => o.id !== tempId));
    }
  };

  const onDeleteOption = async (id: string) => {
    // 1. Remove from local state immediately for instant UI feedback
    const originalOptions = [...localOptions];
    setLocalOptions(prev => prev.filter(o => o.id !== id));

    if (id.startsWith('temp-')) return;

    // 2. Perform silent deletion in DB
    try {
        await deleteOption(id, formId);
    } catch (error) {
        toast.error("Failed to delete option from database");
        // Rollback on error
        setLocalOptions(originalOptions);
    }
  };

  const onDragEndOptions = async (result: DropResult) => {
    if (!result.destination) return;
    const newOptions = Array.from(localOptions);
    const [removed] = newOptions.splice(result.source.index, 1);
    newOptions.splice(result.destination.index, 0, removed);
    setLocalOptions(newOptions);
    
    // Only update order if none are temp items
    if (!newOptions.some(o => o.id.toString().startsWith('temp-'))) {
        try {
            await updateOptionOrder(formId, newOptions);
        } catch (e) {
            toast.error("Failed to update option order");
        }
    }
  };

  return (
    <>
      <div className={cn(
          "bg-white border rounded-md shadow-sm transition-all group/item overflow-hidden relative",
          isExpanded ? "ring-2 ring-primary/20 border-primary/30" : "hover:border-primary/40",
          (hasItemChanges || hasOptionChanges) && "border-yellow-400 bg-yellow-50/5"
      )}>
        {(hasItemChanges || hasOptionChanges) && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-yellow-400 text-white text-[10px] font-bold rounded-b uppercase tracking-widest z-10 shadow-sm">
                Unsaved Changes
            </div>
        )}

        <div className="flex items-start gap-3 p-4">
          <div {...dragHandleProps} className="mt-2 cursor-grab text-muted-foreground/30 hover:text-muted-foreground shrink-0">
              <GripVertical className="h-4 w-4" />
          </div>
          
          <div className="flex-1 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Full Item Name</Label>
                      <Input value={label} onChange={(e) => setLabel(e.target.value)} onFocus={() => setIsExpanded(true)} className="font-medium h-9" />
                  </div>
                  <div className="w-full md:w-48 space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Short Name</Label>
                      <Input value={shortName} onChange={(e) => setShortName(e.target.value)} onFocus={() => setIsExpanded(true)} className="font-medium h-9" />
                  </div>
                  <div className="w-full md:w-40 space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Type</Label>
                      <Select value={type} onValueChange={setType}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="toggle">Toggle</SelectItem>
                              <SelectItem value="dropdown">Dropdown</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>

              {isExpanded && (
                  <div className="space-y-4 pt-4 border-t">
                      <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground block">Response Options</Label>

                          <DragDropContext onDragEnd={onDragEndOptions}>
                              <Droppable droppableId={`options-${item.id}`}>
                                  {(provided) => (
                                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                          {localOptions.map((opt, idx) => (
                                              <Draggable key={opt.id} draggableId={opt.id} index={idx}>
                                                  {(p, s) => (
                                                      <OptionItem 
                                                        opt={opt} 
                                                        provided={p} 
                                                        snapshot={s} 
                                                        onUpdate={handleUpdateOptionDraft} 
                                                        onDelete={onDeleteOption} 
                                                      />
                                                  )}
                                              </Draggable>
                                          ))}
                                          {provided.placeholder}
                                      </div>
                                  )}
                              </Droppable>
                          </DragDropContext>

                          <div className="flex items-center justify-between pt-2 border-t border-muted/50 mt-4">
                                <Button variant="outline" size="sm" type="button" onClick={handleAddOptionLocal} className="h-8 text-xs gap-2">
                                    <Plus className="h-3 w-3" /> Add Option
                                </Button>

                                {hasOptionChanges && (
                                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                                        <span className="text-[10px] font-medium text-yellow-600 flex items-center gap-1">
                                            <Info className="h-3 w-3" /> Please save options to update the changes
                                        </span>
                                        <Button size="sm" type="button" onClick={handleSaveOptions} disabled={isSavingOptions} className="h-8 bg-yellow-500 hover:bg-yellow-600 text-white gap-2 shadow-sm">
                                            <Save className={cn("h-3.5 w-3.5", isSavingOptions && "animate-spin")} />
                                            Save Options
                                        </Button>
                                    </div>
                                )}
                          </div>
                      </div>
                  </div>
              )}
          </div>

          <div className="flex flex-col gap-2">
              {hasItemChanges && (
                  <Button variant="ghost" size="icon" type="button" onClick={handleSaveItem} disabled={isSavingItem} className="h-8 w-8 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 ring-1 ring-yellow-200">
                      <Save className={cn("h-4 w-4", isSavingItem && "animate-pulse")} />
                  </Button>
              )}
              <Button variant="ghost" size="icon" type="button" onClick={() => setIsExpanded(!isExpanded)} className={cn("h-8 w-8", isExpanded ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary")}>
                  <Plus className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-45")} />
              </Button>
              <Button variant="ghost" size="icon" type="button" onClick={() => setShowDeleteModal(true)} className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <Trash2 className="h-4 w-4" />
              </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <div className="flex items-center gap-2 text-destructive mb-2">
                      <AlertCircle className="h-5 w-5" />
                      <AlertDialogTitle>Delete Question</AlertDialogTitle>
                  </div>
                  <AlertDialogDescription>
                      Are you sure you want to delete this question? This action cannot be undone.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteItem(item.id, formId)} className="bg-destructive text-white hover:bg-destructive/90">
                      Delete Question
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
