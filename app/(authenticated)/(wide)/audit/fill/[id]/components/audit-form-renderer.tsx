"use client";

import { useState } from "react";
import { AuditGroup, AuditItem, AuditItemOption } from "../../../../types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditFormRendererProps {
  structure: (AuditGroup & { items: (AuditItem & { options: AuditItemOption[] })[] })[];
}

export function AuditFormRenderer({ structure }: AuditFormRendererProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    // Initialize with defaults
    const initial: Record<string, string> = {};
    structure.forEach(group => {
      group.items.forEach(item => {
        const defaultOpt = item.options.find(o => o.is_default);
        if (defaultOpt) {
          initial[item.id] = defaultOpt.id;
        }
      });
    });
    return initial;
  });

  const handleAnswerChange = (itemId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [itemId]: optionId }));
  };

  return (
    <div className="space-y-8">
      {structure.map((group) => (
        <div key={group.id} className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2 flex items-center gap-2">
            <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">
              {group.order_index + 1}
            </span>
            {group.title}
          </h2>
          
          <div className="space-y-4">
            {group.items.map((item) => (
              <Card key={item.id} className={cn(
                "transition-all border-l-4",
                answers[item.id] ? "border-l-primary/50" : "border-l-muted"
              )}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                        <Label className="text-base font-medium leading-tight">
                            {item.question_text}
                            {item.is_required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                    </div>

                    {item.item_type === 'dropdown_custom' ? (
                      <Select 
                        value={answers[item.id]} 
                        onValueChange={(val) => handleAnswerChange(item.id, val)}
                      >
                        <SelectTrigger className="w-full md:w-[300px]">
                          <SelectValue placeholder="Select an answer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {item.options.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <RadioGroup 
                        value={answers[item.id]} 
                        onValueChange={(val) => handleAnswerChange(item.id, val)}
                        className="flex flex-wrap gap-4"
                      >
                        {item.options.map((opt) => (
                          <div key={opt.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={opt.id} id={opt.id} />
                            <Label 
                              htmlFor={opt.id}
                              className={cn(
                                "cursor-pointer px-3 py-1.5 rounded-md border transition-colors",
                                answers[item.id] === opt.id 
                                    ? "bg-primary/10 border-primary text-primary" 
                                    : "hover:bg-muted"
                              )}
                            >
                              {opt.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <div className="pt-6 border-t flex justify-end">
        <Button size="lg" className="gap-2 px-8">
            <CheckCircle2 className="h-5 w-5" />
            Submit Audit
        </Button>
      </div>
    </div>
  );
}
