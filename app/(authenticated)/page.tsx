import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InfoIcon, Loader2 } from "lucide-react";
import { Suspense } from "react";

async function UserDetails() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  return JSON.stringify(user, null, 2);
}

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          Welcome to your QA Tracker dashboard.
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Account Details</h2>
        <pre className="text-xs font-mono p-3 rounded border w-full max-h-64 overflow-auto bg-muted/50">
          <Suspense fallback={<Loader2 className="h-4 w-4 animate-spin" />}>
            <UserDetails />
          </Suspense>
        </pre>
      </div>
    </div>
  );
}
