"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CircleUser, LogOut, User, Users, Shield } from "lucide-react";

interface UserMenuProps {
  email: string;
  firstName: string;
  permissions: string[];
}

export function UserMenu({ email, firstName, permissions }: UserMenuProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const canAccessUsers = permissions.includes('users.access') || permissions.includes('users.view');
  const canAccessRoles = permissions.includes('roles.access') || permissions.includes('roles.manage');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-accent focus-visible:ring-0 focus-visible:ring-offset-0">
          <span className="text-sm font-medium">{firstName}</span>
          <CircleUser className="h-6 w-6" />
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {canAccessUsers && (
          <DropdownMenuItem onClick={() => router.push("/user-management")}>
            <Users className="mr-2 h-4 w-4" />
            <span>User Management</span>
          </DropdownMenuItem>
        )}
        
        {canAccessRoles && (
          <DropdownMenuItem onClick={() => router.push("/roles-permissions")}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Roles & Permissions</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
