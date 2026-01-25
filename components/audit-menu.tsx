"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, FilePlus } from "lucide-react";

interface AuditMenuProps {
  permissions: string[];
}

export function AuditMenu({ permissions }: AuditMenuProps) {
  const router = useRouter();

  const canViewAudit = permissions.includes('audit.view');
  const canViewForms = permissions.includes('form.view');
  const canManageFeedback = permissions.includes('feedback.manage');

  if (!canViewAudit && !canViewForms && !canManageFeedback) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-accent focus-visible:ring-0 focus-visible:ring-offset-0">
          <ClipboardCheck className="h-4 w-4" />
          <span className="text-sm font-medium">Audit</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canViewAudit && (
          <DropdownMenuItem onClick={() => router.push("/audit/records")}>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            <span>Audit Records</span>
          </DropdownMenuItem>
        )}
        {canViewForms && (
          <DropdownMenuItem onClick={() => router.push("/audit/form-builder")}>
            <FilePlus className="mr-2 h-4 w-4" />
            <span>Form Builder</span>
          </DropdownMenuItem>
        )}
        {canManageFeedback && (
          <DropdownMenuItem onClick={() => router.push("/audit/feedback-builder")}>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            <span>Feedback Builder</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
