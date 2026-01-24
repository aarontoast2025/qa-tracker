-- Add middle_name column to roster_employees
ALTER TABLE public.roster_employees
ADD COLUMN IF NOT EXISTS middle_name text;
