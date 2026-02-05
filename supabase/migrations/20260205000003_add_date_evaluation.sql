-- Add date_evaluation to audit_evaluations_assigned
ALTER TABLE public.audit_evaluations_assigned
ADD COLUMN IF NOT EXISTS date_evaluation timestamp with time zone DEFAULT now();
