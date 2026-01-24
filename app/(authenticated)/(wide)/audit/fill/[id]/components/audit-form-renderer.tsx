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
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditFormRendererProps {
  structure: (AuditGroup & { items: (AuditItem & { options: AuditItemOption[] })[] })[];
}

export function AuditFormRenderer({ structure }: AuditFormRendererProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    structure.forEach(group => {
      group.items.forEach(item => {
        const defaultOpt = item.options?.find(o => o.is_default);
        if (defaultOpt) {
          initial[item.id] = defaultOpt.id;
        }
      });
    });
    return initial;
  });

  const [feedback, setFeedback] = useState<Record<string, string>>({});
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
  };

  const handleFeedbackChange = (itemId: string, text: string) => {
    setFeedback(prev => ({ ...prev, [itemId]: text }));
  };

  const handleGenerate = () => {
    if (window.opener) {
      const automationData = structure.flatMap(g => g.items)
        .filter(item => checkedItems[item.id]) // Only send checked items
        .map(item => {
          const selectedOptionId = answers[item.id];
          const option = item.options?.find(o => o.id === selectedOptionId);
          return {
            id: item.id,
            groupName: structure.find(g => g.items.some(i => i.id === item.id))?.title,
            fullQuestion: item.question_text,
            answer: option?.label || null,
            feedback: feedback[item.id] || "",
            index: item.order_index
          };
        });

      window.opener.postMessage({
        type: 'AUTOMATE_PAGE',
        data: automationData
      }, '*');
    }
  };

  const getOptionStyle = (option: AuditItemOption, isSelected: boolean) => {
    if (!isSelected) return "bg-white border-gray-200 text-gray-600 hover:bg-gray-50";
    
    switch (option.color) {
      case 'success':
        return "bg-green-100 border-green-500 text-green-700 shadow-sm";
      case 'destructive':
        return "bg-red-100 border-red-500 text-red-700 shadow-sm";
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
      default:
        return "bg-blue-50 hover:bg-blue-100/50";
    }
  };

  return (
    <div className="space-y-6 pb-20">
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
                        <span className="text-[10px] font-bold text-primary/70 bg-primary/10 px-2 py-0.5 rounded uppercase">
                            {item.options?.find(o => o.id === answers[item.id])?.label}
                        </span>
                    )}
                    {expandedItems[item.id] ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {expandedItems[item.id] && (
                  <CardContent className="pt-0 pb-4 px-3 border-t bg-white/50">
                    <div className="pt-4 space-y-4">
                      <p className="text-xs text-muted-foreground italic mb-1">
                        {item.question_text}
                      </p>
                      
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

                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-gray-400">Feedback</Label>
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

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex justify-end gap-3 shadow-lg">
        <Button variant="outline" size="lg" className="gap-2 font-bold" onClick={handleGenerate}>
            <CheckCircle2 className="h-5 w-5" />
            Generate
        </Button>
        <Button size="lg" className="gap-2 px-8 font-bold">
            <CheckCircle2 className="h-5 w-5" />
            Submit Audit
        </Button>
      </div>
    </div>
  );
}
