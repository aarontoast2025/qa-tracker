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
  Clock,
  PlayCircle,
  Filter,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  parseISO,
  startOfMonth,
  endOfMonth
} from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  qa_id: string;
  specialist_id: string;
  form_id: string | null;
  status: string;
  assignment_date: string | null;
  created_at: string;
  specialist: any;
  form: { title: string } | null;
  supervisor: string | null;
}

interface AssignmentDashboardProps {
  initialAssignments: Assignment[];
  currentUserPermissions: string[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    query: string;
    viewType: 'daily' | 'weekly' | 'monthly';
    viewDate: string;
    status: string;
  };
}

export function AssignmentDashboard({
  initialAssignments,
  currentUserPermissions,
  pagination
}: AssignmentDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(pagination.query);
  const [statusFilter, setStatusFilter] = useState(pagination.status);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== pagination.query) {
        updateSearchParams({ query: searchQuery, page: "1" });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const updateSearchParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  // Date Logic
  const currentDate = parseISO(pagination.viewDate);

  const handlePreviousDate = () => {
    let nextDate;
    if (pagination.viewType === 'daily') nextDate = subDays(currentDate, 1);
    else if (pagination.viewType === 'weekly') nextDate = subWeeks(currentDate, 1);
    else nextDate = subMonths(currentDate, 1);
    updateSearchParams({ viewDate: nextDate.toISOString(), page: "1" });
  };

  const handleNextDate = () => {
    let nextDate;
    if (pagination.viewType === 'daily') nextDate = addDays(currentDate, 1);
    else if (pagination.viewType === 'weekly') nextDate = addWeeks(currentDate, 1);
    else nextDate = addMonths(currentDate, 1);
    updateSearchParams({ viewDate: nextDate.toISOString(), page: "1" });
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Assignment Dashboard</h1>
        <p className="text-muted-foreground">
          Track and manage your assigned evaluations.
        </p>
      </div>

      <Card className="shadow-sm border-t-4 border-t-primary">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4">
             <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    My Assignments
                  </CardTitle>
                </div>
             </div>
             
             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search specialist..." 
                            className="pl-9 h-9" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                        />
                    </div>
                    <Select 
                        value={statusFilter} 
                        onValueChange={(v) => {
                            setStatusFilter(v);
                            updateSearchParams({ status: v, page: "1" });
                        }}
                    >
                        <SelectTrigger className="w-[140px] h-9">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select 
                        value={pagination.viewType} 
                        onValueChange={(v) => updateSearchParams({ viewType: v, page: "1" })}
                    >
                        <SelectTrigger className="w-[110px] h-9 text-xs font-bold uppercase tracking-tight">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex items-center bg-background border rounded-md h-9 px-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePreviousDate}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="px-3 text-xs font-bold uppercase min-w-[140px] text-center">
                            {getDateRangeLabel()}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextDate}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 text-xs font-bold uppercase" 
                        onClick={() => updateSearchParams({ viewDate: new Date().toISOString(), page: "1" })}
                    >
                        Today
                    </Button>
                </div>
             </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border overflow-hidden relative bg-white">
                {isPending && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-xs font-medium text-muted-foreground">Updating...</span>
                        </div>
                    </div>
                )}
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Assignment Date</th>
                            <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Specialist</th>
                            <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Supervisor</th>
                            <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Form</th>
                            <th className="px-4 py-3 text-center font-bold text-[10px] uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {initialAssignments.length > 0 ? (
                            initialAssignments.map((a) => (
                                <tr key={a.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="px-4 py-3 text-xs font-medium text-foreground">
                                        {formatDateLabel(a.assignment_date)}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-foreground">
                                        <div className="font-semibold">{a.specialist?.first_name} {a.specialist?.last_name}</div>
                                        <div className="text-[10px] text-muted-foreground">{(a.specialist as any)?.eid}</div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {a.supervisor || a.specialist?.supervisor || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        {a.form?.title || "Default"}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge 
                                            variant={
                                                a.status === 'completed' ? 'default' : 
                                                a.status === 'in-progress' ? 'secondary' : 
                                                'outline'
                                            }
                                            className="capitalize text-[10px] px-1.5 py-0"
                                        >
                                            {a.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {a.status !== 'completed' ? (
                                            <Button asChild size="sm" variant="ghost" className="h-7 text-xs gap-1 hover:text-primary hover:bg-primary/10">
                                                <Link href={`/audit/evaluation/${a.id}`}>
                                                    Evaluate <ArrowRight className="h-3 w-3" />
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600 gap-1 pointer-events-none opacity-80">
                                                <CheckCircle className="h-3 w-3" /> Done
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <AlertCircle className="h-8 w-8 opacity-20" />
                                        <p>No assignments found for this period.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t pt-4">
            <div className="text-xs text-muted-foreground">
                Showing {Math.min(pagination.total, (pagination.page - 1) * pagination.pageSize + 1)} to {Math.min(pagination.total, pagination.page * pagination.pageSize)} of {pagination.total} entries
            </div>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => updateSearchParams({ page: (pagination.page - 1).toString() })} 
                    disabled={pagination.page <= 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => updateSearchParams({ page: (pagination.page + 1).toString() })} 
                    disabled={pagination.page >= pagination.totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}