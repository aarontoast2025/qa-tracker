-- 1. Function to calculate Tenure and Tenure Bucket
CREATE OR REPLACE FUNCTION update_tenure_columns()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    months_diff numeric;
BEGIN
    -- If production_date is null, clear tenure fields
    IF NEW.production_date IS NULL THEN
        NEW.tenure = NULL;
        NEW.tenure_bucket = NULL;
        RETURN NEW;
    END IF;

    -- Calculate tenure in months
    -- (Year diff * 12) + Month diff. 
    -- We use age() which returns an interval, then extract parts.
    -- We can also check days to be precise, but simple month difference is usually enough.
    months_diff := (EXTRACT(YEAR FROM age(CURRENT_DATE, NEW.production_date)) * 12) + 
                   EXTRACT(MONTH FROM age(CURRENT_DATE, NEW.production_date));
    
    -- Ensure non-negative
    NEW.tenure := GREATEST(0, months_diff);
    
    -- Determine Tenure Bucket
    IF NEW.tenure < 6 THEN
        NEW.tenure_bucket := '0-6 Months';
    ELSIF NEW.tenure < 12 THEN
        NEW.tenure_bucket := '6-12 Months';
    ELSIF NEW.tenure < 24 THEN
        NEW.tenure_bucket := '1-2 Years';
    ELSE
        NEW.tenure_bucket := '> 2 Years';
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Trigger for Tenure Calculation
DROP TRIGGER IF EXISTS tr_update_tenure ON public.roster_employees;
CREATE TRIGGER tr_update_tenure
    BEFORE INSERT OR UPDATE OF production_date ON public.roster_employees
    FOR EACH ROW
    EXECUTE FUNCTION update_tenure_columns();

-- 3. RPC to fetch Metadata for Autocomplete
-- Returns distinct values for various columns to populate UI suggestions
CREATE OR REPLACE FUNCTION get_roster_metadata()
RETURNS json 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'roles', (SELECT COALESCE(json_agg(DISTINCT role ORDER BY role), '[]'::json) FROM roster_employees WHERE role IS NOT NULL AND role != ''),
        'locations', (SELECT COALESCE(json_agg(DISTINCT location ORDER BY location), '[]'::json) FROM roster_employees WHERE location IS NOT NULL AND location != ''),
        'skills', (SELECT COALESCE(json_agg(DISTINCT skill ORDER BY skill), '[]'::json) FROM roster_employees WHERE skill IS NOT NULL AND skill != ''),
        'channels', (SELECT COALESCE(json_agg(DISTINCT channel ORDER BY channel), '[]'::json) FROM roster_employees WHERE channel IS NOT NULL AND channel != ''),
        'tiers', (SELECT COALESCE(json_agg(DISTINCT tier ORDER BY tier), '[]'::json) FROM roster_employees WHERE tier IS NOT NULL AND tier != ''),
        'waves', (SELECT COALESCE(json_agg(DISTINCT wave ORDER BY wave), '[]'::json) FROM roster_employees WHERE wave IS NOT NULL AND wave != ''),
        'supervisors', (
            SELECT COALESCE(json_agg(DISTINCT (first_name || ' ' || last_name)) FILTER (WHERE role ILIKE '%Supervisor%'), '[]'::json) 
            FROM roster_employees
        ),
        'managers', (
            SELECT COALESCE(json_agg(DISTINCT (first_name || ' ' || last_name)) FILTER (WHERE role ILIKE '%Manager%'), '[]'::json) 
            FROM roster_employees
        )
    ) INTO result;
    
    RETURN result;
END;
$$;
