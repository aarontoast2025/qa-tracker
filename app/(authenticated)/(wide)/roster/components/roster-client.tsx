"use client";

import { useState } from "react";
import { RosterTable } from "./roster-table";
import { EmployeeModal } from "./employee-modal";
import { Employee, EmployeeInput, RosterMetadata } from "../types";
import { addEmployee, updateEmployee, deleteEmployee, deleteEmployees, bulkAddEmployees, bulkUpdateEmployees } from "../actions";
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
import { AlertTriangle, Trash2 } from "lucide-react";

interface RosterClientProps {
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
  permissions: {
    canAdd: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
  metadata: RosterMetadata;
}

export function RosterClient({ employees, pagination, permissions, metadata }: RosterClientProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);

  const handleAddSubmit = async (data: EmployeeInput) => {
    const result = await addEmployee(data);
    if (result.error) {
      alert(`Error adding employee: ${result.error}`);
    } else {
        // Success
    }
  };

  const handleUpdateSubmit = async (data: EmployeeInput) => {
    if (!editingEmployee) return;
    const result = await updateEmployee(editingEmployee.id, data);
    if (result.error) {
      alert(`Error updating employee: ${result.error}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEmployeeId) return;
    const result = await deleteEmployee(deletingEmployeeId);
    if (result.error) {
      alert(`Error deleting employee: ${result.error}`);
    }
    setDeletingEmployeeId(null);
  };

  const handleBulkUpload = async (employees: EmployeeInput[]) => {
    return await bulkAddEmployees(employees);
  };

  const handleBulkDelete = async (ids: string[]) => {
    const result = await deleteEmployees(ids);
    if (result.error) {
        alert(`Error deleting employees: ${result.error}`);
        return { success: false, error: result.error };
    }
    return { success: true };
  };

  const handleBulkUpdate = async (ids: string[], updates: Partial<EmployeeInput>) => {
    const result = await bulkUpdateEmployees(ids, updates);
    if (result.error) {
        alert(`Error updating employees: ${result.error}`);
    }
  };

  return (
    <>
      <RosterTable
        employees={employees}
        pagination={pagination}
        canAdd={permissions.canAdd}
        canUpdate={permissions.canUpdate}
        canDelete={permissions.canDelete}
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={(employee) => setEditingEmployee(employee)}
        onDelete={(id) => setDeletingEmployeeId(id)}
        onBulkUpload={handleBulkUpload}
        onBulkDelete={handleBulkDelete}
        onBulkUpdate={handleBulkUpdate}
        metadata={metadata}
      />

      <EmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
        metadata={metadata}
      />

      <EmployeeModal
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onSubmit={handleUpdateSubmit}
        employee={editingEmployee}
        metadata={metadata}
      />

      <AlertDialog open={!!deletingEmployeeId} onOpenChange={(open) => !open && setDeletingEmployeeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the employee from the roster.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
