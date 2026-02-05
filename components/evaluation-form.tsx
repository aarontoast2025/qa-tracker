"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Send, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { saveEvaluation, submitEvaluation } from "@/app/(authenticated)/(standard)/audit/evaluation/[id]/actions";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  label: string;
  value: string;
  color: string;
  is_default: boolean;
  is_correct: boolean;
  order_index: number;
}

interface Item {
  id: string;
  label: string;
  short_name: string;
  type: "toggle" | "dropdown";
  form_item_options: Option[];
}

interface Section {
  id: string;
  title: string;
  form_items: Item[];
}

interface FormTemplate {
  id: string;
  title: string;
  description: string;
  form_sections: Section[];
}

interface EvaluationFormProps {
  assignmentId: string;
  formTemplate: FormTemplate;
  initialData?: any; // Existing evaluation data if resuming
  specialistName: string;
}

export function EvaluationForm({ 
  assignmentId, 
  formTemplate, 
  initialData,
  specialistName 
}: EvaluationFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>(initialData?.form_data || {});
  const [metadata, setMetadata] = useState({
    interaction_id: initialData?.interaction_id || "",
    call_ani: initialData?.call_ani || "",
    case_number: initialData?.case_number || "",
    call_duration: initialData?.call_duration || "",
    case_category: initialData?.case_category || "",
    issue_concern: initialData?.issue_concern || "",
    date_interaction: initialData?.date_interaction ? new Date(initialData.date_interaction).toISOString().split('T')[0] : "",
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize defaults
  useEffect(() => {
    if (!initialData?.form_data) {
      const defaults: Record<string, any> = {};
      formTemplate.form_sections.forEach(section => {
        section.form_items.forEach(item => {
          const defaultOpt = item.form_item_options.find(o => o.is_default);
          if (defaultOpt) {
            defaults[item.id] = {
              option_id: defaultOpt.id,
              value: defaultOpt.value,
              notes: ""
            };
          }
        });
      });
      // Only set if we really have defaults and no existing answers
      if (Object.keys(defaults).length > 0 && Object.keys(answers).length === 0) {
        setAnswers(defaults);
      }
    }
  }, [formTemplate]);

  const calculateScore = useMemo(() => {
    let totalItems = 0;
    let correctItems = 0;

    formTemplate.form_sections.forEach(section => {
      section.form_items.forEach(item => {
        const answer = answers[item.id];
        if (answer?.option_id) {
          totalItems++;
          const selectedOpt = item.form_item_options.find(o => o.id === answer.option_id);
          if (selectedOpt?.is_correct) {
            correctItems++;
          }
        }
      });
    });

    return totalItems === 0 ? 0 : Math.round((correctItems / totalItems) * 100);
  }, [answers, formTemplate]);

  const handleAnswerChange = (itemId: string, optionId: string) => {
    const section = formTemplate.form_sections.find(s => s.form_items.find(i => i.id === itemId));
    const item = section?.form_items.find(i => i.id === itemId);
    const option = item?.form_item_options.find(o => o.id === optionId);

    if (option) {
      setAnswers(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          option_id: optionId,
          value: option.value
        }
      }));
    }
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setAnswers(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes
      }
    }));
  };

  const handleMetadataChange = (field: string, value: string) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    // Basic validation
    if (!metadata.case_number) return "Case Number is required";
    if (!metadata.interaction_id) return "Interaction ID is required";
    return null;
  };

  const handleSave = async (isSubmit = false) => {
    if (isSubmit) {
        const error = validateForm();
        if (error) {
            toast.error(error);
            return;
        }
    }

    const loadingState = isSubmit ? setIsSubmitting : setIsSaving;
    loadingState(true);

    try {
      const payload = {
        assignmentId,
        formId: formTemplate.id,
        metadata,
        formData: answers,
        score: calculateScore,
        status: isSubmit ? 'completed' : 'in-progress'
      };

      const result = isSubmit 
        ? await submitEvaluation(payload)
        : await saveEvaluation(payload);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isSubmit ? "Evaluation submitted successfully!" : "Draft saved successfully");
        if (isSubmit) {
          router.push("/audit/dashboard");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      loadingState(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/audit/dashboard">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{formTemplate.title}</h1>
                <p className="text-muted-foreground text-sm">Evaluating: <span className="font-semibold text-foreground">{specialistName}</span></p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right mr-4 hidden md:block">
                <div className="text-xs text-muted-foreground uppercase font-bold">Current Score</div>
                <div className={cn(
                    "text-2xl font-bold",
                    calculateScore >= 90 ? "text-green-600" : 
                    calculateScore >= 75 ? "text-yellow-600" : "text-red-600"
                )}>
                    {calculateScore}%
                </div>
            </div>
            <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving || isSubmitting}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Draft
            </Button>
            <Button onClick={() => handleSave(true)} disabled={isSaving || isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Submit Evaluation
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Metadata Column */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Call Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Interaction ID <span className="text-red-500">*</span></Label>
                        <Input 
                            value={metadata.interaction_id} 
                            onChange={(e) => handleMetadataChange('interaction_id', e.target.value)}
                            placeholder="e.g., INT-123456"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Case Number <span className="text-red-500">*</span></Label>
                        <Input 
                            value={metadata.case_number} 
                            onChange={(e) => handleMetadataChange('case_number', e.target.value)}
                            placeholder="e.g., CS-987654"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Call ANI</Label>
                        <Input 
                            value={metadata.call_ani} 
                            onChange={(e) => handleMetadataChange('call_ani', e.target.value)}
                            placeholder="Caller Number"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Date of Interaction</Label>
                        <Input 
                            type="date"
                            value={metadata.date_interaction} 
                            onChange={(e) => handleMetadataChange('date_interaction', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input 
                            value={metadata.call_duration} 
                            onChange={(e) => handleMetadataChange('call_duration', e.target.value)}
                            placeholder="e.g., 15:30"
                        />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Input 
                            value={metadata.case_category} 
                            onChange={(e) => handleMetadataChange('case_category', e.target.value)}
                            placeholder="Call Category"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Issue/Concern</Label>
                        <Textarea 
                            value={metadata.issue_concern} 
                            onChange={(e) => handleMetadataChange('issue_concern', e.target.value)}
                            placeholder="Brief description of the issue..."
                            className="min-h-[100px]"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Evaluation Form Column */}
        <div className="lg:col-span-2 space-y-6">
            {formTemplate.form_sections.map((section) => (
                <Card key={section.id} className="border-t-4 border-t-primary/50">
                    <CardHeader className="bg-muted/10 pb-4">
                        <CardTitle className="text-xl">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {section.form_items.length === 0 && (
                            <div className="text-muted-foreground text-sm italic">No items in this section.</div>
                        )}
                        
                        {section.form_items.map((item) => {
                            const answer = answers[item.id] || {};
                            const selectedOpt = item.form_item_options.find(o => o.id === answer.option_id);
                            
                            return (
                                <div key={item.id} className="space-y-3 pb-6 border-b last:border-0 last:pb-0">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-start justify-between gap-4">
                                            <Label className="text-base font-medium leading-relaxed flex-1">
                                                {item.label}
                                            </Label>
                                            {selectedOpt && (
                                                <Badge 
                                                    className={cn(
                                                        "whitespace-nowrap",
                                                        selectedOpt.color === 'green' && "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
                                                        selectedOpt.color === 'red' && "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
                                                        selectedOpt.color === 'yellow' && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
                                                        selectedOpt.color === 'gray' && "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200",
                                                    )}
                                                    variant="outline"
                                                >
                                                    {selectedOpt.is_correct ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                                                    {selectedOpt.label}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="pt-2">
                                            {item.type === 'toggle' ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {item.form_item_options.map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => handleAnswerChange(item.id, opt.id)}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                                                                answer.option_id === opt.id
                                                                    ? cn(
                                                                        "ring-2 ring-offset-1",
                                                                        opt.color === 'green' && "bg-green-500 text-white border-green-600 ring-green-500",
                                                                        opt.color === 'red' && "bg-red-500 text-white border-red-600 ring-red-500",
                                                                        opt.color === 'yellow' && "bg-yellow-500 text-white border-yellow-600 ring-yellow-500",
                                                                        opt.color === 'gray' && "bg-gray-500 text-white border-gray-600 ring-gray-500",
                                                                    )
                                                                    : "bg-white hover:bg-muted text-muted-foreground border-input"
                                                            )}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Select 
                                                    value={answer.option_id} 
                                                    onValueChange={(val) => handleAnswerChange(item.id, val)}
                                                >
                                                    <SelectTrigger className="w-full md:w-[300px]">
                                                        <SelectValue placeholder="Select an option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {item.form_item_options.map((opt) => (
                                                            <SelectItem key={opt.id} value={opt.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className={cn(
                                                                        "w-2 h-2 rounded-full",
                                                                        opt.color === 'green' && "bg-green-500",
                                                                        opt.color === 'red' && "bg-red-500",
                                                                        opt.color === 'yellow' && "bg-yellow-500",
                                                                        opt.color === 'gray' && "bg-gray-500",
                                                                    )} />
                                                                    {opt.label}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>

                                        <div className="pt-2">
                                            <Input 
                                                placeholder="Add notes..." 
                                                value={answer.notes || ""}
                                                onChange={(e) => handleNotesChange(item.id, e.target.value)}
                                                className="bg-muted/20 text-sm border-transparent focus:bg-white transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
