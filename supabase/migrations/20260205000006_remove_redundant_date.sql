-- Remove redundant date_evaluation column
ALTER TABLE public.audit_evaluations_assigned
DROP COLUMN IF EXISTS date_evaluation;
