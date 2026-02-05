-- Add remaining evaluation columns to audit_evaluations_assigned
ALTER TABLE public.audit_evaluations_assigned
ADD COLUMN IF NOT EXISTS interaction_id text,
ADD COLUMN IF NOT EXISTS source_url text,
ADD COLUMN IF NOT EXISTS advocate_name text;
