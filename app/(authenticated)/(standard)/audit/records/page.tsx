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
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { 
    ChevronLeft, 
    ChevronRight, 
    ExternalLink,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Clipboard,
    Table as TableIcon,
    RefreshCw
} from "lucide-react";
import { 
    format, 
    startOfDay, 
    endOfDay, 
    startOfWeek, 
    endOfWeek, 
    startOfMonth, 
    endOfMonth, 
    subDays, 
    addDays, 
    subWeeks, 
    addWeeks, 
    subMonths, 
    addMonths,
    differenceInSeconds
} from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";

type FilterType = 'daily' | 'weekly' | 'monthly';

function ElapsedTime({ submittedAt, isCompleted }: { submittedAt: string, isCompleted: boolean }) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        if (isCompleted) return;
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, [isCompleted]);

    if (isCompleted) {
        return (
            <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 w-fit flex items-center gap-1 uppercase tracking-wider">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Completed
            </div>
        );
    }

    const diffInSecs = differenceInSeconds(now, new Date(submittedAt));
    const hours = Math.floor(diffInSecs / 3600);
    const mins = Math.floor((diffInSecs % 3600) / 60);
    const secs = diffInSecs % 60;

    const isLate = diffInSecs >= 1800; // 30 mins

    return (
        <div className={cn(
            "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full w-fit",
            isLate ? "bg-red-100 text-red-600 animate-pulse" : "bg-blue-100 text-blue-600"
        )}>
            {hours > 0 ? `${hours}h ` : ""}{mins}m {secs}s
        </div>
    );
}

export default function AuditRecordsPage() {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<any[]>([]);
    const [filterType, setFilterType] = useState<FilterType>('daily');
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Delete Modal State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        
        let startDate, endDate;

        if (filterType === 'daily') {
            startDate = startOfDay(currentDate);
            endDate = endOfDay(currentDate);
        } else if (filterType === 'weekly') {
            startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
            endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
        } else {
            startDate = startOfMonth(currentDate);
            endDate = endOfMonth(currentDate);
        }

        const { data, error } = await supabase
            .from('audit_submissions')
            .select('*')
            .gte('submitted_at', startDate.toISOString())
            .lte('submitted_at', endDate.toISOString())
            .order('submitted_at', { ascending: false });

        if (error) {
            console.error("Error fetching records:", error);
        } else {
            setRecords(data || []);
        }
        setLoading(false);
    }, [filterType, currentDate]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleUpdateScore = async (id: string, score: string) => {
        const supabase = createClient();
        const numericScore = score === "" ? null : parseFloat(score);
        
        const { error } = await supabase
            .from('audit_submissions')
            .update({ qa_score: numericScore })
            .eq('id', id);

        if (error) {
            toast.error("Failed to update score: " + error.message);
        } else {
            setRecords(prev => prev.map(r => r.id === id ? { ...r, qa_score: numericScore } : r));
        }
    };

    const confirmDelete = (id: string) => {
        setRecordToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!recordToDelete) return;
        
        setIsDeleting(true);
        const supabase = createClient();
        const { error } = await supabase.from('audit_submissions').delete().eq('id', recordToDelete);
        
        if (error) {
            toast.error("Failed to delete record: " + error.message);
        } else {
            toast.success("Record deleted successfully");
            setRecords(prev => prev.filter(r => r.id !== recordToDelete));
        }
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        setRecordToDelete(null);
    };

    const formatDateMMDDYY = (dateStr: string) => {
        if (!dateStr) return "";
        try {
            return format(new Date(dateStr), 'MM/dd/yy');
        } catch (e) {
            return "";
        }
    };

    const copyToAnnotation = (record: any) => {
        const lines = [
            `Interaction ID: ${record.interaction_id || ''}`,
            `Advocate Name: ${record.advocate_name || ''}`,
            `Date of Interaction: ${formatDateMMDDYY(record.interaction_date)}`,
            `Date of Evaluation: ${formatDateMMDDYY(record.evaluation_date)}`,
            `Call ANI/DNIS: ${record.call_ani_dnis || ''}`,
            `Case #: ${record.case_number || ''}`,
            `Call Duration: ${record.call_duration || ''}`,
            `Case Category: ${record.case_category || ''}`,
            `Issue/Concern: ${record.issue_concern || ''}`
        ];
        
        const text = lines.join('\n');
        navigator.clipboard.writeText(text).then(() => {
            toast.success("Details copied for annotation!");
        }).catch(err => {
            toast.error("Failed to copy");
        });
    };

    const copyToWorkbook = async (record: any) => {
        const supabase = createClient();
        
        // Fetch submission items with their question text and group names
        const { data: items, error } = await supabase
            .from('audit_submission_items')
            .select(
                `
                answer_text,
                feedback_text,
                item:tracker_audit_items(
                    question_text,
                    short_name,
                    order_index,
                    group:tracker_audit_groups(title, order_index)
                )
            `)
            .eq('submission_id', record.id);

        if (error) {
            toast.error("Failed to fetch details for workbook");
            return;
        }

        // Organize items by group
        const groupsMap: Record<string, any[]> = {};
        let complexityVal = '';

        items?.forEach((item: any) => {
            const groupTitle = item.item?.group?.title || 'Other';
            if (!groupsMap[groupTitle]) groupsMap[groupTitle] = [];
            groupsMap[groupTitle].push(item);

            // Check if this is the complexity item
            const questionText = item.item?.question_text?.toLowerCase() || '';
            if (questionText.includes('complexity')) {
                complexityVal = item.answer_text || '';
            }
        });

        // Reconstruct the details block
        const detailsLines = [
            `Interaction ID: ${record.interaction_id || ''}`,
            `Advocate Name: ${record.advocate_name || ''}`,
            `Date of Interaction: ${formatDateMMDDYY(record.interaction_date)}`,
            `Date of Evaluation: ${formatDateMMDDYY(record.evaluation_date)}`,
            `Call ANI/DNIS: ${record.call_ani_dnis || ''}`,
            `Case #: ${record.case_number || ''}`,
            `Call Duration: ${record.call_duration || ''}`,
            `Case Category: ${record.case_category || ''}`,
            `Issue/Concern: ${record.issue_concern || ''}`
        ];

        // Sort groups by their order_index if available
        const sortedGroupTitles = Object.keys(groupsMap).sort((a, b) => {
            const orderA = groupsMap[a][0]?.item?.group?.order_index || 0;
            const orderB = groupsMap[b][0]?.item?.group?.order_index || 0;
            return orderA - orderB;
        });

        sortedGroupTitles.forEach(title => {
            detailsLines.push(`\n${title.toUpperCase()}`);
            // Sort items within group by order_index
            const sortedItems = groupsMap[title].sort((a, b) => (a.item?.order_index || 0) - (b.item?.order_index || 0));
            sortedItems.forEach((item: any) => {
                const qText = item.item?.question_text || item.item?.short_name;
                const ans = item.answer_text || '';
                const fb = item.feedback_text || '';
                detailsLines.push(`\n${qText}`);
                detailsLines.push(`${ans} - ${fb}`);
            });
        });

        const details = detailsLines.join('\n');

        // Extract Main/Sub Category
        const category = record.case_category || '';
        let mainCat = category;
        let subCat = '';
        if (category.includes(' > ')) {
            const parts = category.split(' > ');
            mainCat = parts[0];
            subCat = parts.slice(1).join(' > ');
        }

        // Workbook columns: Active | Main Cat | Sub Cat | Details | Date Int | Date Eval | Case # | Int ID | QA Score | Duration | Complexity
        const workbookRow = [
            'Active',
            mainCat,
            subCat,
            `"${details.replace(/"/g, '""')}"`,
            formatDateMMDDYY(record.interaction_date),
            formatDateMMDDYY(record.evaluation_date),
            record.case_number || '',
            record.interaction_id || '',
            record.qa_score ?? '',
            record.call_duration || '',
            complexityVal
        ].join('\t');

        navigator.clipboard.writeText(workbookRow).then(() => {
            toast.success("Copied for workbook!");
        }).catch(err => {
            toast.error("Failed to copy");
        });
    };

    const handlePrevious = () => {
        if (filterType === 'daily') setCurrentDate(prev => subDays(prev, 1));
        else if (filterType === 'weekly') setCurrentDate(prev => subWeeks(prev, 1));
        else setCurrentDate(prev => subMonths(prev, 1));
    };

    const handleNext = () => {
        if (filterType === 'daily') setCurrentDate(prev => addDays(prev, 1));
        else if (filterType === 'weekly') setCurrentDate(prev => addWeeks(prev, 1));
        else setCurrentDate(prev => addMonths(prev, 1));
    };

    const getDateRangeLabel = () => {
        if (filterType === 'daily') {
            return format(currentDate, 'MMMM d, yyyy');
        } else if (filterType === 'weekly') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        } else {
            return format(currentDate, 'MMMM yyyy');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Audit Records</h1>
                    <p className="text-muted-foreground text-sm">
                        View and manage submitted audit records.
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-white/50">
                <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Select value={filterType} onValueChange={(v: FilterType) => setFilterType(v)}>
                                <SelectTrigger className="w-[130px] h-9 text-xs font-bold uppercase tracking-wider">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily View</SelectItem>
                                    <SelectItem value="weekly">Weekly View</SelectItem>
                                    <SelectItem value="monthly">Monthly View</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center bg-background border rounded-md h-9 px-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevious}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="px-3 text-xs font-bold uppercase tracking-tight min-w-[140px] text-center">
                                    {getDateRangeLabel()}
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNext}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 text-xs font-bold uppercase tracking-wider"
                                onClick={() => setCurrentDate(new Date())}
                            >
                                Today
                            </Button>

                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-muted-foreground hover:text-primary"
                                onClick={fetchRecords}
                                disabled={loading}
                                title="Refresh Records"
                            >
                                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                            </Button>
                        </div>

                        <div className="text-xs font-medium text-muted-foreground">
                            {records.length} records found
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border bg-white overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest py-3">Submitted At / Elapsed</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest py-3">Interaction Date</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest py-3">Advocate</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest py-3">Interaction ID</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest py-3">Case #</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest py-3 w-[100px]">QA Score</TableHead>
                                    <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest py-3 w-[120px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                                            Loading records...
                                        </TableCell>
                                    </TableRow>
                                ) : records.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                                            No records found for this period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    records.map((record) => (
                                        <TableRow key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <TableCell className="py-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium">{format(new Date(record.submitted_at), 'MMM d, h:mm a')}</span>
                                                    <ElapsedTime submittedAt={record.submitted_at} isCompleted={record.qa_score !== null && record.qa_score !== undefined} />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className="text-sm">
                                                    {record.interaction_date ? format(new Date(record.interaction_date), 'MMM d, yyyy') : '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className="text-sm">{record.advocate_name || '-'}</span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                {record.page_url ? (
                                                    <a 
                                                        href={record.page_url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors flex items-center w-fit gap-1"
                                                    >
                                                        {record.interaction_id || 'View Link'}
                                                        <ExternalLink className="h-2.5 w-2.5" />
                                                    </a>
                                                ) : (
                                                    <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{record.interaction_id || '-'}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className="text-sm">{record.case_number || '-'}</span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="relative group/input max-w-[80px]">
                                                    <Input 
                                                        type="number"
                                                        className="h-8 text-xs text-center bg-gray-50 focus:bg-white"
                                                        defaultValue={record.qa_score ?? ""}
                                                        onBlur={(e) => handleUpdateScore(record.id, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                (e.target as HTMLInputElement).blur();
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                                                        onClick={() => copyToAnnotation(record)}
                                                        title="Copy for Annotation"
                                                    >
                                                        <Clipboard className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-muted-foreground hover:text-green-600"
                                                        onClick={() => copyToWorkbook(record)}
                                                        title="Copy for Workbook"
                                                    >
                                                        <TableIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                        onClick={() => confirmDelete(record.id)}
                                                        title="Delete"
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

            {/* Uniform Delete Confirmation Modal */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="max-w-[400px]">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 text-destructive mb-2">
                            <div className="p-2 bg-destructive/10 rounded-full">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <AlertDialogTitle className="text-xl">Delete Record?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-sm">
                            Are you sure you want to delete this audit record? This action cannot be undone and will permanently remove the data.
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
                            ) : "Delete Record"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}