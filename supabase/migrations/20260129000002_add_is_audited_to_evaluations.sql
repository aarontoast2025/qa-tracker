-- Add is_audited column to audit_evaluations
ALTER TABLE audit_evaluations ADD COLUMN IF NOT EXISTS is_audited BOOLEAN DEFAULT FALSE;
