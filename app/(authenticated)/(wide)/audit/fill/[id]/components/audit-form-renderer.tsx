"use client";

import { useState, useEffect } from "react";
import { AuditGroup, AuditItem, AuditItemOption } from "@/app/(authenticated)/(standard)/audit/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { IconInput } from "@/components/icon-input";
import { IconTextarea } from "@/components/icon-textarea";
import { 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Loader2,
  Hash,
  User,
  Phone,
  FileText,
  Clock,
  Tag,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface AuditFormRendererProps {
  structure: (AuditGroup & { items: (AuditItem & { options: AuditItemOption[] })[] })[];
}

export function AuditFormRenderer({ structure }: AuditFormRendererProps) {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);
  const [headerData, setHeaderData] = useState({
      interaction_id: "",
      advocate_name: "",
      call_ani_dnis: "",
      interaction_date: "",
      evaluation_date: new Date().toISOString().split('T')[0],
      case_number: "",
      call_duration: "",
      case_category: "",
      issue_concern: "",
      page_url: ""
  });

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [transcript, setTranscript] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Initialize defaults only if no existing record
  useEffect(() => {
    if (existingRecordId) return;
    
    const initialAnswers: Record<string, string> = {};
    const initialFeedback: Record<string, string> = {};
    
    structure.forEach(group => {
      group.items.forEach(item => {
        const defaultOpt = item.options?.find(o => o.is_default);
        if (defaultOpt) {
          initialAnswers[item.id] = defaultOpt.id;
          const generalText = defaultOpt.feedback_general?.[0]?.feedback_text;
          if (generalText) {
            initialFeedback[item.id] = generalText;
          }
        }
      });
    });
    setAnswers(initialAnswers);
    setFeedback(initialFeedback);
  }, [structure, existingRecordId]);

  useEffect(() => {
      const urlParam = searchParams.get('url');
      if (urlParam) {
          setHeaderData(prev => ({ ...prev, page_url: urlParam }));
          checkExistingRecord(urlParam);
      }
      
      // Auto-populate from host page if running in popup
      if (window.opener) {
          try {
              // We need to request data from the host page because we can't directly 
              // access the DOM of the opener if it's on a different origin (CORS).
              // However, since this is a bookmarklet context, the bookmarklet script 
              // on the host page can send the data.
              window.addEventListener('message', (e) => {
                  if (e.data.type === 'HOST_PAGE_DATA') {
                      const data = e.data.data;
                      setHeaderData(prev => ({
                          ...prev,
                          interaction_id: data.interaction_id || prev.interaction_id,
                          advocate_name: data.advocate_name || prev.advocate_name,
                          call_ani_dnis: data.ani || data.dnis || prev.call_ani_dnis,
                          call_duration: data.duration || prev.call_duration
                      }));
                      if (data.transcript) {
                          setTranscript(data.transcript);
                      }
                  }
              });

              // Request data from bookmarklet
              window.opener.postMessage({ type: 'REQUEST_HOST_DATA' }, '*');
          } catch (err) {
              console.error("Failed to communicate with host page", err);
          }
      }
  }, [searchParams]);

  const handleSummarize = async () => {
      if (!transcript) {
          toast.error("No transcript found to summarize.");
          return;
      }

      setIsSummarizing(true);
      try {
          const response = await fetch('/api/summarize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transcript })
          });

          const data = await response.json();
          if (data.summary) {
              setHeaderData(prev => ({ ...prev, issue_concern: data.summary }));
              toast.success("Summary generated!");
          } else {
              toast.error(data.error || "Failed to generate summary");
          }
      } catch (err) {
          toast.error("Error calling summary API");
      } finally {
          setIsSummarizing(false);
      }
  };

  const checkExistingRecord = async (url: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
          .from('audit_submissions')
          .select('*, items:audit_submission_items(*)')
          .eq('page_url', url)
          .maybeSingle();

      if (data) {
          setExistingRecordId(data.id);
          setHeaderData({
              interaction_id: data.interaction_id || "",
              advocate_name: data.advocate_name || "",
              call_ani_dnis: data.call_ani_dnis || "",
              interaction_date: data.interaction_date ? data.interaction_date.split('T')[0] : "",
              evaluation_date: data.evaluation_date ? data.evaluation_date.split('T')[0] : new Date().toISOString().split('T')[0],
              case_number: data.case_number || "",
              call_duration: data.call_duration || "",
              case_category: data.case_category || "",
              issue_concern: data.issue_concern || "",
              page_url: data.page_url || ""
          });

          const loadedAnswers: Record<string, string> = {};
          const loadedFeedback: Record<string, string> = {};
          const loadedTags: Record<string, string[]> = {};
          data.items.forEach((item: any) => {
              if (item.item_id) {
                  loadedAnswers[item.item_id] = item.answer_id;
                  loadedFeedback[item.item_id] = item.feedback_text;
                  loadedTags[item.item_id] = item.selected_tags || [];
              }
          });
          setAnswers(loadedAnswers);
          setFeedback(loadedFeedback);
          setSelectedTagIds(loadedTags);
          
          toast.info("Existing record found and loaded.");
      }
  };
  const [selectedTagIds, setSelectedTagIds] = useState<Record<string, string[]>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const toggleCheck = (itemId: string, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: checked }));
  };

  const handleAnswerChange = (itemId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [itemId]: optionId }));
    setSelectedTagIds(prev => ({ ...prev, [itemId]: [] }));
    
    // Automatically populate general feedback if available
    const item = structure.flatMap(g => g.items).find(i => i.id === itemId);
    const option = item?.options?.find(o => o.id === optionId);
    
    const generalText = option?.feedback_general?.[0]?.feedback_text;
    if (generalText) {
      setFeedback(prev => ({ ...prev, [itemId]: generalText }));
    } else {
      setFeedback(prev => ({ ...prev, [itemId]: "" }));
    }
  };

  const handleTagClick = (itemId: string, tag: { id: string, feedback_text: string }) => {
    setSelectedTagIds(prev => {
        const currentIds = prev[itemId] || [];
        const isSelected = currentIds.includes(tag.id);
        const newIds = isSelected 
            ? currentIds.filter(id => id !== tag.id)
            : [...currentIds, tag.id];
        
        // Re-calculate feedback text based on selected tags
        const item = structure.flatMap(g => g.items).find(i => i.id === itemId);
        const optionId = answers[itemId];
        const option = item?.options?.find(o => o.id === optionId);
        
        if (newIds.length > 0) {
            // Join feedback from all selected tags
            const tagsFeedback = option?.feedback_tags
                ?.filter(t => newIds.includes(t.id))
                .map(t => t.feedback_text)
                .join(" ");
            setFeedback(f => ({ ...f, [itemId]: tagsFeedback || "" }));
        } else {
            // Revert to general feedback
            setFeedback(f => ({ ...f, [itemId]: option?.feedback_general?.[0]?.feedback_text || "" }));
        }

        return { ...prev, [itemId]: newIds };
    });
  };

  const handleFeedbackChange = (itemId: string, text: string) => {
    setFeedback(prev => ({ ...prev, [itemId]: text }));
  };

  const handleGenerate = (showToastOnSuccess = true) => {
    if (window.opener) {
      const allItems = structure.flatMap(g => g.items);
      const hasChecked = allItems.some(item => checkedItems[item.id]);
      
      const itemsToProcess = hasChecked 
        ? allItems.filter(item => checkedItems[item.id])
        : allItems;

      const automationData = itemsToProcess.map(item => {
          const selectedOptionId = answers[item.id];
          const option = item.options?.find(o => o.id === selectedOptionId);
          const selectedTags = option?.feedback_tags
            ?.filter(t => selectedTagIds[item.id]?.includes(t.id))
            .map(t => t.tag_label) || [];
            
          return {
            id: item.id,
            groupName: structure.find(g => g.items.some(i => i.id === item.id))?.title,
            fullQuestion: item.question_text,
            answer: option?.label || null,
            feedback: feedback[item.id] || "",
            tags: selectedTags,
            index: item.order_index
          };
        });

      window.opener.postMessage({
        type: 'AUTOMATE_PAGE',
        data: automationData
      }, '*');

      if (showToastOnSuccess) {
        toast.success("Automation started on host page!");
      }
    }
  };

  const handleSaveAndGenerate = async () => {
    const success = await handleSubmit();
    if (success) {
      handleGenerate(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const supabase = createClient();
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        let submissionId = existingRecordId;

        // 1. Create or Update Submission
        if (existingRecordId) {
            const { error: subError } = await supabase.from('audit_submissions').update({
                ...headerData,
                submitted_by: user.id
            }).eq('id', existingRecordId);
            if (subError) throw subError;
        } else {
            const { data: submission, error: subError } = await supabase.from('audit_submissions').insert({
                form_id: structure[0]?.form_id,
                ...headerData,
                submitted_by: user.id
            }).select().single();
            if (subError) throw subError;
            submissionId = submission.id;
            setExistingRecordId(submissionId);
        }

        // 2. Sync Items
        const allItems = structure.flatMap(g => g.items);
        const hasChecked = allItems.some(item => checkedItems[item.id]);
        
        // If items are checked, we only update/insert those. 
        // However, the current logic is delete-all-and-reinsert.
        // To match user request: "If there are specific items that are checked, 
        // then the save generate save&generate will be working on those checked items only."
        // We need to decide if "working on" means "only these are saved to DB" 
        // or "only these are updated".
        
        const itemsToProcess = hasChecked 
            ? allItems.filter(item => checkedItems[item.id])
            : allItems;

        if (existingRecordId) {
            // Only delete the items we are about to re-insert to avoid wiping others if checked
            if (hasChecked) {
                const itemIdsToProcess = itemsToProcess.map(i => i.id);
                await supabase.from('audit_submission_items')
                    .delete()
                    .eq('submission_id', existingRecordId)
                    .in('item_id', itemIdsToProcess);
            } else {
                const { error: delError } = await supabase.from('audit_submission_items').delete().eq('submission_id', existingRecordId);
                if (delError) throw delError;
            }
        }

        const itemsToInsert = itemsToProcess.map(item => {
            const selectedOptionId = answers[item.id];
            const option = item.options?.find(o => o.id === selectedOptionId);
            return {
                submission_id: submissionId,
                item_id: item.id,
                answer_id: selectedOptionId || null,
                answer_text: option?.label || null,
                feedback_text: feedback[item.id] || "",
                selected_tags: selectedTagIds[item.id] || []
            };
        });

        const { error: itemsError } = await supabase.from('audit_submission_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        toast.success(existingRecordId ? "Audit updated successfully!" : "Audit submitted successfully!");
        return true;
    } catch (e: any) {
        console.error(e);
        toast.error("Error saving audit: " + e.message);
        return false;
    } finally {
        setIsSubmitting(false);
    }
  };

  const getOptionStyle = (option: AuditItemOption, isSelected: boolean) => {
    if (!isSelected) return "bg-white border-gray-200 text-gray-600 hover:bg-gray-50";
    
    switch (option.color) {
      case 'success':
        return "bg-green-100 border-green-500 text-green-700 shadow-sm";
      case 'destructive':
        return "bg-red-100 border-red-500 text-red-700 shadow-sm";
      case 'warning':
        return "bg-amber-100 border-amber-500 text-amber-700 shadow-sm";
      default:
        return "bg-primary/10 border-primary text-primary shadow-sm";
    }
  };

  const getHeaderStyle = (itemId: string) => {
    const selectedOptionId = answers[itemId];
    if (!selectedOptionId) return "hover:bg-gray-50/50";

    const item = structure.flatMap(g => g.items).find(i => i.id === itemId);
    const option = item?.options?.find(o => o.id === selectedOptionId);

    if (!option) return "hover:bg-gray-50/50";

    switch (option.color) {
      case 'success':
        return "bg-green-50 hover:bg-green-100/50";
      case 'destructive':
        return "bg-red-50 hover:bg-red-100/50";
      case 'warning':
        return "bg-amber-50 hover:bg-amber-100/50";
      default:
        return "bg-blue-50 hover:bg-blue-100/50";
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="space-y-4 mb-8 bg-white/50 p-4 rounded-lg border">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Audit Details</h2>
        
        <div className="grid grid-cols-3 gap-2">
            <div>
                <IconInput 
                    icon={Hash} 
                    placeholder="Interaction ID" 
                    id="interaction_id" 
                    value={headerData.interaction_id} 
                    onChange={e => setHeaderData({...headerData, interaction_id: e.target.value})} 
                    className="text-sm h-9"
                />
            </div>
            <div>
                <IconInput 
                    icon={User} 
                    placeholder="Advocate Name" 
                    id="advocate_name" 
                    value={headerData.advocate_name} 
                    onChange={e => setHeaderData({...headerData, advocate_name: e.target.value})} 
                    className="text-sm h-9"
                />
            </div>
            <div>
                <IconInput 
                    icon={Phone} 
                    placeholder="Call ANI/DNIS" 
                    id="call_ani_dnis" 
                    value={headerData.call_ani_dnis} 
                    onChange={e => setHeaderData({...headerData, call_ani_dnis: e.target.value})} 
                    className="text-sm h-9"
                />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
                <Label htmlFor="interaction_date" className="text-xs text-muted-foreground">Date of Interaction</Label>
                <Input type="date" id="interaction_date" value={headerData.interaction_date} onChange={e => setHeaderData({...headerData, interaction_date: e.target.value})} className="text-sm h-9" />
            </div>
            <div className="space-y-1">
                <Label htmlFor="evaluation_date" className="text-xs text-muted-foreground">Date of Evaluation</Label>
                <Input type="date" id="evaluation_date" value={headerData.evaluation_date} onChange={e => setHeaderData({...headerData, evaluation_date: e.target.value})} className="text-sm h-9" />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
            <div>
                <IconInput 
                    icon={FileText} 
                    placeholder="Case #" 
                    id="case_number" 
                    value={headerData.case_number} 
                    onChange={e => setHeaderData({...headerData, case_number: e.target.value})} 
                    className="text-sm h-9"
                />
            </div>
            <div>
                <IconInput 
                    icon={Clock} 
                    placeholder="Call Duration" 
                    id="call_duration" 
                    value={headerData.call_duration} 
                    onChange={e => setHeaderData({...headerData, call_duration: e.target.value})} 
                    className="text-sm h-9"
                />
            </div>
        </div>

        <div>
            <IconInput 
                icon={Tag} 
                placeholder="Case Category" 
                id="case_category" 
                value={headerData.case_category} 
                onChange={e => setHeaderData({...headerData, case_category: e.target.value})} 
                className="text-sm h-9"
            />
        </div>

        <div className="relative">
            <IconTextarea 
                icon={AlertCircle}
                placeholder="Issue/Concern" 
                id="issue_concern" 
                value={headerData.issue_concern} 
                onChange={e => setHeaderData({...headerData, issue_concern: e.target.value})} 
                className="text-sm min-h-[80px] resize-y pr-12"
                rows={3}
            />
            {transcript && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-2 top-2 h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                    title="Generate Summary from Transcript"
                >
                    {isSummarizing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4" /> 
                    )}
                </Button>
            )}
        </div>
      </div>

      {structure.map((group) => (
        <div key={group.id} className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {group.title}
          </h2>
          
          <div className="space-y-2">
            {group.items.map((item) => (
              <Card key={item.id} className={cn(
                "transition-all border shadow-none overflow-hidden",
                checkedItems[item.id] ? "border-primary/30 ring-1 ring-primary/10" : "border-gray-200"
              )}>
                <div 
                  className={cn(
                    "flex items-center justify-between p-3 cursor-pointer transition-colors",
                    getHeaderStyle(item.id)
                  )}
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      id={`check-${item.id}`}
                      checked={checkedItems[item.id] || false}
                      onCheckedChange={(checked) => toggleCheck(item.id, !!checked)}
                    />
                    <Label 
                      htmlFor={`check-${item.id}`}
                      className="text-sm font-bold cursor-pointer uppercase tracking-tight"
                    >
                      {item.short_name || item.question_text}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    {answers[item.id] && (
                        <div 
                          className="text-primary/60 hover:text-primary transition-colors p-1"
                          title={`Selected: ${item.options?.find(o => o.id === answers[item.id])?.label}`}
                        >
                            <Info className="h-4 w-4" />
                        </div>
                    )}
                    {expandedItems[item.id] ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {expandedItems[item.id] && (
                  <CardContent className="pt-0 pb-4 px-3 border-t bg-white/50">
                    <div className="pt-4 space-y-4">
                      {item.item_type === 'dropdown_custom' ? (
                        <Select 
                          value={answers[item.id]} 
                          onValueChange={(val) => handleAnswerChange(item.id, val)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an answer..." />
                          </SelectTrigger>
                          <SelectContent>
                            {item.options?.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {item.options?.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => handleAnswerChange(item.id, opt.id)}
                              className={cn(
                                "flex-1 min-w-[60px] py-2 px-3 text-xs font-bold rounded-md border transition-all uppercase tracking-wider",
                                getOptionStyle(opt, answers[item.id] === opt.id)
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Targeted Feedback Tags */}
                      {answers[item.id] && item.options?.find(o => o.id === answers[item.id])?.feedback_tags?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {item.options?.find(o => o.id === answers[item.id])?.feedback_tags?.map((tag: any) => {
                            const isActive = selectedTagIds[item.id]?.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                onClick={() => handleTagClick(item.id, tag)}
                                className={cn(
                                    "text-[10px] font-bold px-2 py-1 rounded transition-all uppercase tracking-tight border",
                                    isActive 
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground border-transparent"
                                )}
                              >
                                {isActive ? "✓" : "+"} {tag.tag_label}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      <div className="space-y-1.5">
                        <Textarea 
                          placeholder="Type your feedback here..."
                          className="min-h-[60px] text-sm resize-y"
                          rows={2}
                          value={feedback[item.id] || ""}
                          onChange={(e) => handleFeedbackChange(item.id, e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex justify-end gap-3 shadow-lg z-10">
        <Button variant="outline" size="sm" className="font-bold h-9" onClick={() => window.close()}>
            Cancel
        </Button>
        <Button variant="outline" size="sm" className="font-bold h-9 bg-green-50 text-green-700 border-green-200 hover:bg-green-100" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save
        </Button>
        <Button variant="outline" size="sm" className="font-bold h-9 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" onClick={() => handleGenerate()}>
            Generate
        </Button>
        <Button size="sm" className="font-bold h-9 bg-primary px-6" onClick={handleSaveAndGenerate} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save & Generate
        </Button>
      </div>
    </div>
  );
}
