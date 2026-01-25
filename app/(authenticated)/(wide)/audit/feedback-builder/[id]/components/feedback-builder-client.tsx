"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
    Plus, 
    Trash2, 
    Save, 
    MessageSquare, 
    Tag as TagIcon,
    ArrowLeft,
    Edit2,
    Check,
    X
} from "lucide-react";
import { 
    updateOptionFeedback, 
    saveItemTag, 
    deleteItemTag 
} from "../../actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { 
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TagModal } from "./tag-modal";
import { DeleteConfirmModal } from "./delete-confirm-modal";
import { Badge } from "@/components/ui/badge";

interface FeedbackBuilderClientProps {
  form: any;
}

export function FeedbackBuilderClient({ form }: FeedbackBuilderClientProps) {
  const router = useRouter();
  
  // State for navigation
  const [activeGroupId, setActiveGroupId] = useState<string>(form.tracker_audit_groups[0]?.id || "");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // State for editing
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [tempFeedback, setTempFeedback] = useState("");
  const [tagModal, setTagModal] = useState<{ isOpen: boolean; optionId: string; tag?: any } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; tagId: string } | null>(null);

  const activeGroup = useMemo(() => 
    form.tracker_audit_groups.find((g: any) => g.id === activeGroupId),
    [form.tracker_audit_groups, activeGroupId]
  );

  const activeItem = useMemo(() => 
    activeGroup?.tracker_audit_items.find((i: any) => i.id === activeItemId),
    [activeGroup, activeItemId]
  );

  // Auto-select first item when group changes
  useEffect(() => {
    if (activeGroup && !activeItemId) {
        setActiveItemId(activeGroup.tracker_audit_items[0]?.id || null);
    } else if (activeGroup && activeItemId) {
        const itemExists = activeGroup.tracker_audit_items.some((i: any) => i.id === activeItemId);
        if (!itemExists) {
            setActiveItemId(activeGroup.tracker_audit_items[0]?.id || null);
        }
    }
  }, [activeGroupId, activeGroup]);

  const handleStartEditing = (option: any) => {
    setEditingOptionId(option.id);
    const feedback = option.feedback_general?.[0]?.feedback_text || "";
    setTempFeedback(feedback);
  };

  const handleSaveFeedback = async (optionId: string) => {
    await updateOptionFeedback(optionId, tempFeedback, form.id);
    setEditingOptionId(null);
  };

  const handleDeleteTag = async () => {
    if (deleteModal) {
        await deleteItemTag(deleteModal.tagId, form.id);
        setDeleteModal(null);
    }
  };

  const sortedOptions = useMemo(() => {
    if (!activeItem) return [];
    return [...activeItem.tracker_audit_item_options].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  }, [activeItem]);

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/audit/feedback-builder")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{form.title}</h1>
            <p className="text-xs text-muted-foreground">Feedback Template Builder</p>
          </div>
        </div>
        <Button size="sm" className="gap-2" onClick={() => router.refresh()}>
            <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="w-[450px] flex flex-col border rounded-lg bg-card shadow-sm overflow-hidden shrink-0 h-full">
          <div className="p-4 border-b bg-muted/30 shrink-0">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Groups</Label>
            <Tabs value={activeGroupId} onValueChange={setActiveGroupId} className="w-full mt-2">
              <TabsList className="grid grid-cols-2 w-full h-auto bg-muted/50 p-1">
                {form.tracker_audit_groups.map((group: any) => (
                  <TabsTrigger 
                    key={group.id} 
                    value={group.id}
                    className="text-sm py-2 px-2 font-semibold truncate transition-all"
                  >
                    {group.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 pb-2 shrink-0">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Line Items</Label>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-2 space-y-1">
                {activeGroup?.tracker_audit_items.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)).map((item: any) => (
                  <Button
                    key={item.id}
                    variant={activeItemId === item.id ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-left h-auto py-2.5 px-3 transition-all text-sm",
                      activeItemId === item.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setActiveItemId(item.id)}
                  >
                    <span className="line-clamp-2 leading-tight">
                      {item.question_text}
                    </span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Stage */}
        <div className="flex-1 border rounded-lg bg-card shadow-sm overflow-hidden flex flex-col h-full min-h-0">
          {activeItem ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/10 shrink-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                        {activeGroup?.title}
                    </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight">{activeItem.question_text}</h2>
              </div>

              <ScrollArea className="flex-1 min-h-0">
                <div className="p-6 space-y-8 max-w-5xl">
                  {/* Default Feedback Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        <h3 className="text-lg font-bold">Default Feedback</h3>
                    </div>

                    <div className={cn(
                        "grid gap-4",
                        sortedOptions.length === 2 ? "grid-cols-2" : "grid-cols-1"
                    )}>
                        {sortedOptions.map((option: any) => (
                            <div key={option.id} className="relative group border rounded-xl p-4 bg-muted/5 hover:bg-muted/10 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">{option.label}</span>
                                        <span className="text-[10px] text-muted-foreground">Database Value: '{option.label.toLowerCase()}'</span>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] uppercase font-bold px-2 py-0",
                                        option.is_correct ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                                    )}>
                                        {option.is_correct ? "Good Outcome" : "Bad Outcome"}
                                    </Badge>
                                </div>

                                {editingOptionId === option.id ? (
                                    <div className="space-y-2">
                                        <Textarea 
                                            value={tempFeedback}
                                            onChange={(e) => setTempFeedback(e.target.value)}
                                            className="bg-white text-sm min-h-[100px] resize-none"
                                            placeholder={`Write default feedback for "${option.label}"...`}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => setEditingOptionId(null)} className="h-7 gap-1">
                                                <X className="h-3 w-3" /> Cancel
                                            </Button>
                                            <Button size="sm" onClick={() => handleSaveFeedback(option.id)} className="h-7 gap-1 px-3">
                                                <Check className="h-3 w-3" /> Save
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        className="text-sm text-muted-foreground italic leading-relaxed min-h-[60px] cursor-pointer hover:text-foreground transition-colors pr-8"
                                        onClick={() => handleStartEditing(option)}
                                    >
                                        {option.feedback_general?.[0]?.feedback_text || `No default feedback defined for "${option.label}". Click to edit.`}
                                        <Edit2 className="h-3 w-3 absolute right-4 top-[50px] opacity-0 group-hover:opacity-40" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                  </div>

                  {/* Targeted Tags Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1 bg-purple-500 rounded-full" />
                            <h3 className="text-lg font-bold">Sub-Reason Tags (Badges)</h3>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-primary hover:bg-primary/5 gap-2 h-8 font-semibold"
                            onClick={() => setTagModal({ isOpen: true, optionId: sortedOptions[0]?.id || "" })}
                        >
                            <Plus className="h-4 w-4" /> Add Tag
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {sortedOptions.some(o => o.feedback_tags?.length > 0) ? (
                            sortedOptions.flatMap(o => o.feedback_tags.map((t: any) => ({ ...t, option_label: o.label, option_is_correct: o.is_correct, option_id: o.id }))).map((tag: any) => (
                                <div key={tag.id} className="flex items-start gap-4 p-4 border rounded-xl bg-white group hover:shadow-sm transition-all">
                                    <div className="flex flex-col items-center gap-1 shrink-0 w-24 pt-1">
                                        <span className="text-[9px] uppercase font-bold text-muted-foreground">Trigger</span>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 whitespace-nowrap",
                                            tag.option_is_correct ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                        )}>
                                            {tag.option_label} {tag.option_is_correct ? "(Good)" : "(Bad)"}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex-1 space-y-1">
                                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none px-2 py-0 text-[10px] font-bold">
                                            {tag.tag_label}
                                        </Badge>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{tag.feedback_text}</p>
                                    </div>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setTagModal({ isOpen: true, optionId: tag.option_id, tag })}>
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteModal({ isOpen: true, tagId: tag.id })}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-muted-foreground/50">
                                <TagIcon className="h-8 w-8 mb-2 opacity-20" />
                                <p className="text-sm italic">No targeted tags configured for this item.</p>
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
              <MessageSquare className="h-12 w-12 opacity-10 mb-4" />
              <h3 className="font-medium">Select an item to edit feedback</h3>
            </div>
          )}
        </div>
      </div>

      {tagModal && (
        <TagModal 
            isOpen={tagModal.isOpen}
            onClose={() => setTagModal(null)}
            optionId={tagModal.optionId}
            tag={tagModal.tag}
            formId={form.id}
            onSave={saveItemTag}
            options={sortedOptions}
        />
      )}

      {deleteModal && (
        <DeleteConfirmModal 
            isOpen={deleteModal.isOpen}
            onClose={() => setDeleteModal(null)}
            onConfirm={handleDeleteTag}
            title="Delete Targeted Tag"
            description="Are you sure you want to delete this targeted feedback tag? This action cannot be undone."
        />
      )}
    </div>
  );
}