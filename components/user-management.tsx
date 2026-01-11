"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  Search,
  CheckCircle,
  MoreVertical,
  Clock,
  Fingerprint,
  X,
  Ban,
  UserCheck,
  AlertTriangle,
  Loader2,
  Mail,
  RefreshCw,
  Phone,
  Shield,
  Briefcase,
  IdCard,
  Filter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
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
import { InviteUserModal } from "./invite-user-modal";
import { UserDetailsModal } from "./user-details-modal";
import { suspendUser, resendInvitation } from "@/app/(authenticated)/user-management/actions";

export interface UserManagementData {
  id: string;
  email: string | undefined;
  first_name: string | null;
  last_name: string | null;
  employee_id: string | null;
  nt_login: string | null;
  mobile_number: string | null;
  company_email: string | null;
  program_email: string | null;
  role: string;
  status: "active" | "invited" | "expired" | "suspended";
  is_suspended: boolean;
  last_sign_in_at: string | null;
  created_at: string;
}

interface UserManagementProps {
  initialUsers: UserManagementData[];
  roles: { id: string; name: string }[];
}

export function UserManagement({ initialUsers, roles }: UserManagementProps) {
  const [users, setUsers] = useState<UserManagementData[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [userDetailsUser, setUserDetailsUser] = useState<UserManagementData | null>(null);
  const [suspendingUser, setSuspendingUser] = useState<UserManagementData | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullName = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
      const email = (user.email || "").toLowerCase();
      const search = searchQuery.toLowerCase();
      
      const matchesSearch = fullName.includes(search) || email.includes(search);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(user.status);
      
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, selectedStatuses]);

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleInviteSuccess = (newUser: UserManagementData) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  const handleUserUpdate = (updatedData: Partial<UserManagementData>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedData.id ? { ...u, ...updatedData } : u))
    );
  };

  const handleSuspendToggle = async () => {
    if (!suspendingUser) return;
    
    const userId = suspendingUser.id;
    const newSuspendedState = !suspendingUser.is_suspended;
    
    setLoading(userId);
    const result = await suspendUser(userId, newSuspendedState);
    
    if (!result.error) {
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          // Update both is_suspended and status
          const newStatus = newSuspendedState ? "suspended" : (u.last_sign_in_at ? "active" : "invited");
          return { 
            ...u, 
            is_suspended: newSuspendedState,
            status: newStatus as "active" | "invited" | "expired" | "suspended"
          };
        }
        return u;
      }));
    }
    
    setLoading(null);
    setSuspendingUser(null);
  };

  const handleResendInvite = async (user: UserManagementData) => {
    if (!user.email) return;
    
    setLoading(user.id);
    const result = await resendInvitation(user.email);
    
    if (!result.error) {
      // Refresh status to "invited" if it was "expired"
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: "invited" as const } : u
      ));
    }
    setLoading(null);
  };

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage your organization's users, roles, and invitations.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsInviteModalOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      <Card className="border-t-4 border-t-primary shadow-sm w-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Users className="h-5 w-5 text-primary" />
                System Users
              </CardTitle>
              <CardDescription>
                Review and manage all authenticated users and their profiles.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9 bg-muted/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 whitespace-nowrap">
                    <Filter className="h-4 w-4" />
                    Status
                    {selectedStatuses.length > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1 h-5 text-[10px]">
                        {selectedStatuses.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {["active", "invited", "expired", "suspended"].map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={() => toggleStatus(status)}
                      className="capitalize"
                    >
                      {status}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {selectedStatuses.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="justify-center font-medium"
                        onClick={() => setSelectedStatuses([])}
                      >
                        Clear Filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">User</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">NT Login</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Emails</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Role</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-4 py-3 text-right font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className={`hover:bg-muted/20 transition-colors group ${user.is_suspended ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm border ${
                              user.is_suspended 
                                ? 'bg-muted text-muted-foreground border-muted-foreground/20' 
                                : 'bg-primary/10 text-primary border-primary/20'
                            }`}>
                              {(user.first_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground whitespace-nowrap">
                                {user.first_name || user.last_name
                                  ? `${user.first_name || ""} ${user.last_name || ""}`
                                  : "Pending Setup"}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <IdCard className="h-2.5 w-2.5" />
                                {user.employee_id || "No ID"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground font-medium whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="h-3 w-3 opacity-50" />
                            {user.nt_login || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground font-medium">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Mail className="h-3 w-3 opacity-50" />
                              <span className="truncate max-w-[180px]" title={user.company_email || ""}>
                                {user.company_email || "-"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs opacity-70">
                              <Mail className="h-3 w-3 opacity-50" />
                              <span className="truncate max-w-[180px]" title={user.program_email || ""}>
                                {user.program_email || "-"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={user.role === 'Admin' ? 'destructive' : 'secondary'} className="text-[9px] uppercase font-semibold tracking-tighter px-2 py-0">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          {user.status === "suspended" ? (
                            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium text-xs">
                              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              Suspended
                            </div>
                          ) : user.status === "active" ? (
                            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium text-xs">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                              Active
                            </div>
                          ) : user.status === "expired" ? (
                            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium text-xs">
                              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              Expired
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400 font-medium text-xs">
                              <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                              Invited
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" disabled={loading === user.id}>
                                {loading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2" onClick={() => setUserDetailsUser(user)}>
                                <Search className="h-3.5 w-3.5" /> View Details
                              </DropdownMenuItem>
                              
                              {(user.status === "invited" || user.status === "expired") && (
                                <DropdownMenuItem className="gap-2" onClick={() => handleResendInvite(user)}>
                                  <RefreshCw className="h-3.5 w-3.5" /> Resend Invite
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem 
                                className={`gap-2 ${user.is_suspended ? 'text-green-600' : 'text-orange-600'}`}
                                onClick={() => setSuspendingUser(user)}
                              >
                                {user.is_suspended ? (
                                  <>
                                    <UserCheck className="h-3.5 w-3.5" /> Unsuspend User
                                  </>
                                ) : (
                                  <>
                                    <Ban className="h-3.5 w-3.5" /> Suspend User
                                  </>
                                )}
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem className="text-red-600 dark:text-red-400 gap-2">
                                <X className="h-3.5 w-3.5" /> Remove User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <Users className="h-10 w-10 opacity-20" />
                          <p>No users found matching your search.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suspend/Unsuspend Confirmation Modal */}
      <AlertDialog 
        open={!!suspendingUser} 
        onOpenChange={(open) => !open && setSuspendingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={`flex items-center gap-2 ${suspendingUser?.is_suspended ? 'text-green-600' : 'text-orange-600'}`}>
              {suspendingUser?.is_suspended ? (
                <>
                  <UserCheck className="h-5 w-5" />
                  Unsuspend User: {suspendingUser?.email}
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5" />
                  Suspend User: {suspendingUser?.email}
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                {suspendingUser?.is_suspended ? (
                  <>
                    <p>
                      Are you sure you want to unsuspend this user?
                    </p>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-md text-sm border border-green-200 dark:border-green-800">
                      <strong>Note:</strong> Once unsuspended, this user will be able to log in to the platform again.
                    </div>
                  </>
                ) : (
                  <>
                    <p>
                      Are you sure you want to suspend this user?
                    </p>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 rounded-md text-sm border border-orange-200 dark:border-orange-800">
                      <strong>Warning:</strong> Once suspended, this user will be immediately blocked and will not be able to log in to the platform until they are unsuspended.
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="gap-2">
              <X className="h-4 w-4" /> Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSuspendToggle}
              className={`gap-2 ${suspendingUser?.is_suspended ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'} text-white`}
            >
              {suspendingUser?.is_suspended ? (
                <>
                  <UserCheck className="h-4 w-4" /> Unsuspend User
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4" /> Suspend User
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

            <InviteUserModal 

              isOpen={isInviteModalOpen}

              onClose={() => setIsInviteModalOpen(false)}

              roles={roles}

              onSuccess={handleInviteSuccess}

            />

      

                                    <UserDetailsModal 

      

                                      isOpen={!!userDetailsUser}

      

                                      onClose={() => setUserDetailsUser(null)}

      

                                      userId={userDetailsUser?.id || null}

      

                                      email={userDetailsUser?.email}

      

                                      roles={roles}

      

                                      onUpdate={handleUserUpdate}

      

                                    />

          </div>

        );

      }

      