import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/supabase/permissions";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Check Permissions
  const canViewProfile = await hasPermission("profile.view");
  if (!canViewProfile) {
    return redirect("/");
  }

  const canUpdateProfile = await hasPermission("profile.update");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*, user_roles(name)")
    .eq("id", user.id)
    .single();

  const userRole = (profile?.user_roles as any)?.name || "N/A";

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <ProfileForm 
        initialData={profile} 
        userId={user.id} 
        userEmail={user.email || ""}
        userRole={userRole}
        canUpdateProfile={canUpdateProfile}
      />
    </div>
  );
}
