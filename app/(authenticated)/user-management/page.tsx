import { createAdminClient } from "@/lib/supabase/admin";
import { UserManagement, UserManagementData } from "@/components/user-management";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function UserManagementPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  const adminClient = createAdminClient();

  // Fetch all users from Auth
  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers();
  
  if (authError) {
    console.error("Error fetching auth users:", authError);
    return <div>Error loading users. Please ensure SUPABASE_SERVICE_ROLE_KEY is set.</div>;
  }

  // Fetch all profiles
  const { data: profiles, error: profileError } = await adminClient
    .from("user_profiles")
    .select("id, first_name, last_name, program_email");

  if (profileError) {
    console.error("Error fetching profiles:", profileError);
  }

  // Merge data
  const mergedUsers: UserManagementData[] = authData.users.map((authUser) => {
    const profile = profiles?.find((p) => p.id === authUser.id);
    return {
      id: authUser.id,
      email: authUser.email,
      first_name: profile?.first_name || null,
      last_name: profile?.last_name || null,
      status: authUser.last_sign_in_at ? "active" : "invited",
      last_sign_in_at: authUser.last_sign_in_at || null,
      created_at: authUser.created_at,
    };
  });

  // Sort by created_at descending
  mergedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <UserManagement initialUsers={mergedUsers} />
    </div>
  );
}