-- Run this in Supabase SQL Editor to check trigger status

-- 1. Check if the trigger exists and is enabled
SELECT 
    tgname AS trigger_name,
    tgenabled AS enabled,
    tgrelid::regclass AS table_name,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgname = 'tr_protect_admin_profiles';

-- 2. Check the protect_admin_profiles function
SELECT 
    proname AS function_name,
    prosecdef AS is_security_definer,
    pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'protect_admin_profiles';

-- 3. Check if service_role can bypass the trigger
-- (This should return TRUE - service_role should bypass RLS and triggers)
SELECT current_setting('is_superuser', true) AS is_superuser;

-- 4. Test if you can delete with service_role
-- First, find a test user (invited but not signed in)
SELECT id, program_email, role_id, created_at
FROM user_profiles
WHERE id NOT IN (SELECT id FROM auth.users WHERE last_sign_in_at IS NOT NULL)
LIMIT 5;

-- Note: Don't actually delete here, just checking if the query would work
