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
import { getUserDetails, sendPasswordReset } from "@/app/(authenticated)/user-management/actions";

interface UserDetailsModalProps {
  userId: string | null;
  email: string | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailsModal({ userId, email, isOpen, onClose }: UserDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails(userId);
    } else {
      setProfile(null);
      setMessage(null);
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async (id: string) => {
    setLoading(true);
    const result = await getUserDetails(id);
    if (result.profile) {
      setProfile(result.profile);
    } else if (result.error) {
      setMessage({ type: "error", text: result.error });
    }
    setLoading(false);
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
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Viewing details for {email}
          </DialogDescription>
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
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Security
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 pt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <IconInput
                    id="first_name"
                    label="First Name"
                    icon={User}
                    value={profile?.first_name || ""}
                    readOnly
                  />
                  <IconInput
                    id="middle_name"
                    label="Middle Name"
                    icon={User}
                    value={profile?.middle_name || ""}
                    readOnly
                  />
                  <IconInput
                    id="last_name"
                    label="Last Name"
                    icon={User}
                    value={profile?.last_name || ""}
                    readOnly
                  />
                  <IconInput
                    id="personal_email"
                    label="Personal Email Address"
                    type="email"
                    icon={Mail}
                    value={profile?.personal_email || ""}
                    readOnly
                  />
                  <IconInput
                    id="birthday"
                    label="Birthday"
                    type="date"
                    icon={Calendar}
                    value={profile?.birthday || ""}
                    readOnly
                  />
                  <IconInput
                    id="mobile_number"
                    label="Mobile Number"
                    icon={Phone}
                    value={profile?.mobile_number || ""}
                    readOnly
                  />
                  <IconInput
                    id="emergency_number"
                    label="Emergency Number"
                    icon={Phone}
                    value={profile?.emergency_number || ""}
                    readOnly
                  />
                  <IconInput
                    id="emergency_person"
                    label="Emergency Person"
                    icon={Heart}
                    value={profile?.emergency_person || ""}
                    readOnly
                  />
                  <IconInput
                    id="viber_number"
                    label="Viber Number"
                    icon={Phone}
                    value={profile?.viber_number || ""}
                    readOnly
                  />
                  <IconInput
                    id="home_address"
                    label="Home Address"
                    icon={Home}
                    value={profile?.home_address || ""}
                    readOnly
                    containerClassName="md:col-span-2 lg:col-span-3"
                  />
                  <IconInput
                    id="internet_provider"
                    label="Internet Provider"
                    icon={Wifi}
                    value={profile?.internet_provider || ""}
                    readOnly
                  />
                  <IconInput
                    id="internet_speed"
                    label="Internet Speed"
                    icon={Activity}
                    value={profile?.internet_speed || ""}
                    readOnly
                  />
                </div>
              </TabsContent>

              <TabsContent value="employment" className="space-y-4 pt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <IconInput
                    id="company"
                    label="Company"
                    icon={Building}
                    value={profile?.company || ""}
                    readOnly
                  />
                  <IconInput
                    id="employee_id"
                    label="Employee ID"
                    icon={CreditCard}
                    value={profile?.employee_id || ""}
                    readOnly
                  />
                  <IconInput
                    id="program"
                    label="Program"
                    icon={Briefcase}
                    value={profile?.program || ""}
                    readOnly
                  />
                  <IconInput
                    id="nt_login"
                    label="NT Login"
                    icon={Key}
                    value={profile?.nt_login || ""}
                    readOnly
                  />
                  <IconInput
                    id="company_email"
                    label="Company Email Address"
                    type="email"
                    icon={Mail}
                    value={profile?.company_email || ""}
                    readOnly
                  />
                  <IconInput
                    id="program_email"
                    label="Program Email Address"
                    type="email"
                    icon={Mail}
                    value={profile?.program_email || ""}
                    readOnly
                  />
                  <IconInput
                    id="zoom_id"
                    label="Zoom ID"
                    icon={Video}
                    value={profile?.zoom_id || ""}
                    readOnly
                  />
                  <IconInput
                    id="hire_date"
                    label="Hire Date"
                    type="date"
                    icon={Calendar}
                    value={profile?.hire_date || ""}
                    readOnly
                  />
                  <IconInput
                    id="computer_name"
                    label="Computer Name"
                    icon={Monitor}
                    value={profile?.computer_name || ""}
                    readOnly
                  />
                  
                  <div className="grid gap-2">
                    <Label htmlFor="computer_type">Computer Type</Label>
                    <div className="relative">
                      <div className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10">
                        <Laptop className="h-4 w-4" />
                      </div>
                      <Select
                        value={profile?.computer_type || ""}
                        disabled
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
                    value={profile?.vpn_ip || ""}
                    readOnly
                  />
                  <IconInput
                    id="ms_office_license"
                    label="MS Office License"
                    icon={FileText}
                    value={profile?.ms_office_license || ""}
                    readOnly
                  />
                  <IconInput
                    id="unit_serial_number"
                    label="Unit Serial Number"
                    icon={Hash}
                    value={profile?.unit_serial_number || ""}
                    readOnly
                  />
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-4 pt-4">
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Account Security</CardTitle>
                    <CardDescription>
                      Manage security settings for this user.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Password Reset</p>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Trigger a password reset email to be sent to {email}. The user will receive a link to set a new password.
                      </p>
                    </div>
                    <Button 
                      onClick={handleSendResetLink} 
                      disabled={resetLoading}
                      className="gap-2"
                    >
                      {resetLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send Password Reset Link
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
