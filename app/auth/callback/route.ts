import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `request` object gives us access to the URL and query parameters
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    // Create a Supabase client capable of setting cookies
    const supabase = await createClient();

    // Exchange the auth code for a user session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If successful, redirect the user to the intended page
      // relying on the browser to handle the redirect to the correct origin
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${requestUrl.origin}${next}`);
      }
    }
  }

  // If there's no code or an error occurred, redirect to an error page
  return NextResponse.redirect(`${requestUrl.origin}/auth/error`);
}
