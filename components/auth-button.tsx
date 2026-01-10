import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./user-menu";
import { getMyPermissions } from "@/lib/supabase/permissions";

export async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/auth/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  const [profileResponse, permissions] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("first_name")
      .eq("id", user.id)
      .single(),
    getMyPermissions()
  ]);

  const firstName = profileResponse.data?.first_name || user.email?.split("@")[0] || "User";

  return (
    <UserMenu 
      email={user.email || ""} 
      firstName={firstName} 
      permissions={permissions} 
    />
  );
}
