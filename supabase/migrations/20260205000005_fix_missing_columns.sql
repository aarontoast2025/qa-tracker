-- Add missing evaluation tracking columns to audit_evaluations_assigned
ALTER TABLE public.audit_evaluations_assigned
ADD COLUMN IF NOT EXISTS interaction_id text,
ADD COLUMN IF NOT EXISTS source_url text,
ADD COLUMN IF NOT EXISTS date_evaluation timestamp with time zone;

-- Update the status check if not already inclusive (safety check)
ALTER TABLE public.audit_evaluations_assigned 
DROP CONSTRAINT IF EXISTS audit_evaluations_assigned_status_check;

ALTER TABLE public.audit_evaluations_assigned
ADD CONSTRAINT audit_evaluations_assigned_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'in-progress'::text, 'completed'::text]));
