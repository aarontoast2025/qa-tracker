-- 1. Create permissions for Roster
INSERT INTO public.user_permissions (code, name, description, group_name)
VALUES 
  ('roster.view', 'View Roster', 'Ability to view the employee roster', 'Roster Management'),
  ('roster.add', 'Add Employee', 'Ability to add new employees to the roster', 'Roster Management'),
  ('roster.update', 'Update Employee', 'Ability to update employee details', 'Roster Management'),
  ('roster.delete', 'Delete Employee', 'Ability to remove employees from the roster', 'Roster Management')
ON CONFLICT (code) DO NOTHING;

-- 2. Create roster_employees table
CREATE TABLE IF NOT EXISTS public.roster_employees (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    eid text,
    case_safe_id text,
    toasttab_email text,
    location text,
    last_name text,
    first_name text,
    skill text,
    channel text,
    tier text,
    role text, -- Job Title
    status text,
    wave text,
    production_date date,
    supervisor text,
    manager text,
    tenure numeric, -- Assuming tenure is a number (e.g., months or years)
    tenure_bucket text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.roster_employees ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (with cleanup to prevent "already exists" errors)

-- View Policy
DROP POLICY IF EXISTS "Users with roster.view can view employees" ON public.roster_employees;
CREATE POLICY "Users with roster.view can view employees" ON public.roster_employees
FOR SELECT
TO authenticated
USING (has_permission('roster.view'));

-- Add Policy
DROP POLICY IF EXISTS "Users with roster.add can insert employees" ON public.roster_employees;
CREATE POLICY "Users with roster.add can insert employees" ON public.roster_employees
FOR INSERT
TO authenticated
WITH CHECK (has_permission('roster.add'));

-- Update Policy
DROP POLICY IF EXISTS "Users with roster.update can update employees" ON public.roster_employees;
CREATE POLICY "Users with roster.update can update employees" ON public.roster_employees
FOR UPDATE
TO authenticated
USING (has_permission('roster.update'));

-- Delete Policy
DROP POLICY IF EXISTS "Users with roster.delete can delete employees" ON public.roster_employees;
CREATE POLICY "Users with roster.delete can delete employees" ON public.roster_employees
FOR DELETE
TO authenticated
USING (has_permission('roster.delete'));

-- 5. Create Helper Function for Updated At
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;

-- 6. Trigger for updated_at
DROP TRIGGER IF EXISTS update_roster_employees_modtime ON public.roster_employees;
CREATE TRIGGER update_roster_employees_modtime
    BEFORE UPDATE ON public.roster_employees
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();