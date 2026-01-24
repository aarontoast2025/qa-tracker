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
  AlertCircle,
  Loader2,
  Mail,
  RefreshCw,
  Phone,
  Shield,
  Briefcase,
  IdCard,
  Filter,
  Trash2,
  KeyRound,
  LogOut,
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
import { createClient } from "@/lib/supabase/client";
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
import { suspendUser, resendInvitation, deleteUser, sendPasswordReset, forceLogoutUser } from "@/app/(authenticated)/(standard)/user-management/actions";
import { PresenceHeader } from "./presence-header";

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
  avatar_url: string | null;
  role: string;
  status: "active" | "invited" | "expired" | "suspended";
  is_suspended: boolean;
  last_sign_in_at: string | null;
  created_at: string;
}

interface UserManagementProps {
  initialUsers: UserManagementData[];
  roles: { id: string; name: string }[];
  currentUserPermissions: string[];
}

export function UserManagement({ initialUsers, roles, currentUserPermissions }: UserManagementProps) {
  const [users, setUsers] = useState<UserManagementData[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [userDetailsUser, setUserDetailsUser] = useState<UserManagementData | null>(null);
  const [suspendingUser, setSuspendingUser] = useState<UserManagementData | null>(null);
  const [forcingLogoutUser, setForcingLogoutUser] = useState<UserManagementData | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserManagementData | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    setMessage({ type: "success", text: `Invitation sent to ${newUser.email}` });
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
    setMessage(null);
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
      setMessage({ type: "success", text: `User ${newSuspendedState ? 'suspended' : 'unsuspended'} successfully.` });
    } else {
      setMessage({ type: "error", text: result.error });
    }
    
    setLoading(null);
    setSuspendingUser(null);
  };

  const handleForceLogout = async () => {
    if (!forcingLogoutUser) return;

    setLoading(forcingLogoutUser.id);
    setMessage(null);
    const result = await forceLogoutUser(forcingLogoutUser.id);

    if (!result.error) {
      setMessage({ type: "success", text: "User logged out from all devices." });
    } else {
      setMessage({ type: "error", text: result.error });
    }

    setLoading(null);
    setForcingLogoutUser(null);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    // Verify password
    if (!deletePassword) {
      setDeleteError("Please enter your password to confirm.");
      return;
    }

    setIsVerifying(true);
    setDeleteError(null);
    
    const supabase = createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser || !currentUser.email) {
      setDeleteError("Could not identify current user.");
      setIsVerifying(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: deletePassword,
    });

    if (signInError) {
      setDeleteError("Incorrect password. Please try again.");
      setIsVerifying(false);
      return;
    }

    // Password verified, proceed with delete
    setLoading(deletingUser.id);
    setMessage(null);
    const result = await deleteUser(deletingUser.id);
    
    if (!result.error) {
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      setMessage({ type: "success", text: "User removed successfully." });
    } else {
      setMessage({ type: "error", text: result.error });
    }
    
    setIsVerifying(false);
    setLoading(null);
    setDeletingUser(null);
    setDeletePassword(""); // Clear password
  };

  const handleResendInvite = async (user: UserManagementData) => {
    if (!user.email) return;
    
    setLoading(user.id);
    setMessage(null);
    const result = await resendInvitation(user.email);
    
    if (!result.error) {
      // Refresh status to "invited" if it was "expired"
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: "invited" as const } : u
      ));
      setMessage({ type: "success", text: "Invitation resent successfully." });
    } else {
      setMessage({ type: "error", text: result.error });
    }
    setLoading(null);
  };

  const handleSendPasswordReset = async (user: UserManagementData) => {
    if (!user.email) return;

    setLoading(user.id);
    setMessage(null);
    const result = await sendPasswordReset(user.email);

    if (!result.error) {
      setMessage({ type: "success", text: "Password reset email sent successfully." });
    } else {
      setMessage({ type: "error", text: result.error });
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
        <div className="flex items-center gap-4">
          <PresenceHeader />
          {currentUserPermissions.includes('users.invite') && (
            <Button className="gap-2" onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md flex items-center justify-between gap-3 ${
            message.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-current opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm border overflow-hidden ${
                              user.is_suspended 
                                ? 'bg-muted text-muted-foreground border-muted-foreground/20' 
                                : 'bg-primary/10 text-primary border-primary/20'
                            }`}>
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                              ) : (
                                (user.first_name?.[0] || user.email?.[0] || "?").toUpperCase()
                              )}
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
                              
                              {(user.status === "invited" || user.status === "expired") && currentUserPermissions.includes('users.invite') && (
                                <DropdownMenuItem className="gap-2" onClick={() => handleResendInvite(user)}>
                                  <RefreshCw className="h-3.5 w-3.5" /> Resend Invite
                                </DropdownMenuItem>
                              )}

                              {user.status === "active" && currentUserPermissions.includes('users.account') && (
                                <DropdownMenuItem className="gap-2" onClick={() => handleSendPasswordReset(user)}>
                                  <KeyRound className="h-3.5 w-3.5" /> Send Password Reset
                                </DropdownMenuItem>
                              )}
                              
                              {user.status === "active" && currentUserPermissions.includes('users.forcelogout') && (
                                <DropdownMenuItem className="gap-2 text-orange-600" onClick={() => setForcingLogoutUser(user)}>
                                  <LogOut className="h-3.5 w-3.5" /> Force Logout
                                </DropdownMenuItem>
                              )}
                              
                              {currentUserPermissions.includes('users.suspend') && (
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
                              )}
                              
                              {currentUserPermissions.includes('users.delete') && (
                                <DropdownMenuItem 
                                  className="text-red-600 dark:text-red-400 gap-2"
                                  onClick={() => setDeletingUser(user)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Remove User
                                </DropdownMenuItem>
                              )}
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

      {/* Force Logout Confirmation Modal */}
      <AlertDialog 
        open={!!forcingLogoutUser} 
        onOpenChange={(open) => !open && setForcingLogoutUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <LogOut className="h-5 w-5" />
              Force Logout: {forcingLogoutUser?.email}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p>
                  Are you sure you want to force this user to log out?
                </p>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 rounded-md text-sm border border-orange-200 dark:border-orange-800">
                  <strong>Warning:</strong> This will immediately invalidate the user's session on all devices. They will need to log in again to access the platform.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="gap-2">
              <X className="h-4 w-4" /> Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleForceLogout}
              className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <LogOut className="h-4 w-4" /> Force Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog 
        open={!!deletingUser} 
        onOpenChange={(open) => {
          if (!open) {
            setDeletingUser(null);
            setDeletePassword("");
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Remove User: {deletingUser?.email}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-2">
                <p>
                  Are you sure you want to permanently remove this user? This action cannot be undone.
                </p>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md text-sm border border-red-200 dark:border-red-800">
                  <strong>Security Verification:</strong> Please enter your password to confirm this deletion.
                </div>
                <div className="space-y-2">
                  <Input 
                    type="password" 
                    placeholder="Enter your password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full"
                  />
                  {deleteError && (
                    <p className="text-sm text-destructive font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {deleteError}
                    </p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="gap-2">
              <X className="h-4 w-4" /> Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isVerifying || !deletePassword}
              onClick={(e) => {
                // Prevent default behavior if needed, usually Button in Footer doesn't auto-close unless it's AlertDialogAction
                // calling handler directly
                handleDeleteUser();
              }}
              className="gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" /> Delete User
                </>
              )}
            </Button>
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
        currentUserPermissions={currentUserPermissions}
      />
    </div>
  );
}