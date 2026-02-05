-- Remove unused columns from audit_evaluations_assigned
ALTER TABLE public.audit_evaluations_assigned
DROP COLUMN IF EXISTS evaluation_id,
DROP COLUMN IF EXISTS is_audited,
DROP COLUMN IF EXISTS source_url;
