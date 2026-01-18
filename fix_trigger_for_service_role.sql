-- INVESTIGATION: Check why service_role cannot delete from user_profiles
-- Run these queries in Supabase SQL Editor one by one

-- Step 1: Check the protect_admin_profiles function source code
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'protect_admin_profiles';

-- Step 2: The problem might be that the trigger checks auth.uid()
-- even for service_role. Let's modify the trigger function to bypass for service_role:

CREATE OR REPLACE FUNCTION protect_admin_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_target_admin boolean;
    is_actor_admin boolean;
    admin_role_id uuid;
BEGIN
    -- ✅ FIX: Allow service_role to bypass this trigger completely
    IF current_setting('role', true) = 'service_role' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    -- Get Admin Role ID
    SELECT id INTO admin_role_id FROM user_roles WHERE name = 'Admin';
    
    -- Check if target IS or WAS an admin
    IF (TG_OP = 'DELETE') THEN
        is_target_admin := (OLD.role_id = admin_role_id);
    ELSE
        -- For UPDATE/INSERT
        is_target_admin := (OLD.role_id = admin_role_id) OR (NEW.role_id = admin_role_id);
    END IF;
    
    -- If not dealing with admin profile, allow operation
    IF NOT is_target_admin THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;
    
    -- Check if actor is admin
    is_actor_admin := EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN user_roles r ON up.role_id = r.id
        WHERE up.id = auth.uid() AND r.name = 'Admin'
    );
    
    -- If target is admin but actor is not, block the operation
    IF is_target_admin AND NOT is_actor_admin THEN
        RAISE EXCEPTION 'Only administrators can modify or delete admin profiles';
    END IF;
    
    -- Allow operation if actor is admin
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Step 3: Verify the function was updated
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'protect_admin_profiles';
