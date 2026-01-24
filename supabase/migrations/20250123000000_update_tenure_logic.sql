-- Update the tenure calculation function to use days and new buckets
CREATE OR REPLACE FUNCTION update_tenure_columns()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    days_diff integer;
BEGIN
    -- If production_date is null, clear tenure fields
    IF NEW.production_date IS NULL THEN
        NEW.tenure = NULL;
        NEW.tenure_bucket = NULL;
        RETURN NEW;
    END IF;

    -- Calculate tenure in days
    days_diff := (CURRENT_DATE - NEW.production_date);
    
    -- Ensure non-negative
    NEW.tenure := GREATEST(0, days_diff);
    
    -- Determine Tenure Bucket
    IF NEW.tenure <= 30 THEN
        NEW.tenure_bucket := '0-30 Days';
    ELSIF NEW.tenure <= 90 THEN
        NEW.tenure_bucket := '31-90 Days';
    ELSE
        NEW.tenure_bucket := '90+ Days';
    END IF;

    RETURN NEW;
END;
$$;

-- We don't need to recreate the trigger as it calls this function by name, 
-- but we should probably trigger a re-calculation for existing rows.
-- However, triggers only fire on UPDATE/INSERT. 
-- To backfill, we can run a simple UPDATE statement.

UPDATE public.roster_employees 
SET production_date = production_date 
WHERE production_date IS NOT NULL;
