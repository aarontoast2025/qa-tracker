import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/";
  const code = requestUrl.searchParams.get("code");

  // Handle token_hash flow (from email template)
  if (token_hash && type) {
    const supabase = await createClient();
    
    console.log('[callback] Verifying token_hash for type:', type);
    
    // Verify the token hash
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    console.log('[callback] Verification result:', { 
      hasSession: !!data?.session, 
      hasUser: !!data?.user,
      error: error?.message 
    });

    if (error) {
      console.error('[callback] Token verification error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=${encodeURIComponent(error.message)}`);
    }

    if (data.session) {
      // For invite type, redirect to password setup
      if (type === 'invite') {
        console.log('[callback] Redirecting to password setup for invite');
        return NextResponse.redirect(`${requestUrl.origin}/auth/update-password`);
      }
      
      // For other types, redirect to next parameter
      console.log('[callback] Redirecting to:', next);
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }
    
    // If no session but no error, something unexpected happened
    console.error('[callback] No session created but no error returned');
    return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=No session created`);
  }

  // Handle code flow (OAuth/PKCE)
  if (code) {
    const supabase = await createClient();

    // Exchange the auth code for a user session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const flow = requestUrl.searchParams.get("flow");
      
      // If this is an invite flow, force redirect to password setup
      if (flow === 'invite') {
        return NextResponse.redirect(`${requestUrl.origin}/auth/update-password`);
      }

      // Check if the user needs to set their password
      const { data: { user } } = await supabase.auth.getUser();
      
      // If user has never signed in (invited user accepting invitation)
      if (user && !user.last_sign_in_at) {
        return NextResponse.redirect(`${requestUrl.origin}/auth/update-password`);
      }
      
      // If user has already set password, use the 'next' parameter
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }
  }

  // If there's no code/token or an error occurred, redirect to error page
  return NextResponse.redirect(`${requestUrl.origin}/auth/error`);
}
