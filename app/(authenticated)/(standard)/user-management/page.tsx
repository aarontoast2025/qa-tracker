import { createAdminClient } from "@/lib/supabase/admin";
import { UserManagement, UserManagementData } from "@/components/user-management";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyPermissions } from "@/lib/supabase/permissions";

export default async function UserManagementPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch current user's permissions
  const currentUserPermissions = await getMyPermissions();

  const adminClient = createAdminClient();

  // Fetch all users from Auth
  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers();
  
  if (authError) {
    console.error("Error fetching auth users:", authError);
    return <div>Error loading users. Please ensure SUPABASE_SERVICE_ROLE_KEY is set.</div>;
  }

  // Fetch all profiles with roles and suspension status
  const { data: profiles, error: profileError } = await adminClient
    .from("user_profiles")
    .select("id, first_name, last_name, employee_id, nt_login, mobile_number, company_email, program_email, is_suspended, avatar_url, user_roles(name)");

  if (profileError) {
    console.error("Error fetching profiles:", JSON.stringify(profileError, null, 2));
    // Provide an empty array as fallback if fetch fails to avoid crashing the merge logic
    return <div>Error loading profiles: {profileError.message || "Unknown error"}. Please check if the 'is_suspended' column exists in 'user_profiles' table.</div>;
  }

  const allProfiles = profiles || [];

  // Fetch all roles for the invitation modal
  const { data: roles } = await adminClient
    .from("user_roles")
    .select("id, name")
    .order("name");

  // Merge data
  const mergedUsers: UserManagementData[] = authData.users.map((authUser) => {
    const profile = allProfiles.find((p) => p.id === authUser.id);
    
    // Check if user is suspended first (highest priority)
    let status: UserManagementData["status"];
    
    if (profile?.is_suspended) {
      status = "suspended";
    } else if (authUser.last_sign_in_at) {
      status = "active";
    } else {
      status = "invited";
      // Check for expiration (24 hours) if not yet signed in
      if (authUser.confirmation_sent_at) {
        const sentAt = new Date(authUser.confirmation_sent_at).getTime();
        const now = new Date().getTime();
        if (now - sentAt > 24 * 60 * 60 * 1000) {
          status = "expired";
        }
      }
    }

    return {
      id: authUser.id,
      email: authUser.email,
      first_name: profile?.first_name || null,
      last_name: profile?.last_name || null,
      employee_id: profile?.employee_id || null,
      nt_login: profile?.nt_login || null,
      mobile_number: profile?.mobile_number || null,
      company_email: profile?.company_email || null,
      program_email: profile?.program_email || null,
      avatar_url: profile?.avatar_url || null,
      role: (profile?.user_roles as any)?.name || "Viewer",
      status,
      is_suspended: profile?.is_suspended || false,
      last_sign_in_at: authUser.last_sign_in_at || null,
      created_at: authUser.created_at,
    };
  });

  // Sort by created_at descending
  mergedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="w-full">
      <UserManagement 
        initialUsers={mergedUsers} 
        roles={roles || []} 
        currentUserPermissions={currentUserPermissions} 
      />
    </div>
  );
}