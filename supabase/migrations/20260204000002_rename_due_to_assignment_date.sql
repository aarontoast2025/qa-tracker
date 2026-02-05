-- Rename due_date to assignment_date in audit_evaluations_assigned
ALTER TABLE public.audit_evaluations_assigned 
RENAME COLUMN due_date TO assignment_date;

-- Add a comment for clarity
COMMENT ON COLUMN public.audit_evaluations_assigned.assignment_date IS 'The date the audit was assigned to be performed.';
