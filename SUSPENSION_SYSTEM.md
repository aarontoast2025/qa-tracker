# User Suspension System

## Overview
The suspension system ensures that when a user is suspended, they are immediately blocked from accessing the application, whether they're currently logged in or trying to log in.

## How It Works

### 1. **Login Prevention** (`components/login-form.tsx`)
When a user tries to log in:
- After successful authentication, the system checks if the user is suspended
- If suspended, they are immediately logged out and shown an error message
- They cannot proceed to the application

### 2. **Middleware Check** (`lib/supabase/middleware.ts`)
On every page request:
- The middleware checks if the authenticated user is suspended
- If suspended, they are logged out and redirected to login with a message
- This catches suspended users on page navigation/refresh

### 3. **Real-Time Monitor** (`components/suspension-monitor.tsx`)
While a user is logged in:
- A real-time listener monitors the user's suspension status
- If an admin suspends the user while they're active, they are immediately logged out
- The user is redirected to login with a suspension message
- This ensures instant enforcement without requiring page refresh

## Implementation Details

### Files Modified/Created:

1. **`components/suspension-monitor.tsx`** (NEW)
   - Client component that monitors suspension status in real-time
   - Uses Supabase real-time subscriptions
   - Automatically logs out and redirects suspended users

2. **`app/(authenticated)/layout.tsx`** (MODIFIED)
   - Added SuspensionMonitor component
   - Passes current user ID to the monitor

3. **`lib/supabase/middleware.ts`** (MODIFIED)
   - Added suspension check on every request
   - Logs out and redirects suspended users

4. **`components/login-form.tsx`** (MODIFIED)
   - Added suspension check after successful login
   - Prevents suspended users from logging in

## User Experience

### For Suspended Users:
1. **Already Logged In**: Immediately logged out and redirected to login page
2. **Trying to Log In**: Login succeeds but immediately logs out with error message
3. **Navigating Pages**: Caught by middleware and redirected to login
4. **Message Shown**: "Your account has been suspended. Please contact an administrator."

### For Administrators:
1. Suspend a user from User Management page
2. User is immediately blocked (even if currently logged in)
3. No delay or waiting for user to refresh

## Security Features

- ✅ **Multi-layer protection**: Login, middleware, and real-time monitoring
- ✅ **Immediate enforcement**: No grace period for suspended users
- ✅ **Real-time updates**: Uses Supabase real-time subscriptions
- ✅ **Clear messaging**: Users know why they can't access the system
- ✅ **No bypass**: All entry points are protected

## Testing

To test the suspension system:

1. **Test Real-Time Suspension**:
   - Log in as User A
   - Have an admin suspend User A while they're logged in
   - User A should be immediately logged out

2. **Test Login Prevention**:
   - Suspend a user
   - Try to log in as that user
   - Login should fail with suspension message

3. **Test Middleware Protection**:
   - Log in as a user
   - Have admin suspend them
   - Try to navigate to any page
   - Should be redirected to login

## Database Requirements

The system requires the `user_profiles` table to have:
- `is_suspended` column (boolean)
- Proper RLS policies for reading suspension status

## Notes

- The suspension check adds minimal overhead (single database query)
- Real-time monitoring is efficient and only listens for the current user
- The system gracefully handles network issues and reconnects automatically
