"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconInput } from "@/components/icon-input";
import { AutocompleteInput } from "@/components/autocomplete-input";
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
  Layers,
  Save,
  X
} from "lucide-react";
import { Employee, EmployeeInput, RosterMetadata } from "../types";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeInput) => Promise<void>;
  employee?: Employee | null; // If provided, it's edit mode
  metadata: RosterMetadata;
}

const initialData: EmployeeInput = {
  eid: "",
  case_safe_id: "",
  toasttab_email: "",
  location: "",
  last_name: "",
  first_name: "",
  middle_name: "",
  skill: "",
  channel: "",
  tier: "",
  role: "",
  status: "Active",
  wave: "",
  production_date: null,
  supervisor: "",
  manager: "",
  tenure: null,
  tenure_bucket: "",
};

export function EmployeeModal({ isOpen, onClose, onSubmit, employee, metadata }: EmployeeModalProps) {
  const [formData, setFormData] = useState<EmployeeInput>(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        eid: employee.eid || "",
        case_safe_id: employee.case_safe_id || "",
        toasttab_email: employee.toasttab_email || "",
        location: employee.location || "",
        last_name: employee.last_name || "",
        first_name: employee.first_name || "",
        middle_name: employee.middle_name || "",
        skill: employee.skill || "",
        channel: employee.channel || "",
        tier: employee.tier || "",
        role: employee.role || "",
        status: employee.status || "Active",
        wave: employee.wave || "",
        production_date: employee.production_date || null,
        supervisor: employee.supervisor || "",
        manager: employee.manager || "",
        tenure: employee.tenure || null,
        tenure_bucket: employee.tenure_bucket || "",
      });
    } else {
      setFormData(initialData);
    }
  }, [employee, isOpen]);

  const handleChange = (field: keyof EmployeeInput, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {employee ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            {employee ? "Edit Employee" : "Add New Employee"}
          </DialogTitle>
          <DialogDescription>
            {employee ? "Update employee details below." : "Enter the details for the new employee."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: Identity */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground border-b pb-1 flex items-center gap-2">
              <User className="h-4 w-4" /> Identity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <IconInput
                label="EID *"
                icon={Hash}
                id="eid" 
                required 
                autoComplete="off"
                value={formData.eid} 
                onChange={(e) => handleChange("eid", e.target.value)} 
              />
              <IconInput
                label="Case Safe ID"
                icon={Hash}
                id="case_safe_id" 
                autoComplete="off"
                value={formData.case_safe_id} 
                onChange={(e) => handleChange("case_safe_id", e.target.value)} 
              />
               <IconInput
                label="Toasttab Email"
                icon={Mail}
                id="toasttab_email" 
                type="email"
                autoComplete="off"
                value={formData.toasttab_email} 
                onChange={(e) => handleChange("toasttab_email", e.target.value)} 
              />
              
              <IconInput
                label="First Name *"
                icon={User}
                id="first_name" 
                required 
                autoComplete="off"
                value={formData.first_name} 
                onChange={(e) => handleChange("first_name", e.target.value)} 
              />
              <IconInput
                label="Last Name *"
                icon={User}
                id="last_name" 
                required 
                autoComplete="off"
                value={formData.last_name} 
                onChange={(e) => handleChange("last_name", e.target.value)} 
              />
              <IconInput
                label="Middle Name"
                icon={User}
                id="middle_name" 
                autoComplete="off"
                value={formData.middle_name || ""} 
                onChange={(e) => handleChange("middle_name", e.target.value)} 
              />
            </div>
          </div>

          {/* Section: Job Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground border-b pb-1 flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Job Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AutocompleteInput
                label="Role / Job Title"
                icon={Briefcase}
                id="role" 
                value={formData.role} 
                options={metadata.roles}
                onChange={(val) => handleChange("role", val)} 
              />
               <AutocompleteInput
                label="Location"
                icon={MapPin}
                id="location" 
                value={formData.location} 
                options={metadata.locations}
                onChange={(val) => handleChange("location", val)} 
              />
              <AutocompleteInput
                label="Status"
                icon={Activity}
                id="status" 
                value={formData.status} 
                options={metadata.statuses}
                onChange={(val) => handleChange("status", val)} 
              />
              
              <AutocompleteInput
                label="Supervisor"
                icon={Users}
                id="supervisor" 
                value={formData.supervisor} 
                options={metadata.supervisors}
                onChange={(val) => handleChange("supervisor", val)} 
              />

               <AutocompleteInput
                label="Manager"
                icon={Users}
                id="manager" 
                value={formData.manager} 
                options={metadata.managers}
                onChange={(val) => handleChange("manager", val)} 
              />

               <IconInput
                label="Production Date"
                icon={Calendar}
                id="production_date" 
                type="date"
                value={formData.production_date || ""} 
                onChange={(e) => handleChange("production_date", e.target.value || null)} 
              />
            </div>
          </div>

          {/* Section: Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground border-b pb-1 flex items-center gap-2">
              <Layers className="h-4 w-4" /> Additional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <AutocompleteInput
                label="Skill"
                icon={Activity}
                id="skill" 
                value={formData.skill} 
                options={metadata.skills}
                onChange={(val) => handleChange("skill", val)} 
              />
              <AutocompleteInput
                label="Channel"
                icon={Activity}
                id="channel" 
                value={formData.channel} 
                options={metadata.channels}
                onChange={(val) => handleChange("channel", val)} 
              />
              <AutocompleteInput
                label="Tier"
                icon={BarChart3}
                id="tier" 
                value={formData.tier} 
                options={metadata.tiers}
                onChange={(val) => handleChange("tier", val)} 
              />
              <AutocompleteInput
                label="Wave"
                icon={Activity}
                id="wave" 
                value={formData.wave} 
                options={metadata.waves}
                onChange={(val) => handleChange("wave", val)} 
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="gap-2">
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : (employee ? "Update Employee" : "Add Employee")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}