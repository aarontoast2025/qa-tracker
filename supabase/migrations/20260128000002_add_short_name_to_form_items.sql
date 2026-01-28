-- Add short_name column to form_items
ALTER TABLE public.form_items ADD COLUMN IF NOT EXISTS short_name text;

-- Update existing items to have a short_name (copy from label or default)
UPDATE public.form_items SET short_name = label WHERE short_name IS NULL;

-- Make it required if you want, but strictly speaking keeping it nullable for DB safety is easier for now, 
-- though the user said "That is required". We'll enforce in UI and API.
-- ALTER TABLE public.form_items ALTER COLUMN short_name SET NOT NULL;
