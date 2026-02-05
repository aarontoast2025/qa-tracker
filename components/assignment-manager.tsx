"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  CheckCircle,
  X,
  Loader2,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  Calendar,
  Ticket,
  UserCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { createAssignments, deleteAssignment } from "@/app/(authenticated)/(standard)/audit/assignments/actions";
import { Specialist, QA, Form, Assignment } from "@/app/(authenticated)/(standard)/audit/assignments/types";
import { cn } from "@/lib/utils";
import { 
    format, 
    startOfWeek, 
    endOfWeek, 
    subDays, 
    addDays, 
    subWeeks, 
    addWeeks, 
    subMonths, 
    addMonths,
    parseISO
} from "date-fns";

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
  onClear: () => void;
}

function MultiSelectFilter({ label, options, selected, onSelect, onClear }: MultiSelectFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed flex gap-2">
          <Filter className="h-3 w-3" />
          <span className="text-xs">{label}</span>
          {selected.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selected.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selected.length > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selected.length} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selected.includes(option))
                    .map((option) => (
                      <Badge variant="secondary" key={option} className="rounded-sm px-1 font-normal">
                        {option}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-2 border-b flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
            {selected.length > 0 && (
                <Button variant="ghost" size="sm" onClick={onClear} className="h-auto p-0 text-[10px] hover:bg-transparent text-primary">Clear</Button>
            )}
        </div>
        <ScrollArea className="h-72">
          <div className="p-2 space-y-1">
            {options.map((option) => (
              <div
                key={option}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground",
                  selected.includes(option) && "bg-accent/50"
                )}
                onClick={() => onSelect(option)}
              >
                <div className={cn(
                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                  selected.includes(option) ? "bg-primary text-primary-foreground" : "opacity-50"
                )}>
                  {selected.includes(option) && <Check className="h-3 w-3" />}
                </div>
                <span>{option}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function Separator({ orientation = "horizontal", className }: { orientation?: "horizontal" | "vertical", className?: string }) {
    return <div className={cn("bg-border shrink-0", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className)} />
}

interface AssignmentManagerProps {
  specialists: Specialist[];
  qas: QA[];
  forms: Form[];
  filterData: { skill: string; channel: string; supervisor: string }[];
  initialAssignments: Assignment[];
  allFilteredAssignments: Assignment[];
  currentUserPermissions: string[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    query: string;
    viewType: 'daily' | 'weekly' | 'monthly';
    viewDate: string;
    filters: {
        skill: string[];
        channel: string[];
        supervisor: string[];
    }
  };
  historyPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    query: string;
    filters: {
        skill: string[];
        channel: string[];
        supervisor: string[];
    }
  }
}

export function AssignmentManager({
  specialists,
  qas,
  forms,
  filterData,
  initialAssignments,
  allFilteredAssignments,
  currentUserPermissions,
  pagination,
  historyPagination
}: AssignmentManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Candidates Section State
  const [searchQuery, setSearchQuery] = useState(pagination.query);
  const [selectedSpecialists, setSelectedSpecialists] = useState<string[]>([]);
  const [selectedQA, setSelectedQA] = useState<string>("");
  const [selectedForm, setSelectedForm] = useState<string>("");
  const [assignmentDate, setAssignmentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // History Section State
  const [assignQuery, setAssignQuery] = useState(historyPagination.query);
  const [expandedQAs, setExpandedQAs] = useState<string[]>([]);
  const [expandedSpecialists, setExpandedSpecialists] = useState<string[]>([]);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

  // Sync assignQuery with historyPagination.query when it changes
  useEffect(() => {
    setAssignQuery(historyPagination.query);
  }, [historyPagination.query]);

  // Date Logic
  const currentDate = parseISO(pagination.viewDate);

  const handlePreviousDate = () => {
    let nextDate;
    if (pagination.viewType === 'daily') nextDate = subDays(currentDate, 1);
    else if (pagination.viewType === 'weekly') nextDate = subWeeks(currentDate, 1);
    else nextDate = subMonths(currentDate, 1);
    updateSearchParams({ viewDate: nextDate.toISOString(), aPage: "1" });
  };

  const handleNextDate = () => {
    let nextDate;
    if (pagination.viewType === 'daily') nextDate = addDays(currentDate, 1);
    else if (pagination.viewType === 'weekly') nextDate = addWeeks(currentDate, 1);
    else nextDate = addMonths(currentDate, 1);
    updateSearchParams({ viewDate: nextDate.toISOString(), aPage: "1" });
  };

  const getDateRangeLabel = () => {
    if (pagination.viewType === 'daily') return format(currentDate, 'MMMM d, yyyy');
    if (pagination.viewType === 'weekly') {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  // Compute Dependent Options
  const options = useMemo(() => {
    const compute = (selSkills: string[], selChannels: string[], selSupervisors: string[]) => {
        const sData = filterData.filter(d => (selChannels.length === 0 || selChannels.includes(d.channel)) && (selSupervisors.length === 0 || selSupervisors.includes(d.supervisor)));
        const cData = filterData.filter(d => (selSkills.length === 0 || selSkills.includes(d.skill)) && (selSupervisors.length === 0 || selSupervisors.includes(d.supervisor)));
        const supData = filterData.filter(d => (selSkills.length === 0 || selSkills.includes(d.skill)) && (selChannels.length === 0 || selChannels.includes(d.channel)));
        return {
            skills: Array.from(new Set(sData.map(d => d.skill))).filter(Boolean).sort(),
            channels: Array.from(new Set(cData.map(d => d.channel))).filter(Boolean).sort(),
            supervisors: Array.from(new Set(supData.map(d => d.supervisor))).filter(Boolean).sort(),
        };
    };
    return {
        candidates: compute(pagination.filters.skill, pagination.filters.channel, pagination.filters.supervisor),
        history: compute(historyPagination.filters.skill, historyPagination.filters.channel, historyPagination.filters.supervisor)
    };
  }, [filterData, pagination.filters, historyPagination.filters]);

  // Debounces
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== pagination.query) updateSearchParams({ query: searchQuery, page: "1" });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (assignQuery !== historyPagination.query) updateSearchParams({ aQuery: assignQuery, aPage: "1" });
    }, 500);
    return () => clearTimeout(timer);
  }, [assignQuery]);

  const updateSearchParams = (updates: Record<string, string | string[]>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      params.delete(key);
      if (Array.isArray(value)) value.forEach(v => params.append(key, v));
      else if (value) params.set(key, value);
    });
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const toggleFilter = (section: 'candidates' | 'history', type: 'skill' | 'channel' | 'supervisor', value: string) => {
    const current = section === 'candidates' 
        ? (pagination.filters as any)[type] 
        : (historyPagination.filters as any)[type];
    
    const updated = current.includes(value) ? current.filter((v: any) => v !== value) : [...current, value];
    const key = section === 'candidates' ? type : `a${type.charAt(0).toUpperCase() + type.slice(1)}`;
    updateSearchParams({ [key]: updated, [section === 'candidates' ? 'page' : 'aPage']: "1" });
  };

  const handleToggleSpecialist = (id: string) => {
    setSelectedSpecialists((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleSelectAllPage = () => {
    const pageIds = specialists.map((s) => s.id);
    const allSelected = pageIds.every((id) => selectedSpecialists.includes(id));
    if (allSelected) {
      setSelectedSpecialists((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedSpecialists((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleAssign = async () => {
    if (selectedSpecialists.length === 0 || !selectedQA || !selectedForm) return;
    setLoading(true);
    const result = await createAssignments(selectedSpecialists.map(sId => {
        const spec = specialists.find(s => s.id === sId);
        return { 
            qa_id: selectedQA, 
            specialist_id: sId, 
            form_id: selectedForm || null, 
            assignment_date: assignmentDate || null,
            supervisor: spec?.supervisor || null
        };
    }));
    if (result.error) setMessage({ type: "error", text: result.error });
    else { setMessage({ type: "success", text: `Successfully assigned ${selectedSpecialists.length} specialists.` }); setSelectedSpecialists([]); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    const result = await deleteAssignment(id);
    if (result.error) setMessage({ type: "error", text: result.error });
    else setMessage({ type: "success", text: "Assignment deleted successfully." });
    setLoading(false);
    setAssignmentToDelete(null);
  };

  const summaries = useMemo(() => {
    const qaMap = new Map();
    const specMap = new Map();
    allFilteredAssignments.forEach(a => {
        const qaId = a.qa_id;
        const specId = a.specialist_id;
        if (!qaMap.has(qaId)) qaMap.set(qaId, { name: `${a.qa?.first_name} ${a.qa?.last_name}`, count: 0, tickets: [] });
        if (!specMap.has(specId)) {
            specMap.set(specId, { 
                name: `${a.specialist?.first_name} ${a.specialist?.last_name}`, 
                eid: (a.specialist as any)?.eid,
                supervisor: (a.specialist as any)?.supervisor,
                count: 0, 
                tickets: [] 
            });
        }
        qaMap.get(qaId).count++; qaMap.get(qaId).tickets.push(a);
        specMap.get(specId).count++; specMap.get(specId).tickets.push(a);
    });
    return {
        qas: Array.from(qaMap.entries()).sort((a, b) => b[1].count - a[1].count),
        specialists: Array.from(specMap.entries()).sort((a, b) => b[1].count - a[1].count),
    };
  }, [allFilteredAssignments]);

  const formatDateLabel = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
        return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch (e) {
        return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Assignment Manager</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-md flex items-center justify-between gap-3 ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          <div className="flex items-center gap-3">{message.type === "success" ? <CheckCircle className="h-5 w-5" /> : <X className="h-5 w-5" />}<span className="text-sm font-medium">{message.text}</span></div>
          <button onClick={() => setMessage(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Candidates Card */}
      <Card className="shadow-sm border-t-4 border-t-primary">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
             <div className="flex flex-col md:flex-row justify-between gap-4">
                <div><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Select Specialists</CardTitle><CardDescription>Filter and select agents or SMEs to assign.</CardDescription></div>
             </div>
             <div className="flex flex-wrap gap-3 items-center pt-2">
                <div className="relative w-full md:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by Name or EID..." className="pl-9 h-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                <MultiSelectFilter label="Skill" options={options.candidates.skills} selected={pagination.filters.skill} onSelect={(v) => toggleFilter('candidates', 'skill', v)} onClear={() => updateSearchParams({ skill: [], page: "1" })} />
                <MultiSelectFilter label="Channel" options={options.candidates.channels} selected={pagination.filters.channel} onSelect={(v) => toggleFilter('candidates', 'channel', v)} onClear={() => updateSearchParams({ channel: [], page: "1" })} />
                <MultiSelectFilter label="Supervisor" options={options.candidates.supervisors} selected={pagination.filters.supervisor} onSelect={(v) => toggleFilter('candidates', 'supervisor', v)} onClear={() => updateSearchParams({ supervisor: [], page: "1" })} />
             </div>
          </div>
          <div className="mt-4 p-4 bg-muted/30 rounded-lg border flex flex-col md:flex-row items-end md:items-center gap-4">
                <div className="flex-1 space-y-1.5"><label className="text-xs font-medium text-muted-foreground uppercase">Assign To (QA)</label><Select value={selectedQA} onValueChange={setSelectedQA}><SelectTrigger className="bg-background"><SelectValue placeholder="Select QA" /></SelectTrigger><SelectContent>{qas.map((qa) => (<SelectItem key={qa.id} value={qa.id}>{qa.first_name} {qa.last_name}</SelectItem>))}</SelectContent></Select></div>
                <div className="flex-1 space-y-1.5"><label className="text-xs font-medium text-muted-foreground uppercase">Evaluation Form</label><Select value={selectedForm} onValueChange={setSelectedForm}><SelectTrigger className="bg-background"><SelectValue placeholder="Select Form" /></SelectTrigger><SelectContent>{forms.map((form) => (<SelectItem key={form.id} value={form.id}>{form.title}</SelectItem>))}</SelectContent></Select></div>
                <div className="flex-1 space-y-1.5"><label className="text-xs font-medium text-muted-foreground uppercase">Assignment Date</label><div className="relative"><Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="date" className="pl-9 bg-background h-10" value={assignmentDate} onChange={(e) => setAssignmentDate(e.target.value)} /></div></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden relative">
            {isPending && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Updating...</span>
                </div>
              </div>
            )}
            <table className="w-full text-sm"><thead className="bg-muted/50 border-b"><tr><th className="px-4 py-3 text-left w-10"><Checkbox checked={specialists.length > 0 && specialists.every(s => selectedSpecialists.includes(s.id))} onCheckedChange={handleSelectAllPage} /></th><th className="px-4 py-3 text-left font-semibold">Name</th><th className="px-4 py-3 text-left font-semibold">EID</th><th className="px-4 py-3 text-left font-semibold">Role</th><th className="px-4 py-3 text-left font-semibold">Supervisor</th></tr></thead><tbody className="divide-y">{specialists.length > 0 ? (specialists.map((s) => (<tr key={s.id} className="hover:bg-muted/20 transition-colors"><td className="px-4 py-3"><Checkbox checked={selectedSpecialists.includes(s.id)} onCheckedChange={() => handleToggleSpecialist(s.id)} /></td><td className="px-4 py-3 font-medium">{s.first_name} {s.last_name}</td><td className="px-4 py-3 text-muted-foreground">{s.eid}</td><td className="px-4 py-3"><Badge variant="outline">{s.role}</Badge></td><td className="px-4 py-3 text-muted-foreground">{s.supervisor}</td></tr>))) : (<tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No specialists found.</td></tr>)}</tbody></table></div></CardContent>
        <CardFooter className="flex flex-col md:flex-row items-center justify-between border-t pt-4 gap-4"><div className="text-xs text-muted-foreground">Showing {Math.min(pagination.total, (pagination.page - 1) * pagination.pageSize + 1)} to {Math.min(pagination.total, pagination.page * pagination.pageSize)} of {pagination.total} entries</div><div className="flex items-center gap-4 w-full md:w-auto justify-between"><Button className="gap-2" disabled={loading || selectedSpecialists.length === 0 || !selectedQA || !selectedForm} onClick={handleAssign}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}Assign {selectedSpecialists.length > 0 ? `(${selectedSpecialists.length})` : ''}</Button><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => updateSearchParams({ page: (pagination.page - 1).toString() })} disabled={pagination.page <= 1}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => updateSearchParams({ page: (pagination.page + 1).toString() })} disabled={pagination.page >= pagination.totalPages}><ChevronRight className="h-4 w-4" /></Button></div></div></CardFooter>
      </Card>

      {/* History Card */}
      <Card className="shadow-sm border-t-4 border-t-secondary">
        <CardHeader className="pb-3">
          <div className="space-y-6">
            <div>
              <CardTitle className="text-xl flex items-center gap-2 text-foreground"><Ticket className="h-5 w-5 text-primary" />Recent Assignments</CardTitle>
              <CardDescription>Track and review assignments for the selected period.</CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative w-full md:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search Name or EID..." className="pl-9 h-9" value={assignQuery} onChange={(e) => setAssignQuery(e.target.value)} /></div>
                <MultiSelectFilter label="Skill" options={options.history.skills} selected={historyPagination.filters.skill} onSelect={(v) => toggleFilter('history', 'skill', v)} onClear={() => updateSearchParams({ aSkill: [], aPage: "1" })} />
                <MultiSelectFilter label="Channel" options={options.history.channels} selected={historyPagination.filters.channel} onSelect={(v) => toggleFilter('history', 'channel', v)} onClear={() => updateSearchParams({ aChannel: [], aPage: "1" })} />
                <MultiSelectFilter label="Supervisor" options={options.history.supervisors} selected={historyPagination.filters.supervisor} onSelect={(v) => toggleFilter('history', 'supervisor', v)} onClear={() => updateSearchParams({ aSupervisor: [], aPage: "1" })} />
            </div>

            <Tabs defaultValue="tickets" className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                    <TabsList className="bg-muted/50">
                        <TabsTrigger value="tickets" className="gap-2"><Ticket className="h-3.5 w-3.5" /> Tickets</TabsTrigger>
                        <TabsTrigger value="qas" className="gap-2"><UserCheck className="h-3.5 w-3.5" /> QAs</TabsTrigger>
                        <TabsTrigger value="specialists" className="gap-2"><Users className="h-3.5 w-3.5" /> Specialists</TabsTrigger>
                    </TabsList>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={pagination.viewType} onValueChange={(v) => updateSearchParams({ viewType: v, aPage: "1" })}>
                            <SelectTrigger className="w-[110px] h-9 text-xs font-bold uppercase tracking-tight"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
                        </Select>
                        <div className="flex items-center bg-background border rounded-md h-9 px-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePreviousDate}><ChevronLeft className="h-4 w-4" /></Button>
                            <div className="px-3 text-xs font-bold uppercase min-w-[140px] text-center">{getDateRangeLabel()}</div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextDate}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                        <Button variant="outline" size="sm" className="h-9 text-xs font-bold uppercase" onClick={() => updateSearchParams({ viewDate: new Date().toISOString(), aPage: "1" })}>Today</Button>
                    </div>
                </div>

                <div className="mt-6">
                    <TabsContent value="tickets" className="mt-0">
                        <div className="rounded-md border overflow-hidden bg-white relative">
                            {isPending && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="text-xs font-medium text-muted-foreground">Loading assignments...</span>
                                    </div>
                                </div>
                            )}
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Assignment Date</th>
                                        <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Specialist</th>
                                        <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Assigned QA</th>
                                        <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Form</th>
                                        <th className="px-4 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {initialAssignments.length > 0 ? (initialAssignments.map(a => (
                                        <tr key={a.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-4 py-3 text-xs font-medium text-foreground">{formatDateLabel(a.assignment_date)}</td>
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                <div className="font-semibold">{a.specialist?.first_name} {a.specialist?.last_name}</div>
                                                <div className="text-[10px] text-muted-foreground">{(a.specialist as any)?.eid}</div>
                                            </td>
                                            <td className="px-4 py-3">{a.qa?.first_name} {a.qa?.last_name}</td>
                                            <td className="px-4 py-3 text-xs">{a.form?.title || "Default"}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive" 
                                                    onClick={() => setAssignmentToDelete(a.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))) : (
                                        <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No assignments in this period.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <CardFooter className="flex items-center justify-between border-t px-0 pt-4"><div className="text-xs text-muted-foreground">Showing {Math.min(historyPagination.total, (historyPagination.page - 1) * historyPagination.pageSize + 1)} to {Math.min(historyPagination.total, historyPagination.page * historyPagination.pageSize)} of {historyPagination.total} assignments</div><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => updateSearchParams({ aPage: (historyPagination.page - 1).toString() })} disabled={historyPagination.page <= 1}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => updateSearchParams({ aPage: (historyPagination.page + 1).toString() })} disabled={historyPagination.page >= historyPagination.totalPages}><ChevronRight className="h-4 w-4" /></Button></div></CardFooter>
                    </TabsContent>
                    <TabsContent value="qas" className="mt-0">
                        <div className="rounded-md border overflow-hidden bg-white relative">
                            {isPending && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="text-xs font-medium text-muted-foreground">Updating summary...</span>
                                    </div>
                                </div>
                            )}
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="w-10 px-4 py-3"></th>
                                        <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider">QA Name</th>
                                        <th className="px-4 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Assignment Count</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {summaries.qas.length > 0 ? (summaries.qas.map(([id, data]) => (
                                        <React.Fragment key={id}>
                                            <tr className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setExpandedQAs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}>
                                                <td className="px-4 py-3 text-center">{expandedQAs.includes(id) ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />}</td>
                                                <td className="px-4 py-3 font-semibold text-primary">{data.name}</td>
                                                <td className="px-4 py-3 text-right"><Badge variant="secondary" className="font-bold">{data.count}</Badge></td>
                                            </tr>
                                            {expandedQAs.includes(id) && data.tickets.map((t: any) => (
                                                <tr key={t.id} className="bg-muted/5 border-l-4 border-l-primary/30 text-[11px]">
                                                    <td className="px-4 py-2"></td>
                                                    <td className="px-4 py-2 pl-8">
                                                        <div className="font-semibold">{t.specialist?.first_name} {t.specialist?.last_name}</div>
                                                        <div className="text-[9px] text-muted-foreground">{t.specialist?.eid}</div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <div className="flex items-center justify-end gap-4">
                                                            <div className="text-muted-foreground">
                                                                <span className="font-bold text-[9px] uppercase mr-1">Sup:</span>
                                                                {t.specialist?.supervisor || '-'}
                                                            </div>
                                                            <div className="text-muted-foreground/60 w-24">
                                                                {formatDateLabel(t.assignment_date)}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))) : (
                                        <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No data available.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                    <TabsContent value="specialists" className="mt-0">
                        <div className="rounded-md border overflow-hidden bg-white relative">
                            {isPending && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="text-xs font-medium text-muted-foreground">Updating summary...</span>
                                    </div>
                                </div>
                            )}
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="w-10 px-4 py-3"></th>
                                        <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Specialist Name</th>
                                        <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Supervisor</th>
                                        <th className="px-4 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Assignment Count</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {summaries.specialists.length > 0 ? (summaries.specialists.map(([id, data]) => (
                                        <React.Fragment key={id}>
                                            <tr className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setExpandedSpecialists(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}>
                                                <td className="px-4 py-3 text-center">{expandedSpecialists.includes(id) ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />}</td>
                                                <td className="px-4 py-3 font-bold text-foreground">{data.name} <span className="ml-2 text-[10px] font-normal text-muted-foreground opacity-70">({data.eid})</span></td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">{data.supervisor || '-'}</td>
                                                <td className="px-4 py-3 text-right"><Badge variant="secondary" className="font-bold">{data.count}</Badge></td>
                                            </tr>
                                            {expandedSpecialists.includes(id) && data.tickets.map((t: any) => (
                                                <tr key={t.id} className="bg-muted/5 border-l-4 border-l-primary/30">
                                                    <td className="px-4 py-2"></td>
                                                    <td colSpan={3} className="px-4 py-2 text-xs pl-8 font-medium text-foreground">
                                                        <div className="flex items-center justify-between">
                                                            <span>Assigned to: {t.qa?.first_name} {t.qa?.last_name}</span>
                                                            <span className="text-muted-foreground">{formatDateLabel(t.assignment_date)}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))) : (
                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No data available.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
          </div>
        </CardHeader>
      </Card>

      <AlertDialog open={!!assignmentToDelete} onOpenChange={(open) => !open && setAssignmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Assignment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                if (assignmentToDelete) handleDelete(assignmentToDelete);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
