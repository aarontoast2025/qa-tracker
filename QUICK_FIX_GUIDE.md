# Quick Fix Guide - Bookmarklet Not Loading

## The Problem
Your bookmarklet shows "Loading..." forever because the old `qa-form.js` tried to query Supabase directly, but RLS policies blocked unauthenticated access.

## The Solution (3 Steps)

### Step 1: Apply Database Migration
Run this SQL in your Supabase Dashboard (SQL Editor):

```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/20260127000000_add_public_embed_policies.sql
```

This adds public read access for active forms only.

### Step 2: Verify Your Form is Active
In Supabase, check that your form has `status = 'active'`:

```sql
SELECT id, title, status 
FROM tracker_audit_forms 
WHERE id = '41e96e83-dad5-4752-be7f-ae0a5dd31406';
```

If status is 'draft', update it:

```sql
UPDATE tracker_audit_forms 
SET status = 'active' 
WHERE id = '41e96e83-dad5-4752-be7f-ae0a5dd31406';
```

### Step 3: Deploy Changes
```bash
# Commit and push to GitHub
git add .
git commit -m "Fix bookmarklet: Use API endpoint with public RLS policies"
git push origin main

# Wait 1-2 minutes for GitHub Pages to update
# Then test the bookmarklet on Stellaconnect
```

## Testing

### Test the API Endpoint
Open in browser:
```
https://qa-tracker-toast.vercel.app/api/embed/form/41e96e83-dad5-4752-be7f-ae0a5dd31406
```

You should see JSON with form data.

### Test the Bookmarklet
1. Open `test-bookmarklet.html` in your browser
2. Click "Test API Endpoint" - should show success
3. Click "Load QA Form Script" - form should appear

### Test on Stellaconnect
1. Go to a Stellaconnect interaction page
2. Click your bookmarklet
3. Form should load (no more infinite "Loading...")

## What Changed

| File | Change |
|------|--------|
| `app/api/embed/form/[id]/route.ts` | Now uses public Supabase client (no auth required) |
| `public/qa-form.js` | Fetches from API instead of direct Supabase queries |
| `supabase/migrations/...` | Adds RLS policies for public read access to active forms |

## Troubleshooting

**Still showing "Loading..."?**
- Check browser console for errors
- Verify the migration was applied
- Ensure form status is 'active'
- Clear browser cache

**API returns 404?**
- Check the form ID is correct
- Verify form exists in database

**API returns empty data?**
- Check RLS policies were applied
- Verify form status is 'active'

## Security Notes

✅ Only forms with `status = 'active'` are publicly accessible  
✅ Draft and archived forms remain protected  
✅ Write operations still require authentication  
✅ RLS policies protect sensitive data  

---

**Need Help?** Check `BOOKMARKLET_FIX_SUMMARY.md` for detailed explanation.
