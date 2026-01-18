# Invite Flow - Setup Checklist

## ✅ Completed Items

- [x] Added redirect URLs to Supabase Dashboard
  - [x] `https://qa-tracker-toast.vercel.app/auth/callback`
  - [x] `https://qa-tracker-toast.vercel.app/auth/update-password`
- [x] Updated `actions.ts` with improved redirect URL logic
- [x] Updated `middleware.ts` to allow auth routes
- [x] Added logging for debugging

## 🔧 Action Items for You

### 1. Set Environment Variable in Vercel

Go to your Vercel project settings and add:

```
NEXT_PUBLIC_SITE_URL=https://qa-tracker-toast.vercel.app
```

**Important**: No trailing slash!

**Steps**:
1. Go to Vercel Dashboard
2. Select your project (qa-tracker-toast)
3. Go to Settings → Environment Variables
4. Add new variable:
   - Name: `NEXT_PUBLIC_SITE_URL`
   - Value: `https://qa-tracker-toast.vercel.app`
   - Environment: Production (and Preview if needed)
5. Click "Save"

### 2. Redeploy Your Application

After setting the environment variable:

1. Go to Vercel Dashboard → Deployments
2. Click on the latest deployment
3. Click "Redeploy" button
4. Wait for deployment to complete

OR

Push a new commit to trigger automatic deployment:
```bash
git add .
git commit -m "Fix invite flow redirect URL"
git push
```

### 3. Test the Invite Flow

Once deployed, test the complete flow:

1. **Invite a new user**:
   - Go to User Management
   - Click "Invite User"
   - Enter a test email
   - Check the email for the invite link
   - Click the link
   - ✅ Should land on password setup page (not login)

2. **Check server logs** (Vercel Dashboard → Logs):
   - Look for: `[inviteUser] Redirect URL: https://qa-tracker-toast.vercel.app/auth/callback?next=/auth/update-password&flow=invite`
   - This confirms the correct URL is being generated

3. **Complete password setup**:
   - Enter a password
   - Click "Set Password"
   - ✅ Should redirect to login page with success message

## 🐛 If Issues Persist

### Check 1: Verify Environment Variable
```bash
# In your Vercel deployment logs, you should see:
[inviteUser] Redirect URL: https://qa-tracker-toast.vercel.app/auth/callback?next=/auth/update-password&flow=invite
```

If you see `http://localhost:3000` instead, the environment variable is not set correctly.

### Check 2: Verify Supabase Configuration

Go to Supabase Dashboard → Authentication → URL Configuration:
- Site URL should be: `https://qa-tracker-toast.vercel.app/`
- Redirect URLs should include both callback and update-password URLs

### Check 3: Check Email Link

When you receive the invite email, the link should look like:
```
https://gmawsnjwdeefwzradbzn.supabase.co/auth/v1/verify?token=...&type=invite&redirect_to=https://qa-tracker-toast.vercel.app/auth/callback?next=/auth/update-password&flow=invite
```

The `redirect_to` parameter should contain the full callback URL with parameters.

### Check 4: Browser Console

Open browser console (F12) when clicking the invite link and check for:
- Any JavaScript errors
- Network requests showing the redirect chain
- Session storage/cookies being set

## 📝 Notes

- Changes are already committed to your codebase
- The main missing piece is the environment variable in Vercel
- After setting the env var and redeploying, the invite flow should work correctly
- The logging will help you debug any remaining issues

## 🎯 Expected Behavior After Fix

1. User receives invite email
2. Clicks link in email
3. Supabase verifies token
4. Redirects to: `/auth/callback?next=/auth/update-password&flow=invite`
5. Callback route detects `flow=invite`
6. Redirects to: `/auth/update-password`
7. User sets password
8. Redirects to login page with success message

## ✨ Success Criteria

- ✅ Invite link redirects to password setup page (not login)
- ✅ User can set password successfully
- ✅ After setting password, user is redirected to login
- ✅ User can log in with new credentials
- ✅ Server logs show correct redirect URL
