"use client";

import { useState, useEffect, useCallback } from "react";
import { AuditItem, AuditItemOption } from "../../../types";
import { 
    updateItem as updateItemAction,
    syncItem
} from "../../../actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
    Loader2, Trash2, Settings, Type, FileText, 
    CheckCircle2, Save, X, Plus, Hash, Star
} from "lucide-react";
import { IconInput } from "@/components/icon-input";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AuditItem & { options: AuditItemOption[] };
  formId: string;
}

export function EditItemModal({ isOpen, onClose, item, formId }: EditItemModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState(item.question_text);
  const [shortName, setShortName] = useState(item.short_name || "");
  const [type, setType] = useState<AuditItem['item_type']>(item.item_type || 'toggle_yes_no');
  const [required, setRequired] = useState(item.is_required);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [localOptions, setLocalOptions] = useState<Partial<AuditItemOption>[]>(item.options || []);

  useEffect(() => {
    setQuestion(item.question_text);
    setShortName(item.short_name || "");
    setType(item.item_type || 'toggle_yes_no');
    setRequired(item.is_required);
    setLocalOptions(item.options || []);
  }, [item, isOpen]);

  const handleSave = async () => {
    setLoading(true);
    try {
        const result = await syncItem(
            item.id,
            {
                question_text: question,
                short_name: shortName,
                item_type: type,
                is_required: required
            },
            localOptions.map((opt, index) => ({
                id: opt.id?.toString().startsWith('temp-') ? null : opt.id,
                label: opt.label!,
                value: opt.value!,
                is_default: opt.is_default!,
                is_correct: opt.is_correct!,
                color: opt.color || 'default',
                order_index: index
            })),
            formId
        );

        if (result.success) {
            onClose();
        } else {
            alert(result.error || "Failed to save changes");
        }
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleTypeChange = (newType: AuditItem['item_type']) => {
    setType(newType);
    
    // If switching to Yes/No, automatically create Yes and No options
    if (newType === 'toggle_yes_no') {
        setLocalOptions([
            {
                id: 'temp-yes',
                label: "Yes",
                value: "yes",
                is_default: true,
                is_correct: true,
                color: "success"
            },
            {
                id: 'temp-no',
                label: "No",
                value: "no",
                is_default: false,
                is_correct: false,
                color: "destructive"
            }
        ]);
    }
  };

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;
    
    const isFirstOption = localOptions.length === 0;
    const newOption: Partial<AuditItemOption> = {
        id: `temp-${Date.now()}`,
        label: newOptionLabel,
        value: newOptionLabel.toLowerCase().replace(/\s/g, '_'),
        is_default: isFirstOption,
        is_correct: true,
        color: 'default'
    };
    
    setLocalOptions([...localOptions, newOption]);
    setNewOptionLabel("");
  };

  const handleUpdateOptionLabel = (optionId: string | undefined, newLabel: string) => {
      setLocalOptions(localOptions.map(opt => 
          opt.id === optionId 
            ? { ...opt, label: newLabel, value: newLabel.toLowerCase().replace(/\s/g, '_') } 
            : opt
      ));
  };

  const handleDeleteOption = (optionId: string | undefined) => {
      setLocalOptions(localOptions.filter(opt => opt.id !== optionId));
  };

  const handleToggleCorrect = (optionId: string | undefined) => {
      setLocalOptions(localOptions.map(opt => 
          opt.id === optionId ? { ...opt, is_correct: !opt.is_correct } : opt
      ));
  };

  const handleSetDefault = (optionId: string | undefined) => {
      setLocalOptions(localOptions.map(opt => ({
          ...opt,
          is_default: opt.id === optionId
      })));
  };

  const isCustomType = type === 'toggle_custom' || type === 'dropdown_custom';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Edit Line Item
          </DialogTitle>
          <DialogDescription>
            Configure the question name and how it should be answered. Changes are only saved when you click 'Save Changes'.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IconInput
                    id="question"
                    label="Full Line Item Name"
                    icon={Type}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter the full question text"
                />

                <IconInput
                    id="shortName"
                    label="Shortened Name"
                    icon={FileText}
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    placeholder="Internal reference name"
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="type" className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        Answer Type
                    </Label>
                    <Select value={type} onValueChange={(v: any) => handleTypeChange(v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="toggle_yes_no">Toggle (Yes/No)</SelectItem>
                            <SelectItem value="toggle_custom">Toggle (User-defined)</SelectItem>
                            <SelectItem value="dropdown_custom">Dropdown (User-defined)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-end pb-2">
                    <div className="flex items-center space-x-2">
                        <Switch id="required" checked={required} onCheckedChange={setRequired} />
                        <Label htmlFor="required">Required Field</Label>
                    </div>
                </div>
            </div>
            
            <div className="space-y-4">
                <Label className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    Answers / Options
                </Label>
                
                {type === 'toggle_yes_no' ? (
                    <div className="bg-muted/50 p-4 rounded-lg border border-dashed text-center text-sm text-muted-foreground">
                        <p>Standard <strong>Yes/No</strong> options are automatically assigned for this type.</p>
                        <div className="flex justify-center gap-4 mt-2">
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 flex items-center gap-1">
                                Yes (Correct) {localOptions.find(o => o.label?.toLowerCase() === 'yes')?.is_default && <Star className="h-3 w-3 fill-current" />}
                            </Badge>
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-3 py-1">No (Incorrect)</Badge>
                        </div>
                        <p className="mt-2 text-[10px] italic">You can customize these by switching to 'User-defined' types.</p>
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Option Label</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead className="w-[100px]">Default</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {localOptions.map((opt) => (
                                    <TableRow key={opt.id}>
                                        <TableCell className="py-2">
                                            <Input 
                                                defaultValue={opt.label} 
                                                onBlur={(e) => {
                                                    if (e.target.value !== opt.label && e.target.value.trim()) {
                                                        handleUpdateOptionLabel(opt.id, e.target.value);
                                                    }
                                                }}
                                                className="h-8 border-transparent focus:border-input bg-transparent hover:bg-muted/50 transition-colors"
                                            />
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className={cn(
                                                    "h-8 w-full justify-start gap-2 text-[10px] px-2",
                                                    opt.is_correct ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-muted-foreground hover:text-foreground"
                                                )}
                                                onClick={() => handleToggleCorrect(opt.id)}
                                            >
                                                {opt.is_correct ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                                                {opt.is_correct ? "Correct" : "Incorrect"}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className={cn(
                                                    "h-8 w-full justify-start gap-2 text-[10px] px-2",
                                                    opt.is_default ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-muted-foreground hover:text-foreground"
                                                )}
                                                onClick={() => handleSetDefault(opt.id)}
                                            >
                                                {opt.is_default ? <Star className="h-3 w-3 fill-current" /> : <Star className="h-3 w-3" />}
                                                {opt.is_default ? "Default" : "Set Default"}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 text-destructive" 
                                                onClick={() => handleDeleteOption(opt.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {/* New Option Row */}
                                <TableRow className="bg-primary/5">
                                    <TableCell className="py-2">
                                        <div className="relative">
                                            <Plus className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-primary/50" />
                                            <Input 
                                                placeholder="Type here to add new option..." 
                                                value={newOptionLabel}
                                                onChange={(e) => setNewOptionLabel(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                                                onBlur={handleAddOption}
                                                className="h-8 pl-7 border-none bg-transparent focus-visible:ring-0 placeholder:italic placeholder:text-primary/30 text-sm"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell colSpan={3} className="text-[10px] text-primary/50 italic">
                                        Press Enter to add (locally)
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}