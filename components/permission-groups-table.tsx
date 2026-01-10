"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Permission {
  id: string;
  name: string;
  code: string;
  group_name: string;
  description: string;
}

interface PermissionGroupsTableProps {
  groupedPermissions: Record<string, Permission[]>;
}

export function PermissionGroupsTable({ groupedPermissions }: PermissionGroupsTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead className="font-bold">Group / Permission</TableHead>
            <TableHead className="font-bold">Code</TableHead>
            <TableHead className="hidden md:table-cell font-bold">Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedPermissions).map(([group, perms]) => (
            <React.Fragment key={group}>
              {/* Group Header Row */}
              <TableRow 
                className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleGroup(group)}
              >
                <TableCell>
                  {expandedGroups[group] ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="font-bold py-3">
                  <div className="flex items-center gap-2">
                    {group}
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                      {perms.length} Permissions
                    </Badge>
                  </div>
                </TableCell>
                <TableCell></TableCell>
                <TableCell className="hidden md:table-cell"></TableCell>
              </TableRow>

              {/* Permission Rows */}
              {expandedGroups[group] && perms.map((p) => (
                <TableRow key={p.id} className="hover:bg-transparent">
                  <TableCell></TableCell>
                  <TableCell className="pl-8 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary/40" />
                      <span className="font-medium text-sm">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                      {p.code}
                    </code>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-[11px]">
                    {p.description}
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Need to import React for Fragment
import * as React from "react";
