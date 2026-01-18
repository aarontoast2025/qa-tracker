# Invite Flow Fix - Summary

## Problem Identified

The invite link was redirecting users to the login page instead of the password setup page. The issue was:

1. **Incorrect redirect URL**: The `redirect_to` parameter in the invite link was pointing to just the root URL (`/`) instead of the callback route with proper parameters
2. **Missing Supabase configuration**: The callback URLs weren't whitelisted in Supabase Dashboard
3. **Environment variable priority**: The code was relying on request headers instead of the more reliable `NEXT_PUBLIC_SITE_URL` environment variable

## Changes Made

### 1. Updated `app/(authenticated)/user-management/actions.ts`

**Changes in `inviteUser()`, `resendInvitation()`, and `sendPasswordReset()` functions:**

- **Prioritized environment variable**: Now uses `process.env.NEXT_PUBLIC_SITE_URL` first (most reliable for production)
- **Improved fallback logic**: Better handling of null values from headers
- **Added logging**: Console logs to track the redirect URL being generated
- **Fixed TypeScript errors**: Proper type handling for nullable values
- **Trailing slash removal**: Ensures consistent URL format

**Before:**
```typescript
const { headers } = await import("next/headers");
const headersList = await headers();
let origin = headersList.get("origin");
// ... fallback logic
const redirectUrl = `${origin}/auth/callback?next=/auth/update-password&flow=invite`;
```

**After:**
```typescript
let origin: string = process.env.NEXT_PUBLIC_SITE_URL || "";
// Fallback to headers if env var not set
if (!origin) {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const headerOrigin = headersList.get("origin");
  // ... improved fallback logic
}
origin = origin.replace(/\/$/, ''); // Remove trailing slash
const redirectUrl = `${origin}/auth/callback?next=/auth/update-password&flow=invite`;
console.log('[inviteUser] Redirect URL:', redirectUrl);
```

### 2. Updated `lib/supabase/middleware.ts`

**Changes:**
- Simplified auth route check for better readability
- Ensures `/auth/*` routes are accessible without authentication

**Before:**
```typescript
if (
  request.nextUrl.pathname !== "/" &&
  !user &&
  !request.nextUrl.pathname.startsWith("/login") &&
  !request.nextUrl.pathname.startsWith("/auth")
) {
  // redirect to login
}
```

**After:**
```typescript
const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");

if (
  request.nextUrl.pathname !== "/" &&
  !user &&
  !request.nextUrl.pathname.startsWith("/login") &&
  !isAuthRoute
) {
  // redirect to login
}
```

### 3. Supabase Dashboard Configuration (Already Done)

You've already added these URLs to your Supabase Dashboard → Authentication → URL Configuration:

✅ **Site URL**: `https://qa-tracker-toast.vercel.app/`
✅ **Redirect URLs**:
   - `https://qa-tracker-toast.vercel.app/auth/callback`
   - `https://qa-tracker-toast.vercel.app/auth/update-password`

## How the Invite Flow Works Now

1. **Admin invites user** → `inviteUser()` function is called
2. **Redirect URL is generated**: `https://qa-tracker-toast.vercel.app/auth/callback?next=/auth/update-password&flow=invite`
3. **Supabase sends email** with verification link containing the redirect URL
4. **User clicks link** → Supabase verifies token and redirects to callback URL
5. **Callback route** (`/auth/callback/route.ts`) checks for `flow=invite` parameter
6. **User is redirected** to `/auth/update-password`
7. **UpdatePasswordForm** verifies session and allows password setup
8. **After password is set** → User is signed out and redirected to login

## Environment Variable Setup

Make sure you have this environment variable set in your deployment (Vercel):

```env
NEXT_PUBLIC_SITE_URL=https://qa-tracker-toast.vercel.app
```

**Note**: No trailing slash!

## Testing the Fix

### Test 1: New User Invitation

1. Go to User Management page
2. Click "Invite User"
3. Enter email and select role
4. Click "Send Invitation"
5. Check server logs for: `[inviteUser] Redirect URL: https://qa-tracker-toast.vercel.app/auth/callback?next=/auth/update-password&flow=invite`
6. Check email inbox for invite link
7. Click the invite link
8. **Expected**: User should land on password setup page
9. Set password
10. **Expected**: Redirected to login page with success message

### Test 2: Resend Invitation

1. Find a user with "invited" status
2. Click the three dots menu → "Resend Invitation"
3. Check server logs for: `[resendInvitation] Redirect URL: ...`
4. Follow steps 6-10 from Test 1

### Test 3: Password Reset

1. Find an active user
2. Click the three dots menu → "Send Password Reset"
3. Check server logs for: `[sendPasswordReset] Redirect URL: ...` (should have `flow=recovery`)
4. Check email for password reset link
5. Click the link
6. **Expected**: User should land on password setup page
7. Set new password
8. **Expected**: Redirected to login page

## Debugging

If issues persist, check:

1. **Server logs** for the redirect URL being generated
2. **Email content** to see the actual link Supabase is sending
3. **Browser console** for any JavaScript errors
4. **Network tab** to see the redirect chain
5. **Supabase Dashboard** → Authentication → Logs for any errors

## Common Issues and Solutions

### Issue: Still redirecting to login page

**Solution**: 
- Verify `NEXT_PUBLIC_SITE_URL` is set correctly in Vercel
- Check that the URL in Supabase Dashboard matches exactly (no trailing slash)
- Redeploy the application after making changes

### Issue: "Unable to verify invitation link" error

**Solution**:
- The token might have expired (24 hours)
- Resend the invitation
- Check Supabase logs for token verification errors

### Issue: Redirect URL is localhost in production

**Solution**:
- Set `NEXT_PUBLIC_SITE_URL` environment variable in Vercel
- Redeploy the application

## Additional Notes

- The `flow` parameter (`invite` or `recovery`) helps the callback route determine the user's intent
- The callback route checks `last_sign_in_at` as a fallback to detect new users
- Console logs are added for debugging and can be removed in production if desired
- The middleware now properly allows all `/auth/*` routes without authentication
