"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuditForm, AuditGroup, AuditItem, AuditItemOption } from "../../../types";
import { 
    updateForm, 
    deleteForm, 
    createGroup, 
    deleteGroup, 
    createItem, 
    deleteItem, 
    reorderItems,
    reorderGroups
} from "../../../actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
    ArrowLeft, Plus, Settings, Trash2, Archive, MoreVertical, 
    GripVertical, CheckSquare, Layout, HelpCircle, AlertTriangle, X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { EditItemModal } from "./edit-item-modal";
import { AddGroupModal } from "./add-group-modal";
import { AddItemModal } from "./add-item-modal";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface FormBuilderClientProps {
  form: AuditForm;
  initialStructure: (AuditGroup & { items: (AuditItem & { options: AuditItemOption[] })[] })[];
  permissions: {
    canUpdate: boolean;
    canDelete: boolean;
    canArchive: boolean;
  };
}

export function FormBuilderClient({ form, initialStructure, permissions }: FormBuilderClientProps) {
  const router = useRouter();
  const [structure, setStructure] = useState(initialStructure);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState<{ groupId: string; count: number } | null>(null);

  useEffect(() => {
    setStructure(initialStructure);
  }, [initialStructure]);

  const editingItem = editingItemId 
    ? structure.flatMap(g => g.items).find(i => i.id === editingItemId)
    : null;
  
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'form' | 'group' | 'item';
    id: string;
    title: string;
  } | null>(null);

  const handleStatusChange = async (newStatus: 'draft' | 'active' | 'archived') => {
    await updateForm(form.id, { status: newStatus });
    router.refresh();
  };

  const handleAddGroup = async (title: string) => {
    await createGroup({
        form_id: form.id,
        title,
        order_index: structure.length
    });
    router.refresh();
  };

  const handleAddItem = async (question: string, shortName: string) => {
    if (!isAddItemOpen) return;
    await createItem({
        group_id: isAddItemOpen.groupId,
        question_text: question,
        short_name: shortName,
        item_type: 'toggle_yes_no', 
        is_required: true,
        order_index: isAddItemOpen.count
    }, form.id);
    router.refresh();
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'group') {
        const newStructure = Array.from(structure);
        const [removed] = newStructure.splice(source.index, 1);
        newStructure.splice(destination.index, 0, removed);
        
        setStructure(newStructure);

        // Persist
        const updates = newStructure.map((group, index) => ({
            id: group.id,
            order_index: index
        }));
        await reorderGroups(updates, form.id);
    } else {
        // Reordering items
        const sourceGroupId = source.droppableId;
        const destGroupId = destination.droppableId;

        if (sourceGroupId !== destGroupId) return; // For now only internal reordering

        const newStructure = Array.from(structure);
        const groupIndex = newStructure.findIndex(g => g.id === sourceGroupId);
        if (groupIndex === -1) return;

        const group = { ...newStructure[groupIndex] };
        const newItems = Array.from(group.items);
        const [removed] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, removed);
        
        group.items = newItems;
        newStructure[groupIndex] = group;
        setStructure(newStructure);

        // Persist
        const updates = newItems.map((item, index) => ({
            id: item.id,
            order_index: index
        }));
        await reorderItems(updates, form.id);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'form') {
        await deleteForm(deleteConfirm.id);
        router.push("/audit/form-builder");
    } else if (deleteConfirm.type === 'group') {
        await deleteGroup(deleteConfirm.id, form.id);
        router.refresh();
    } else if (deleteConfirm.type === 'item') {
        await deleteItem(deleteConfirm.id, form.id);
        router.refresh();
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/audit/form-builder")}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{form.title}</h1>
                    <Badge variant={form.status === 'active' ? 'default' : 'secondary'}>
                        {form.status}
                    </Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-1">{form.description}</p>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            {permissions.canUpdate && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            Actions <Settings className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange('draft')}>
                            Set as Draft
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                            Set as Active
                        </DropdownMenuItem>
                        {permissions.canArchive && (
                            <DropdownMenuItem onClick={() => handleStatusChange('archived')}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {permissions.canDelete && (
                            <DropdownMenuItem onClick={() => setDeleteConfirm({ type: 'form', id: form.id, title: form.title })} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Form
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </div>

      <Separator />

      {/* Builder Content */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="groups" type="group">
          {(provided) => (
            <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid gap-6"
            >
                {structure.length === 0 ? (
                    <div 
                    className="text-center py-20 border-2 border-dashed rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground cursor-pointer transition-colors group"
                    onClick={() => setIsAddGroupOpen(true)}
                    >
                        <div className="flex flex-col items-center gap-2">
                        <Layout className="h-8 w-8 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        <p>This form is empty. Click here to add your first group.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {structure.map((group, gIndex) => (
                            <Draggable key={group.id} draggableId={group.id} index={gIndex}>
                                {(provided) => (
                                    <Card 
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="border-l-4 border-l-primary/20 bg-card"
                                    >
                                        <CardHeader className="flex flex-row items-center justify-between py-4">
                                            <div className="flex items-center gap-2">
                                                <div {...provided.dragHandleProps} className="cursor-grab hover:text-primary transition-colors p-1">
                                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                                    <span className="bg-muted w-6 h-6 rounded-full flex items-center justify-center text-xs text-muted-foreground">
                                                        {gIndex + 1}
                                                    </span>
                                                    {group.title}
                                                </CardTitle>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => setIsAddItemOpen({ groupId: group.id, count: group.items.length })} className="gap-2">
                                                    <Plus className="h-3 w-3" /> Add Item
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="icon" variant="ghost">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setDeleteConfirm({ type: 'group', id: group.id, title: group.title })} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Group
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <Droppable droppableId={group.id} type="item">
                                                {(provided) => (
                                                    <div 
                                                        {...provided.droppableProps}
                                                        ref={provided.innerRef}
                                                        className="min-h-[10px]"
                                                    >
                                                        {group.items.length === 0 ? (
                                                            <p className="text-sm text-muted-foreground italic pl-8">No items in this group.</p>
                                                        ) : (
                                                            <div className="space-y-3 pl-2">
                                                                {group.items.map((item, iIndex) => (
                                                                    <Draggable key={item.id} draggableId={item.id} index={iIndex}>
                                                                        {(provided) => (
                                                                            <div 
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                className="group flex items-start gap-4 p-3 rounded-md hover:bg-muted/50 border border-transparent hover:border-border transition-colors bg-card"
                                                                            >
                                                                                <div {...provided.dragHandleProps} className="mt-1 text-muted-foreground cursor-grab hover:text-primary transition-colors p-1">
                                                                                    <GripVertical className="h-4 w-4" />
                                                                                </div>
                                                                                <div className="flex-1 space-y-2">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div className="flex flex-col">
                                                                                            <span className="font-medium text-sm">{item.question_text}</span>
                                                                                            {item.short_name && (
                                                                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                                                                                    {item.short_name}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingItemId(item.id)}>
                                                                                                <Settings className="h-3 w-3" />
                                                                                            </Button>
                                                                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm({ type: 'item', id: item.id, title: item.question_text })}>
                                                                                                <Trash2 className="h-3 w-3" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                                        <Badge variant="outline" className="text-[10px] h-5 px-1 font-normal">
                                                                                            {item.item_type.replace(/_/g, ' ')}
                                                                                        </Badge>
                                                                                        {item.is_required && <span className="text-destructive/80 font-medium">Required</span>}
                                                                                        <span>• {item.options?.length || 0} options</span>
                                                                                    </div>
                                                                                    
                                                                                    {/* Preview of options */}
                                                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                                                        {item.options?.map(opt => (
                                                                                            <Badge 
                                                                                                key={opt.id} 
                                                                                                variant="secondary"
                                                                                                className={cn(
                                                                                                    "text-[10px] h-5 gap-1",
                                                                                                    opt.color === 'success' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200",
                                                                                                    opt.color === 'destructive' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200",
                                                                                                    opt.color === 'warning' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
                                                                                                    opt.is_correct && !opt.color && "border-green-500/50"
                                                                                                )}
                                                                                            >
                                                                                                {opt.label}
                                                                                                {opt.is_correct && <CheckSquare className="h-3 w-3" />}
                                                                                            </Badge>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                ))}
                                                                {provided.placeholder}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </CardContent>
                                    </Card>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {/* Ghost space for adding group */}
                        <div 
                            className="flex items-center justify-center py-4 border-2 border-dashed rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground cursor-pointer transition-colors group"
                            onClick={() => setIsAddGroupOpen(true)}
                        >
                            <Plus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Add Group</span>
                        </div>
                    </div>
                )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Modals */}
      <AddGroupModal 
        isOpen={isAddGroupOpen} 
        onClose={() => setIsAddGroupOpen(false)} 
        onAdd={handleAddGroup} 
      />

      <AddItemModal 
        isOpen={!!isAddItemOpen} 
        onClose={() => setIsAddItemOpen(null)} 
        onAdd={handleAddItem} 
      />

      {editingItem && (
        <EditItemModal 
            isOpen={!!editingItem}
            onClose={() => setEditingItemId(null)}
            item={editingItem}
            formId={form.id}
        />
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
                You are about to delete <strong>{deleteConfirm?.title}</strong>.
                {deleteConfirm?.type === 'group' && " This will also delete all items within this group."}
                {deleteConfirm?.type === 'form' && " This will permanently remove the form and all its contents."}
                This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="gap-2">
                <X className="h-4 w-4" />
                Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2">
                <Trash2 className="h-4 w-4" />
                Delete {deleteConfirm?.type}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
