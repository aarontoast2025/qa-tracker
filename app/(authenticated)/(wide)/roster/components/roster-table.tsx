"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Search, Trash, Edit, UserPlus, Filter, ChevronLeft, ChevronRight, ChevronDown, Trash2, User, Users, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import { Employee, EmployeeInput, RosterMetadata } from "../types";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeDetailsModal } from "./employee-details-modal";
import { getStatusColor } from "../utils";
import { BulkUploadModal } from "./bulk-upload-modal";
import { BulkEditModal } from "./bulk-edit-modal";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface RosterTableProps {
  employees: Employee[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    total: number;
    query: string;
    sort: string;
    order: "asc" | "desc";
    filters: {
        status: string[];
        role: string[];
        skill: string[];
        tier: string[];
        channel: string[];
        supervisor: string[];
    }
  };
  canAdd: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onAdd: () => void;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onBulkUpload: (employees: EmployeeInput[]) => Promise<{ success: boolean; addedCount: number; skippedCount: number; errors: string[] }>;
  onBulkDelete: (ids: string[]) => Promise<{ success?: boolean; error?: string }>;
  onBulkUpdate: (ids: string[], updates: Partial<EmployeeInput>) => Promise<void>;
  metadata: RosterMetadata;
}

export function RosterTable({ 
  employees, 
  pagination,
  canAdd, 
  canUpdate, 
  canDelete,
  onAdd,
  onEdit,
  onDelete,
  onBulkUpload,
  onBulkDelete,
  onBulkUpdate,
  metadata
}: RosterTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(pagination.query);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);

  // Sync internal state with prop if it changes externally
  useEffect(() => {
    setSearchTerm(pagination.query);
  }, [pagination.query]);

  const updateUrl = useCallback((updates: { 
    page?: number; 
    pageSize?: number; 
    query?: string; 
    filters?: Partial<typeof pagination.filters>;
    sort?: string; 
    order?: "asc" | "desc" 
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.page !== undefined) params.set("page", updates.page.toString());
    if (updates.pageSize !== undefined) params.set("pageSize", updates.pageSize.toString());
    if (updates.query !== undefined) {
        if (updates.query) params.set("query", updates.query);
        else params.delete("query");
    }

    if (updates.filters) {
        // Handle Status
        if (updates.filters.status !== undefined) {
            params.delete("status");
            updates.filters.status.forEach(v => params.append("status", v));
        }
        // Handle Role
        if (updates.filters.role !== undefined) {
            params.delete("role");
            updates.filters.role.forEach(v => params.append("role", v));
        }
        // Handle Skill
        if (updates.filters.skill !== undefined) {
            params.delete("skill");
            updates.filters.skill.forEach(v => params.append("skill", v));
        }
        // Handle Tier
        if (updates.filters.tier !== undefined) {
            params.delete("tier");
            updates.filters.tier.forEach(v => params.append("tier", v));
        }
        // Handle Channel
        if (updates.filters.channel !== undefined) {
            params.delete("channel");
            updates.filters.channel.forEach(v => params.append("channel", v));
        }
        // Handle Supervisor
        if (updates.filters.supervisor !== undefined) {
            params.delete("supervisor");
            updates.filters.supervisor.forEach(v => params.append("supervisor", v));
        }
    }

    if (updates.sort !== undefined) params.set("sort", updates.sort);
    if (updates.order !== undefined) params.set("order", updates.order);

    router.push(`?${params.toString()}`);
  }, [searchParams, router, pagination.filters]);

  const handleSort = (column: string) => {
      const isAsc = pagination.sort === column && pagination.order === "asc";
      updateUrl({ sort: column, order: isAsc ? "desc" : "asc", page: 1 });
  };

  const renderSortIcon = (column: string) => {
      if (pagination.sort !== column) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
      return pagination.order === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== pagination.query) {
        updateUrl({ query: searchTerm, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.query, updateUrl]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(employees.map(e => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkDeleteConfirm = async () => {
    await onBulkDelete(selectedIds);
    setSelectedIds([]);
    setIsBulkDeleteAlertOpen(false);
  };

  const handleBulkUpdateConfirm = async (updates: Partial<EmployeeInput>) => {
    await onBulkUpdate(selectedIds, updates);
    setSelectedIds([]); // Clear selection after update
    // setIsBulkEditModalOpen(false) is handled by the modal onSave wrapper if needed, 
    // but here we just pass the async function. The modal closes itself.
  };

  // Helper for multi-select logic
  const toggleFilter = (current: string[], value: string) => {
    if (current.includes(value)) {
        return current.filter(v => v !== value);
    }
    return [...current, value];
  };

  const MultiSelectFilter = ({ 
    title, 
    options, 
    selected, 
    onUpdate 
  }: { 
    title: string, 
    options: string[], 
    selected: string[], 
    onUpdate: (newValues: string[]) => void 
  }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={`h-8 border-dashed ${selected.length > 0 ? "text-primary border-primary bg-primary/5" : ""}`}>
                <Filter className="mr-2 h-4 w-4" />
                {title}
                {selected.length > 0 && (
                    <>
                        <DropdownMenuSeparator className="mx-2 h-4" />
                        <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                            {selected.length}
                        </Badge>
                    </>
                )}
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>{title}</DropdownMenuLabel>
            <DropdownMenuSeparator />
             <ScrollArea className="max-h-[300px] overflow-y-auto">
            {options.map((option) => {
                const isSelected = selected.includes(option);
                return (
                    <DropdownMenuCheckboxItem
                        key={option}
                        checked={isSelected}
                        onCheckedChange={() => onUpdate(toggleFilter(selected, option))}
                    >
                        {option}
                    </DropdownMenuCheckboxItem>
                );
            })}
            </ScrollArea>
            {selected.length > 0 && (
                <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={() => onUpdate([])}
                        className="justify-center text-center"
                    >
                        Clear filters
                    </DropdownMenuItem>
                </>
            )}
        </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-4">
      {/* Details Modal */}
      <EmployeeDetailsModal 
        employee={viewEmployee} 
        isOpen={!!viewEmployee} 
        onClose={() => setViewEmployee(null)} 
      />

      <BulkUploadModal 
        isOpen={isBulkModalOpen} 
        onClose={() => setIsBulkModalOpen(false)} 
        onUpload={onBulkUpload}
      />
      
      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        onSave={handleBulkUpdateConfirm}
        metadata={metadata}
        selectedCount={selectedIds.length}
      />

      <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove {selectedIds.length} employees from the roster.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats / Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
            <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
                <div className="text-2xl font-bold">{pagination.total}</div>
            </CardHeader>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
            <div className="flex items-center gap-2 w-full md:w-auto flex-1">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                    placeholder="Search by Name, EID, Email..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                     <MultiSelectFilter 
                        title="Status" 
                        options={metadata.statuses} 
                        selected={pagination.filters.status}
                        onUpdate={(val) => updateUrl({ filters: { ...pagination.filters, status: val }, page: 1 })}
                    />
                     <MultiSelectFilter 
                        title="Role" 
                        options={metadata.roles} 
                        selected={pagination.filters.role}
                        onUpdate={(val) => updateUrl({ filters: { ...pagination.filters, role: val }, page: 1 })}
                    />
                     <MultiSelectFilter 
                        title="Skill" 
                        options={metadata.skills} 
                        selected={pagination.filters.skill}
                        onUpdate={(val) => updateUrl({ filters: { ...pagination.filters, skill: val }, page: 1 })}
                    />
                     <MultiSelectFilter 
                        title="Tier" 
                        options={metadata.tiers} 
                        selected={pagination.filters.tier}
                        onUpdate={(val) => updateUrl({ filters: { ...pagination.filters, tier: val }, page: 1 })}
                    />
                     <MultiSelectFilter 
                        title="Channel" 
                        options={metadata.channels} 
                        selected={pagination.filters.channel}
                        onUpdate={(val) => updateUrl({ filters: { ...pagination.filters, channel: val }, page: 1 })}
                    />
                     <MultiSelectFilter 
                        title="Supervisor" 
                        options={metadata.supervisors} 
                        selected={pagination.filters.supervisor}
                        onUpdate={(val) => updateUrl({ filters: { ...pagination.filters, supervisor: val }, page: 1 })}
                    />

                    {(pagination.filters.status.length > 0 || 
                      pagination.filters.role.length > 0 || 
                      pagination.filters.skill.length > 0 || 
                      pagination.filters.tier.length > 0 || 
                      pagination.filters.channel.length > 0 || 
                      pagination.filters.supervisor.length > 0) && (
                        <Button
                            variant="ghost"
                            className="h-8 px-2 lg:px-3"
                            onClick={() => updateUrl({ 
                                filters: { status: [], role: [], skill: [], tier: [], channel: [], supervisor: [] }, 
                                page: 1 
                            })}
                        >
                            Reset
                            <X className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (canUpdate || canDelete) && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Users className="h-4 w-4" />
                                Bulk Actions ({selectedIds.length})
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Selected ({selectedIds.length})</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {canUpdate && (
                                <DropdownMenuItem onClick={() => setIsBulkEditModalOpen(true)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Selected
                                </DropdownMenuItem>
                            )}
                            {canDelete && (
                                <DropdownMenuItem onClick={() => setIsBulkDeleteAlertOpen(true)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Selected
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                {canAdd && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="w-full md:w-auto gap-2">
                                <UserPlus className="h-4 w-4" />
                                Add Employee
                                <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onAdd}>
                                <User className="mr-2 h-4 w-4" />
                                Single Employee
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsBulkModalOpen(true)}>
                                <Users className="mr-2 h-4 w-4" />
                                Bulk Employees
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <Table>
            <TableHeader className="bg-muted/50">
                <TableRow>
                {canDelete && (
                    <TableHead className="w-[40px] px-4">
                        <Checkbox 
                            checked={employees.length > 0 && selectedIds.length === employees.length}
                            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                            aria-label="Select all"
                        />
                    </TableHead>
                )}
                <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("eid")}>
                    <div className="flex items-center gap-1">EID {renderSortIcon("eid")}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("last_name")}>
                    <div className="flex items-center gap-1">Name {renderSortIcon("last_name")}</div>
                </TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("role")}>
                    <div className="flex items-center gap-1">Role {renderSortIcon("role")}</div>
                </TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("skill")}>
                    <div className="flex items-center gap-1">Skill {renderSortIcon("skill")}</div>
                </TableHead>
                 <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("tier")}>
                    <div className="flex items-center gap-1">Tier {renderSortIcon("tier")}</div>
                </TableHead>
                 <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("channel")}>
                    <div className="flex items-center gap-1">Channel {renderSortIcon("channel")}</div>
                </TableHead>
                <TableHead className="hidden xl:table-cell cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("supervisor")}>
                    <div className="flex items-center gap-1">Supervisor {renderSortIcon("supervisor")}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("status")}>
                    <div className="flex items-center gap-1">Status {renderSortIcon("status")}</div>
                </TableHead>
                <TableHead className="hidden 2xl:table-cell cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("location")}>
                    <div className="flex items-center gap-1">Location {renderSortIcon("location")}</div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {employees.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={canDelete ? 9 : 8} className="h-24 text-center">
                    No employees found.
                    </TableCell>
                </TableRow>
                ) : (
                employees.map((employee) => (
                    <TableRow key={employee.id} className="hover:bg-muted/50">
                    {canDelete && (
                        <TableCell className="px-4 py-1">
                            <Checkbox 
                                checked={selectedIds.includes(employee.id)}
                                onCheckedChange={(checked) => handleSelectOne(employee.id, checked as boolean)}
                                aria-label={`Select ${employee.first_name} ${employee.last_name}`}
                            />
                        </TableCell>
                    )}
                    <TableCell className="font-mono text-xs py-1">
                      <span 
                        className="cursor-pointer hover:underline text-primary hover:text-primary/80 transition-colors"
                        onClick={() => setViewEmployee(employee)}
                      >
                        {employee.eid}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium py-1">
                        <div>{employee.last_name}, {employee.first_name}</div>
                        <div className="text-xs text-muted-foreground font-normal">{employee.toasttab_email}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground py-1">{employee.role}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm py-1">{employee.skill}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm py-1">{employee.tier}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm py-1">{employee.channel}</TableCell>
                    <TableCell className="hidden xl:table-cell text-sm py-1">{employee.supervisor}</TableCell>
                    <TableCell className="py-1">
                        <Badge 
                            className={`font-normal hover:bg-opacity-100 ${getStatusColor(employee.status)}`}
                        >
                            {employee.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell text-sm py-1">{employee.location}</TableCell>
                    <TableCell className="text-right py-1">
                        {(canUpdate || canDelete) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {canUpdate && (
                                <DropdownMenuItem onClick={() => onEdit(employee)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Details
                                </DropdownMenuItem>
                            )}
                            {canDelete && (
                                <DropdownMenuItem onClick={() => onDelete(employee.id)} className="text-destructive focus:text-destructive">
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                                </DropdownMenuItem>
                            )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        )}
                    </TableCell>
                    </TableRow>
                ))
                )}
            </TableBody>
            </Table>
        </div>
      </div>
      
      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} employees)
            </span>
            <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <Select
                    value={pagination.pageSize.toString()}
                    onValueChange={(value) => updateUrl({ pageSize: Number(value), page: 1 })}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={pagination.pageSize.toString()} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                {pageSize}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => updateUrl({ page: pagination.page - 1 })}
                disabled={pagination.page <= 1}
            >
                <ChevronLeft className="h-4 w-4" />
                Previous
            </Button>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => updateUrl({ page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
            >
                Next
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </div>
  );
}