-- Fix security warnings for mutable search paths in triggers

-- Fix update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Fix update_modified_column (used by older tables)
-- We check if it exists first to avoid errors
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_modified_column') THEN
        ALTER FUNCTION public.update_modified_column() SET search_path = public;
    END IF;
END $$;
