-- RPC to fetch Metadata for Autocomplete
-- Updated to include statuses and fetch supervisors/managers from their respective columns
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
        'statuses', (SELECT COALESCE(json_agg(DISTINCT status ORDER BY status), '[]'::json) FROM roster_employees WHERE status IS NOT NULL AND status != ''),
        'supervisors', (SELECT COALESCE(json_agg(DISTINCT supervisor ORDER BY supervisor), '[]'::json) FROM roster_employees WHERE supervisor IS NOT NULL AND supervisor != ''),
        'managers', (SELECT COALESCE(json_agg(DISTINCT manager ORDER BY manager), '[]'::json) FROM roster_employees WHERE manager IS NOT NULL AND manager != '')
    ) INTO result;
    
    RETURN result;
END;
$$;
