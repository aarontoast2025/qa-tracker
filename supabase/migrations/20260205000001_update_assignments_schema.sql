-- Add evaluation data columns to audit_evaluations_assigned
ALTER TABLE public.audit_evaluations_assigned
ADD COLUMN IF NOT EXISTS call_ani text,
ADD COLUMN IF NOT EXISTS case_number text,
ADD COLUMN IF NOT EXISTS call_duration text,
ADD COLUMN IF NOT EXISTS date_interaction timestamp with time zone,
ADD COLUMN IF NOT EXISTS case_category text,
ADD COLUMN IF NOT EXISTS issue_concern text,
ADD COLUMN IF NOT EXISTS form_data jsonb,
ADD COLUMN IF NOT EXISTS qa_score numeric,
ADD COLUMN IF NOT EXISTS supervisor text;
