-- Add indexes to audit_evaluations_assigned for performance
CREATE INDEX IF NOT EXISTS idx_audit_assignments_qa_id ON public.audit_evaluations_assigned(qa_id);
CREATE INDEX IF NOT EXISTS idx_audit_assignments_specialist_id ON public.audit_evaluations_assigned(specialist_id);
CREATE INDEX IF NOT EXISTS idx_audit_assignments_assignment_date ON public.audit_evaluations_assigned(assignment_date);
CREATE INDEX IF NOT EXISTS idx_audit_assignments_status ON public.audit_evaluations_assigned(status);

-- Add indexes to roster_employees for common filter columns if not already present
CREATE INDEX IF NOT EXISTS idx_roster_employees_skill ON public.roster_employees(skill);
CREATE INDEX IF NOT EXISTS idx_roster_employees_channel ON public.roster_employees(channel);
CREATE INDEX IF NOT EXISTS idx_roster_employees_supervisor ON public.roster_employees(supervisor);
CREATE INDEX IF NOT EXISTS idx_roster_employees_role_status ON public.roster_employees(role, status);
