-- Remove old feedback column from options
ALTER TABLE public.tracker_audit_item_options DROP COLUMN IF EXISTS feedback_text;

-- Remove old tags table
DROP TABLE IF EXISTS public.tracker_audit_item_tags CASCADE;
