import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is suspended (only for authenticated users on protected routes)
  if (user && !request.nextUrl.pathname.startsWith("/auth")) {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('is_suspended')
        .eq('id', user.id)
        .single();

      // If there's an error or no profile, skip suspension check
      if (!error && profile?.is_suspended) {
        // User is suspended, log them out and redirect to login
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        url.searchParams.set("message", "Your account has been suspended. Please contact an administrator.");
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // If database query fails, log error but don't block the request
      console.error('Middleware suspension check failed:', error);
    }

    // Check if user must change password (e.g. invited users)
    if (user.user_metadata?.must_change_password) {
      const isUpdatePasswordPage = request.nextUrl.pathname === "/auth/update-password";
      const isSignOut = request.nextUrl.pathname.startsWith("/auth/sign-out");
      
      if (!isUpdatePasswordPage && !isSignOut && !request.nextUrl.pathname.startsWith('/auth/callback')) {
         const url = request.nextUrl.clone();
         url.pathname = "/auth/update-password";
         return NextResponse.redirect(url);
      }
    }
  }

  // Allow access to auth routes, embed APIs, and public scripts without authentication
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  const isPublicApi = request.nextUrl.pathname.startsWith("/api/embed") || 
                     request.nextUrl.pathname.startsWith("/api/summarize") ||
                     request.nextUrl.pathname.startsWith("/api/ai-config") ||
                     request.nextUrl.pathname.startsWith("/api/dictionary") ||
                     request.nextUrl.pathname.startsWith("/api/case-notes-checker");
  const isPublicFile = request.nextUrl.pathname === "/qa-form.js";
  
  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !isAuthRoute &&
    !isPublicApi &&
    !isPublicFile
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
