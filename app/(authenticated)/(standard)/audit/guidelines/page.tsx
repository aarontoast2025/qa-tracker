"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Book, 
    Loader2, 
    Tag as TagIcon,
    Filter,
    ChevronDown,
    ChevronUp,
    X,
    AlertTriangle,
    Save,
    Activity,
    Type,
    FileText,
    AlertCircle,
    Info,
    Trash
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconInput } from "@/components/icon-input";
import { AutocompleteInput } from "@/components/autocomplete-input";
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

type DefinitionRow = {
    text: string;
    is_important: boolean;
};

export default function GuidelinesPage() {
    const [loading, setLoading] = useState(true);
    const [guidelines, setGuidelines] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [topicFilter, setTopicFilter] = useState("all");
    const [skillFilter, setSkillFilter] = useState("all");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGuideline, setEditingGuideline] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Delete Modal State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [guidelineToDelete, setGuidelineToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchGuidelines = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        
        let query = supabase.from('guidelines').select('*').order('topic', { ascending: true });

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching guidelines:", error);
            toast.error("Failed to load guidelines");
        } else {
            setGuidelines(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchGuidelines();
    }, [fetchGuidelines]);

    const handleSave = async (formData: any) => {
        setIsSaving(true);
        const supabase = createClient();
        
        const data = {
            topic: formData.topic,
            title: formData.title,
            content: formData.content,
            description: formData.definitions, 
            skill: formData.skill === "none" || formData.skill === "" ? null : formData.skill,
            tags: formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== "")
        };

        let error;
        if (editingGuideline) {
            const { error: err } = await supabase
                .from('guidelines')
                .update(data)
                .eq('id', editingGuideline.id);
            error = err;
        } else {
            const { error: err } = await supabase
                .from('guidelines')
                .insert(data);
            error = err;
        }

        if (error) {
            toast.error("Failed to save guideline: " + error.message);
        } else {
            toast.success(editingGuideline ? "Guideline updated" : "Guideline created");
            setIsModalOpen(false);
            fetchGuidelines();
        }
        setIsSaving(false);
    };

    const confirmDelete = (id: string) => {
        setGuidelineToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!guidelineToDelete) return;
        
        setIsDeleting(true);
        const supabase = createClient();
        const { error } = await supabase.from('guidelines').delete().eq('id', guidelineToDelete);
        
        if (error) {
            toast.error("Failed to delete guideline");
        } else {
            toast.success("Guideline deleted");
            setGuidelines(prev => prev.filter(g => g.id !== guidelineToDelete));
        }
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        setGuidelineToDelete(null);
    };

    const filteredGuidelines = guidelines.filter(g => {
        const matchesSearch = 
            g.topic.toLowerCase().includes(search.toLowerCase()) || 
            g.title.toLowerCase().includes(search.toLowerCase()) ||
            (g.content || "").toLowerCase().includes(search.toLowerCase());
        
        const matchesTopic = topicFilter === "all" || g.topic === topicFilter;
        const matchesSkill = skillFilter === "all" || g.skill === skillFilter;

        return matchesSearch && matchesTopic && matchesSkill;
    });

    const uniqueTopics = Array.from(new Set(guidelines.map(g => g.topic))).sort();
    const uniqueSkills = Array.from(new Set(guidelines.map(g => g.skill).filter(Boolean) as string[])).sort();

    return (
        <div className="space-y-6 w-full max-w-6xl mx-auto px-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Book className="h-6 w-6 text-primary" />
                        Guidelines
                    </h1>
                    <p className="text-muted-foreground text-sm ml-8">
                        Manage knowledge base guidelines and templates.
                    </p>
                </div>
                <Button onClick={() => { setEditingGuideline(null); setIsModalOpen(true); }} className="gap-2 shadow-sm">
                    <Plus className="h-4 w-4" />
                    Add Guideline
                </Button>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search topics, titles, or tags..." 
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                    <SelectTrigger className="w-[180px]">
                        <div className="flex items-center gap-2">
                            <Filter className="h-3.5 w-3.5 opacity-50" />
                            <SelectValue placeholder="All Topics" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Topics</SelectItem>
                        {uniqueTopics.map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={skillFilter} onValueChange={setSkillFilter}>
                    <SelectTrigger className="w-[180px]">
                        <div className="flex items-center gap-2">
                            <Activity className="h-3.5 w-3.5 opacity-50" />
                            <SelectValue placeholder="All Skills" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Skills</SelectItem>
                        {uniqueSkills.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(search || topicFilter !== "all" || skillFilter !== "all") && (
                    <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setTopicFilter("all"); setSkillFilter("all"); }} className="gap-2">
                        <X className="h-4 w-4" />
                        Clear
                    </Button>
                )}
            </div>

            <Card className="border-none shadow-sm bg-white/50">
                <CardContent className="p-0">
                    <div className="rounded-md border bg-white overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="w-[250px] text-[10px] font-bold uppercase tracking-widest py-3">Topic</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest py-3">Title</TableHead>
                                    <TableHead className="w-[150px] text-[10px] font-bold uppercase tracking-widest py-3">Skill</TableHead>
                                    <TableHead className="w-[100px] text-right text-[10px] font-bold uppercase tracking-widest py-3">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredGuidelines.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                                            No guidelines found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredGuidelines.map((g) => (
                                        <TableRow key={g.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <TableCell className="font-medium align-top py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm">{g.topic}</span>
                                                    {g.tags && g.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {g.tags.map((tag: string) => (
                                                                <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm align-top py-4">{g.title}</TableCell>
                                            <TableCell className="align-top py-4">
                                                {g.skill ? (
                                                    <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-tight">
                                                        {g.skill}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Generic</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right align-top py-4">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        onClick={() => { setEditingGuideline(g); setIsModalOpen(true); }}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                        onClick={() => confirmDelete(g.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <GuidelineModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                editingData={editingGuideline}
                isSaving={isSaving}
                existingSkills={uniqueSkills}
            />

            {/* Delete Confirmation Modal */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="max-w-[400px]">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 text-destructive mb-2">
                            <div className="p-2 bg-destructive/10 rounded-full">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <AlertDialogTitle className="text-xl">Delete Guideline?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-sm">
                            Are you sure you want to delete this guideline? This action cannot be undone and will permanently remove the data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel disabled={isDeleting} className="font-bold uppercase tracking-wider text-xs h-9">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90 font-bold uppercase tracking-wider text-xs h-9"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : "Delete Guideline"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function GuidelineModal({ isOpen, onClose, onSave, editingData, isSaving, existingSkills }: any) {
    const [formData, setFormData] = useState({
        topic: "",
        title: "",
        content: "",
        definitions: [] as DefinitionRow[],
        skill: "",
        tags: ""
    });

    useEffect(() => {
        if (editingData) {
            setFormData({
                topic: editingData.topic || "",
                title: editingData.title || "",
                content: editingData.content || "",
                definitions: Array.isArray(editingData.description) ? editingData.description : [],
                skill: editingData.skill || "",
                tags: (editingData.tags || []).join(", ")
            });
        } else {
            setFormData({
                topic: "",
                title: "",
                content: "",
                definitions: [{ text: "", is_important: false }],
                skill: "",
                tags: ""
            });
        }
    }, [editingData, isOpen]);

    const addDefinitionRow = () => {
        setFormData(prev => ({
            ...prev,
            definitions: [...prev.definitions, { text: "", is_important: false }]
        }));
    };

    const updateDefinitionRow = (index: number, field: keyof DefinitionRow, value: any) => {
        const newDefs = [...formData.definitions];
        newDefs[index] = { ...newDefs[index], [field]: value };
        setFormData(prev => ({ ...prev, definitions: newDefs }));
    };

    const removeDefinitionRow = (index: number) => {
        setFormData(prev => ({
            ...prev,
            definitions: prev.definitions.filter((_, i) => i !== index)
        }));
    };

    const moveDefinitionRow = (index: number, direction: 'up' | 'down') => {
        const newDefs = [...formData.definitions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newDefs.length) return;
        
        [newDefs[index], newDefs[targetIndex]] = [newDefs[targetIndex], newDefs[index]];
        setFormData(prev => ({ ...prev, definitions: newDefs }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center gap-2">
                        {editingData ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                        {editingData ? "Edit Guideline" : "Add Guideline"}
                    </DialogTitle>
                    <DialogDescription>
                        Define documentation standards, process steps, or internal knowledge.
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6 pr-4">
                        <div className="grid grid-cols-2 gap-4">
                            <IconInput 
                                label="Topic"
                                icon={Filter}
                                placeholder="e.g., Case Notes, Escalations" 
                                value={formData.topic}
                                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                            />
                            <IconInput 
                                label="Title / Type"
                                icon={Type}
                                placeholder="e.g., Template, Expert Process" 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <AutocompleteInput
                                label="Skill / Team"
                                icon={Activity}
                                id="skill"
                                value={formData.skill}
                                options={existingSkills}
                                onChange={(v) => setFormData({...formData, skill: v})}
                            />
                            <IconInput 
                                label="Tags (comma separated)"
                                icon={TagIcon}
                                placeholder="e.g., expert, doc, required" 
                                value={formData.tags}
                                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Content / Template
                            </Label>
                            <Textarea 
                                id="content" 
                                placeholder="The actual template or short instruction..." 
                                className="font-mono min-h-[100px] text-sm"
                                value={formData.content}
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                    <AlertCircle className="h-4 w-4" />
                                    Definition Points
                                </Label>
                                <span className="text-[10px] text-muted-foreground italic">Press 'Enter' in a row to add a new one</span>
                            </div>
                            
                            <div className="rounded-md border overflow-hidden bg-white shadow-inner">
                                <div className="max-h-[300px] overflow-y-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm border-b">
                                            <TableRow>
                                                <TableHead className="w-[40px] text-center p-2"></TableHead>
                                                <TableHead className="p-2">Point / Explanation</TableHead>
                                                <TableHead className="w-[120px] p-2 text-right"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {formData.definitions.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-8 text-xs text-muted-foreground italic">
                                                        No points added. Start typing...
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                formData.definitions.map((row, index) => (
                                                    <TableRow key={index} className="group/row hover:bg-gray-50/50">
                                                        <TableCell className="p-2 text-center">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className={cn(
                                                                    "h-7 w-7 transition-colors",
                                                                    row.is_important 
                                                                        ? "text-red-600 hover:text-red-700 hover:bg-red-50" 
                                                                        : "text-gray-300 hover:text-blue-600 hover:bg-blue-50"
                                                                )}
                                                                onClick={() => updateDefinitionRow(index, "is_important", !row.is_important)}
                                                                title={row.is_important ? "Mark as Normal" : "Mark as Important"}
                                                            >
                                                                <AlertCircle className={cn(
                                                                    "h-4 w-4",
                                                                    row.is_important && "fill-red-50"
                                                                )} />
                                                            </Button>
                                                        </TableCell>
                                                        <TableCell className="p-2">
                                                            <Input 
                                                                className="h-8 text-xs border-transparent focus:border-input bg-transparent focus:bg-white transition-all"
                                                                placeholder="Enter detail point..."
                                                                value={row.text}
                                                                onChange={(e) => updateDefinitionRow(index, "text", e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        addDefinitionRow();
                                                                    }
                                                                }}
                                                                autoFocus={index === formData.definitions.length - 1 && index > 0}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-2 text-right">
                                                            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                                    onClick={() => moveDefinitionRow(index, 'up')}
                                                                    disabled={index === 0}
                                                                >
                                                                    <ChevronUp className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                                    onClick={() => moveDefinitionRow(index, 'down')}
                                                                    disabled={index === formData.definitions.length - 1}
                                                                >
                                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => removeDefinitionRow(index)}
                                                                >
                                                                    <Trash className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 pt-2 border-t bg-gray-50/50">
                    <Button variant="outline" onClick={onClose} disabled={isSaving} className="gap-2 shadow-sm">
                        <X className="h-4 w-4" />
                        Cancel
                    </Button>
                    <Button onClick={() => onSave(formData)} disabled={isSaving || !formData.topic || !formData.title} className="gap-2 shadow-sm">
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {editingData ? "Update Guideline" : "Create Guideline"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
