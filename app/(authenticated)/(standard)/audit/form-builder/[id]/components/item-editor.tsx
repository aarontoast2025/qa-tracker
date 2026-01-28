"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { Trash2, GripVertical, Plus, X, Star, StarOff, AlertCircle, Check } from "lucide-react";
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

interface ItemEditorProps {
  item: any;
  formId: string;
  dragHandleProps?: any;
}

const COLORS = [
    { label: "Green", value: "green", class: "bg-green-500" },
    { label: "Red", value: "red", class: "bg-red-500" },
    { label: "Yellow", value: "yellow", class: "bg-yellow-500" },
    { label: "Gray", value: "gray", class: "bg-gray-500" },
];

// Helper for silent background updates to avoid Next.js revalidation/Rendering loop
async function silentUpdate(entity: 'item' | 'option', id: string, updates: any) {
    try {
        await fetch('/api/audit/form-builder/update', {
            method: 'POST',
            body: JSON.stringify({ entity, id, updates }),
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.error("Silent update failed:", e);
    }
}

// Sub-component for individual options
function OptionItem({ opt, provided, snapshot, onUpdate, onDelete, isDefault, isCorrect }: any) {
    const [localLabel, setLocalLabel] = useState(opt.label || "");
    const isFocused = useRef(false);

    useEffect(() => {
        if (!isFocused.current) {
            setLocalLabel(opt.label || "");
        }
    }, [opt.label]);

    // Debounce save for label
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localLabel !== opt.label && isFocused.current) {
                // Use silent background update for typing
                silentUpdate('option', opt.id, { 
                    label: localLabel, 
                    value: localLabel.toLowerCase().replace(/\s+/g, '_') 
                });
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [localLabel, opt.id, opt.label]);

    return (
        <div 
            ref={provided.innerRef} 
            {...provided.draggableProps} 
            className={cn(
                "flex gap-2 items-center bg-white p-2 rounded border group/opt",
                snapshot.isDragging && "shadow-lg border-primary/50"
            )}
        >
            <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground/30 hover:text-muted-foreground">
                <GripVertical className="h-3 w-3" />
            </div>

            <div className={cn(
                "h-4 w-4 rounded-full shrink-0",
                COLORS.find(c => c.value === opt.color)?.class || "bg-gray-400"
            )} />
            
            <Input 
                value={localLabel} 
                onChange={(e) => setLocalLabel(e.target.value)}
                onFocus={() => { isFocused.current = true; }}
                onBlur={() => { isFocused.current = false; }}
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
                className={cn(
                    "h-5 w-5 rounded-full transition-all shrink-0",
                    isCorrect ? "bg-green-50 text-green-600 border border-green-200" : "text-muted-foreground/40 hover:text-green-500"
                )}
                onClick={() => onUpdate(opt.id, { is_correct: !isCorrect })}
                title={isCorrect ? "Correct Answer" : "Mark as Correct"}
            >
                <Check className="h-3 w-3" />
            </Button>

            <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                    "h-7 w-7 transition-colors",
                    isDefault ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground/40 hover:text-yellow-500"
                )}
                onClick={() => onUpdate(opt.id, { is_default: !isDefault })}
                title={isDefault ? "Default Answer" : "Set as Default"}
            >
                {isDefault ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(opt.id)}>
                <X className="h-3 w-3" />
            </Button>
        </div>
    );
}

export function ItemEditor({ item, formId, dragHandleProps }: ItemEditorProps) {
  const [label, setLabel] = useState(item.label || "");
  const [shortName, setShortName] = useState(item.short_name || "");
  const [type, setType] = useState(item.type);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const isLabelFocused = useRef(false);
  const isShortNameFocused = useRef(false);

  // Master local state for options
  const [localOptions, setLocalOptions] = useState<any[]>(item.form_item_options || []);

  // Sync with server props ONLY when they change from outside
  useEffect(() => {
    setLocalOptions(item.form_item_options || []);
  }, [item.form_item_options]);

  useEffect(() => {
    if (!isLabelFocused.current) setLabel(item.label || "");
  }, [item.label]);

  useEffect(() => {
    if (!isShortNameFocused.current) setShortName(item.short_name || "");
  }, [item.short_name]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const needsLabelUpdate = label !== item.label && isLabelFocused.current;
      const needsShortUpdate = shortName !== item.short_name && isShortNameFocused.current;
      
      if (needsLabelUpdate || needsShortUpdate) {
        silentUpdate('item', item.id, { label, short_name: shortName });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [label, shortName, item.id, item.label, item.short_name]);

  const handleDelete = async () => {
    try {
        await deleteItem(item.id, formId);
        toast.success("Item deleted");
    } catch (error) {
        toast.error("Failed to delete item");
    } finally {
        setShowDeleteModal(false);
    }
  };

  const handleAddOption = async () => {
    const tempId = crypto.randomUUID();
    const newOpt = { id: tempId, label: "", value: "", color: "gray", is_default: false, is_correct: false, item_id: item.id };
    setLocalOptions([...localOptions, newOpt]);
    
    try {
        await addOption(item.id, formId);
    } catch (error) {
        setLocalOptions(localOptions);
        toast.error("Failed to add option");
    }
  };

  const handleUpdateOptionLocal = useCallback(async (optionId: string, updates: any) => {
    // 1. Instant UI update
    setLocalOptions(prev => {
        let next = prev.map(o => o.id === optionId ? { ...o, ...updates } : o);
        if (updates.is_default === true) {
            next = next.map(o => o.id === optionId ? o : { ...o, is_default: false });
        }
        return next;
    });

    // 2. Background update
    await silentUpdate('option', optionId, updates);
  }, []);

  const handleDeleteOptionLocal = async (optionId: string) => {
    const original = [...localOptions];
    setLocalOptions(localOptions.filter(o => o.id !== optionId));
    try {
        await deleteOption(optionId, formId);
    } catch (error) {
        setLocalOptions(original);
        toast.error("Failed to delete option");
    }
  };

  const onDragEndOptions = async (result: DropResult) => {
    if (!result.destination) return;
    
    const newOptions = Array.from(localOptions);
    const [removed] = newOptions.splice(result.source.index, 1);
    newOptions.splice(result.destination.index, 0, removed);
    
    setLocalOptions(newOptions);
    try {
        await updateOptionOrder(formId, newOptions);
    } catch (error) {
        setLocalOptions(localOptions);
        toast.error("Failed to save option order");
    }
  };

  return (
    <>
      <div className={cn(
          "bg-white border rounded-md shadow-sm transition-all group/item overflow-hidden",
          isExpanded ? "ring-2 ring-primary/20 border-primary/30" : "hover:border-primary/40"
      )}>
        <div className="flex items-start gap-3 p-4">
          <div {...dragHandleProps} className="mt-2 cursor-grab text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0">
              <GripVertical className="h-4 w-4" />
          </div>
          
          <div className="flex-1 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Full Item Name</Label>
                      <Input 
                          value={label}
                          onChange={(e) => setLabel(e.target.value)}
                          onFocus={() => { isLabelFocused.current = true; setIsExpanded(true); }}
                          onBlur={() => { isLabelFocused.current = false; }}
                          className="font-medium h-9"
                          placeholder="e.g. 1. Did the specialist greeted the customer?"
                      />
                  </div>
                  <div className="w-full md:w-48 space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Short Item Name</Label>
                      <Input 
                          value={shortName}
                          onChange={(e) => setShortName(e.target.value)}
                          onFocus={() => { isShortNameFocused.current = true; setIsExpanded(true); }}
                          onBlur={() => { isShortNameFocused.current = false; }}
                          className="font-medium h-9"
                          placeholder="e.g. 1. Customer Greeting"
                      />
                  </div>
                  <div className="w-full md:w-40 space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Type</Label>
                      <Select value={type} onValueChange={(val) => { setType(val); updateItem(item.id, formId, { type: val }); }}>
                          <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="toggle">Toggle</SelectItem>
                              <SelectItem value="dropdown">Dropdown</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>

              {isExpanded && (
                  <div className="space-y-6 pt-4 border-t animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2 block">Response Options</Label>

                          <DragDropContext onDragEnd={onDragEndOptions}>
                              <Droppable droppableId={`options-${item.id}`}>
                                  {(provided) => (
                                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                          {localOptions.map((opt: any, idx: number) => (
                                              <Draggable key={opt.id} draggableId={opt.id} index={idx}>
                                                  {(provided, snapshot) => (
                                                      <OptionItem 
                                                        opt={opt}
                                                        formId={formId}
                                                        provided={provided}
                                                        snapshot={snapshot}
                                                        onUpdate={handleUpdateOptionLocal}
                                                        onDelete={handleDeleteOptionLocal}
                                                        isDefault={opt.is_default}
                                                        isCorrect={opt.is_correct}
                                                      />
                                                  )}
                                              </Draggable>
                                          ))}
                                          {provided.placeholder}
                                          
                                          <div 
                                              onClick={handleAddOption}
                                              className="flex items-center justify-center p-2 border-2 border-dashed rounded border-muted-foreground/10 hover:border-primary/20 hover:bg-primary/5 cursor-pointer transition-all text-muted-foreground/50 hover:text-primary"
                                          >
                                              <Plus className="h-4 w-4 mr-1" />
                                              <span className="text-xs font-medium">Add Option</span>
                                          </div>
                                      </div>
                                  )}
                              </Droppable>
                          </DragDropContext>
                      </div>
                  </div>
              )}
          </div>

          <div className="flex flex-col gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
              <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-8 w-8", isExpanded ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary")}
                  onClick={() => setIsExpanded(!isExpanded)}
              >
                  <Plus className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-45")} />
              </Button>
              <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setShowDeleteModal(true)}
              >
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
                  <AlertDialogCancel className="gap-2">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Question
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
