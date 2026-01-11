"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconInput } from "@/components/icon-input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Home,
  Calendar,
  Phone,
  Heart,
  Wifi,
  Activity,
  Building,
  CreditCard,
  Briefcase,
  Key,
  Video,
  Monitor,
  Laptop,
  Network,
  FileText,
  Hash,
  Lock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Send,
  Save,
  X,
  Settings,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserProfile } from "./profile-form";
import { UserManagementData } from "./user-management";
import { getUserDetails, sendPasswordReset, updateUserProfile, updateUserAccount } from "@/app/(authenticated)/user-management/actions";

interface UserDetailsModalProps {
  userId: string | null;
  email: string | undefined;
  isOpen: boolean;
  onClose: () => void;
  roles: { id: string; name: string }[];
  onUpdate?: (updatedData: Partial<UserManagementData>) => void;
}

export function UserDetailsModal({ userId, email, isOpen, onClose, roles, onUpdate }: UserDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [accountEmail, setAccountEmail] = useState<string>("");
  const [accountRoleId, setAccountRoleId] = useState<string>("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails(userId);
      setAccountEmail(email || "");
    } else {
      setProfile(null);
      setFormData({});
      setMessage(null);
      setAccountEmail("");
      setAccountRoleId("");
    }
  }, [isOpen, userId, email]);

  const fetchUserDetails = async (id: string) => {
    setLoading(true);
    const result = await getUserDetails(id);
    if (result.profile) {
      setProfile(result.profile);
      setFormData(result.profile);
      setAccountRoleId(result.profile.role_id || "");
    } else if (result.error) {
      setMessage({ type: "error", text: result.error });
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, computer_type: value }));
  };

  const handleSaveChanges = async () => {
    if (!userId) return;
    setSaving(true);
    setMessage(null);
    
    try {
      // 1. Update Account (Email and Role)
      if (accountEmail !== email || accountRoleId !== (profile as any)?.role_id) {
        const accountResult = await updateUserAccount(userId, accountEmail, accountRoleId);
        if (accountResult.error) {
          throw new Error(accountResult.error);
        }
      }

      // 2. Update Profile Data
      // Create a copy of formData and remove fields that shouldn't be updated via this action
      const { id: _, created_at, role_id, ...updateData } = formData as any;
      const profileResult = await updateUserProfile(userId, updateData);
      
      if (profileResult.success) {
        setMessage({ type: "success", text: "User details updated successfully!" });
        setProfile({ ...profile, ...updateData, role_id: accountRoleId });
        
        // Notify parent component about the update
        if (onUpdate) {
          const selectedRole = roles.find(r => r.id === accountRoleId);
          onUpdate({
            id: userId,
            email: accountEmail,
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: selectedRole?.name || "Viewer"
          });
        }
      } else {
        throw new Error(profileResult.error || "Failed to update profile details.");
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const handleSendResetLink = async () => {
    if (!email) return;
    setResetLoading(true);
    setMessage(null);
    const result = await sendPasswordReset(email);
    if (result.success) {
      setMessage({ type: "success", text: "Password reset email sent successfully!" });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to send reset email." });
    }
    setResetLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center pr-8">
            <div>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Viewing details for {email}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading profile details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {message && (
              <div
                className={`p-4 rounded-md flex items-center gap-3 ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-5 w-5 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                )}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            )}

            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <User className="w-4 h-4" /> Personal
                </TabsTrigger>
                <TabsTrigger value="employment" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Employment
                </TabsTrigger>
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 pt-4">
                <Card className="border-t-4 border-t-primary shadow-sm">
                  <CardHeader>
                    <CardTitle>Personal Details</CardTitle>
                    <CardDescription>Update the user's personal information.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <IconInput
                      id="first_name"
                      label="First Name"
                      icon={User}
                      value={formData.first_name || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="middle_name"
                      label="Middle Name"
                      icon={User}
                      value={formData.middle_name || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="last_name"
                      label="Last Name"
                      icon={User}
                      value={formData.last_name || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="personal_email"
                      label="Personal Email Address"
                      type="email"
                      icon={Mail}
                      value={formData.personal_email || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="birthday"
                      label="Birthday"
                      type="date"
                      icon={Calendar}
                      value={formData.birthday || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="mobile_number"
                      label="Mobile Number"
                      icon={Phone}
                      value={formData.mobile_number || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="emergency_number"
                      label="Emergency Number"
                      icon={Phone}
                      value={formData.emergency_number || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="emergency_person"
                      label="Emergency Person"
                      icon={Heart}
                      value={formData.emergency_person || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="viber_number"
                      label="Viber Number"
                      icon={Phone}
                      value={formData.viber_number || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="home_address"
                      label="Home Address"
                      icon={Home}
                      value={formData.home_address || ""}
                      onChange={handleInputChange}
                      containerClassName="md:col-span-2 lg:col-span-3"
                    />
                    <IconInput
                      id="internet_provider"
                      label="Internet Provider"
                      icon={Wifi}
                      value={formData.internet_provider || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="internet_speed"
                      label="Internet Speed"
                      icon={Activity}
                      value={formData.internet_speed || ""}
                      onChange={handleInputChange}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="employment" className="space-y-4 pt-4">
                <Card className="border-t-4 border-t-primary shadow-sm">
                  <CardHeader>
                    <CardTitle>Employment Details</CardTitle>
                    <CardDescription>Manage work-related information for this user.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <IconInput
                      id="company"
                      label="Company"
                      icon={Building}
                      value={formData.company || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="employee_id"
                      label="Employee ID"
                      icon={CreditCard}
                      value={formData.employee_id || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="program"
                      label="Program"
                      icon={Briefcase}
                      value={formData.program || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="nt_login"
                      label="NT Login"
                      icon={Key}
                      value={formData.nt_login || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="company_email"
                      label="Company Email Address"
                      type="email"
                      icon={Mail}
                      value={formData.company_email || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="program_email"
                      label="Program Email Address"
                      type="email"
                      icon={Mail}
                      value={formData.program_email || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="zoom_id"
                      label="Zoom ID"
                      icon={Video}
                      value={formData.zoom_id || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="hire_date"
                      label="Hire Date"
                      type="date"
                      icon={Calendar}
                      value={formData.hire_date || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="computer_name"
                      label="Computer Name"
                      icon={Monitor}
                      value={formData.computer_name || ""}
                      onChange={handleInputChange}
                    />
                    
                    <div className="grid gap-2">
                      <Label htmlFor="computer_type">Computer Type</Label>
                      <div className="relative">
                        <div className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10">
                          <Laptop className="h-4 w-4" />
                        </div>
                        <Select
                          value={formData.computer_type || ""}
                          onValueChange={handleSelectChange}
                        >
                          <SelectTrigger className="pl-9 w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Laptop">Laptop</SelectItem>
                            <SelectItem value="Desktop">Desktop</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <IconInput
                      id="vpn_ip"
                      label="VPN IP"
                      icon={Network}
                      value={formData.vpn_ip || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="ms_office_license"
                      label="MS Office License"
                      icon={FileText}
                      value={formData.ms_office_license || ""}
                      onChange={handleInputChange}
                    />
                    <IconInput
                      id="unit_serial_number"
                      label="Unit Serial Number"
                      icon={Hash}
                      value={formData.unit_serial_number || ""}
                      onChange={handleInputChange}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="account" className="space-y-4 pt-4">
                <Card className="border-t-4 border-t-primary shadow-sm">
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Update user's login credentials and system role.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="account_email">Login Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="account_email"
                            type="email"
                            className="pl-10"
                            value={accountEmail}
                            onChange={(e) => setAccountEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="account_role">System Role</Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                          <Select
                            value={accountRoleId}
                            onValueChange={setAccountRoleId}
                          >
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <div className="flex flex-col items-center justify-center py-4 gap-4 text-center">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Lock className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">Password Management</p>
                          <p className="text-sm text-muted-foreground max-w-xs">
                            Send a password reset link to the user's login email.
                          </p>
                        </div>
                        <Button 
                          onClick={handleSendResetLink} 
                          disabled={resetLoading}
                          variant="secondary"
                          className="gap-2"
                        >
                          {resetLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Send Password Reset Link
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose} className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSaveChanges} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}