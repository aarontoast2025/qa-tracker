import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // For bookmarklet, redirecting to login is fine, 
    // it will return here after login if handled by NextAuth/Supabase Auth
    const currentPath = encodeURIComponent(`/embed/audit`);
    redirect(`/auth/login?next=${currentPath}`);
  }

  return (
    <main className="min-h-screen bg-background">
      {children}
    </main>
  );
}
