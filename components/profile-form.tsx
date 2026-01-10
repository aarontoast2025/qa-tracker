"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  personal_email: string | null;
  home_address: string | null;
  birthday: string | null;
  mobile_number: string | null;
  emergency_number: string | null;
  emergency_person: string | null;
  viber_number: string | null;
  internet_provider: string | null;
  internet_speed: string | null;
  company: string | null;
  employee_id: string | null;
  program: string | null;
  nt_login: string | null;
  company_email: string | null;
  program_email: string | null;
  zoom_id: string | null;
  hire_date: string | null;
  computer_name: string | null;
  computer_type: string | null;
  vpn_ip: string | null;
  ms_office_license: string | null;
  unit_serial_number: string | null;
}

interface ProfileFormProps {
  initialData: UserProfile | null;
  userId: string;
}

export function ProfileForm({ initialData, userId }: ProfileFormProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>(
    initialData || { id: userId }
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, computer_type: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Update Profile Data
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({ ...formData, id: userId, updated_at: new Date().toISOString() });

      if (profileError) throw profileError;

      // Update Password if provided
      if (password) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const { error: passwordError } = await supabase.auth.updateUser({ password });
        if (passwordError) throw passwordError;
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
      router.refresh();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const SaveButton = () => (
    <div className="flex justify-end mt-4">
      <Button type="submit" disabled={loading} className="w-full md:w-auto">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </>
        )}
      </Button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <SaveButton />
        </TabsContent>

        <TabsContent value="employment">
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
              <CardDescription>Manage your work-related details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <SaveButton />
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Update your password.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <IconInput
                id="password"
                label="New Password"
                type="password"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <IconInput
                id="confirm_password"
                label="Confirm Password"
                type="password"
                icon={Lock}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </CardContent>
          </Card>
          <SaveButton />
        </TabsContent>
      </Tabs>
    </form>
  );
}