"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Hash, 
  MapPin, 
  Briefcase, 
  Activity, 
  Calendar, 
  Users, 
  BarChart3, 
} from "lucide-react";
import { Employee } from "../types";
import { getStatusColor } from "../utils";
import React from "react";

interface EmployeeDetailsModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

interface DetailItemProps {
  label: string;
  value: string | number | null;
  icon: React.ElementType;
  fullWidth?: boolean;
}

function DetailItem({ label, value, icon: Icon, fullWidth = false }: DetailItemProps) {
  return (
    <div className={`flex items-start py-2 group ${fullWidth ? 'col-span-full' : ''}`}>
      <div className="flex items-center min-w-[140px] text-muted-foreground">
        <Icon className="h-4 w-4 mr-2 text-primary/70" />
        <span className="text-sm font-medium">{label}:</span>
      </div>
      <div className="flex-1 pl-2">
        <span className="text-sm font-medium text-foreground">
          {value || <span className="text-muted-foreground/50 italic">N/A</span>}
        </span>
      </div>
    </div>
  );
}

export function EmployeeDetailsModal({ employee, isOpen, onClose }: EmployeeDetailsModalProps) {
  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <span className="text-lg font-bold text-primary">
                {employee.first_name?.[0]}{employee.last_name?.[0]}
              </span>
            </div>
            <div>
              <DialogTitle className="text-xl">
                {employee.last_name}, {employee.first_name} {employee.middle_name}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Hash className="h-3 w-3" /> 
                <span className="font-mono text-xs">{employee.eid}</span>
                <span className="mx-1">•</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getStatusColor(employee.status)}`}>
                    {employee.status}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          
          {/* Section: Identity */}
          <div className="space-y-2">
             <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 pl-1">
              Identity & Contact
            </h3>
            <div className="flex flex-col gap-y-1">
               <DetailItem label="Full Name" value={`${employee.first_name} ${employee.middle_name ? employee.middle_name + " " : ""}${employee.last_name}`} icon={User} />
               <DetailItem label="Case Safe ID" value={employee.case_safe_id} icon={Hash} />
               <DetailItem label="Email" value={employee.toasttab_email} icon={Mail} />
            </div>
          </div>

          <div className="h-px bg-border/50" />

          {/* Section: Job Info */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 pl-1">
              Employment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
              <DetailItem label="Role" value={employee.role} icon={Briefcase} />
              <DetailItem label="Location" value={employee.location} icon={MapPin} />
              <DetailItem label="Manager" value={employee.manager} icon={Users} />
              <DetailItem label="Production Date" value={employee.production_date} icon={Calendar} />
              <DetailItem label="Supervisor" value={employee.supervisor} icon={Users} />
            </div>
          </div>

          <div className="h-px bg-border/50" />

          {/* Section: Details */}
          <div className="space-y-2">
             <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 pl-1">
              Metrics & Classification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
              <DetailItem label="Skill" value={employee.skill} icon={Activity} />
              <DetailItem label="Channel" value={employee.channel} icon={Activity} />
              <DetailItem label="Tier" value={employee.tier} icon={BarChart3} />
              <DetailItem label="Wave" value={employee.wave} icon={Activity} />
              <DetailItem label="Tenure" value={employee.tenure ? `${employee.tenure} Days` : null} icon={Calendar} />
              <DetailItem label="Tenure Bucket" value={employee.tenure_bucket} icon={BarChart3} />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button onClick={onClose} variant="outline" className="min-w-[100px]">
             Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
