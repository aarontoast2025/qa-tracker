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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Check if the user needs to set their password
      // If they've never logged in before (new invite), redirect to update-password
      const { data: { user } } = await supabase.auth.getUser();
      
      // If user has never signed in (invited user accepting invitation)
      // Redirect them to password setup regardless of the 'next' parameter
      if (user && !user.last_sign_in_at) {
        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${requestUrl.origin}/auth/update-password`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}/auth/update-password`);
        } else {
          return NextResponse.redirect(`${requestUrl.origin}/auth/update-password`);
        }
      }
      
      // If user has already set password, use the 'next' parameter
      const forwardedHost = request.headers.get("x-forwarded-host");
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
