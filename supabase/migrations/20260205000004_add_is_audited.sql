-- Add is_audited to audit_evaluations_assigned
ALTER TABLE public.audit_evaluations_assigned
ADD COLUMN IF NOT EXISTS is_audited boolean DEFAULT false;
