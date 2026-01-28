-- Remove foreign keys that point to the old tracker_audit_item_options table
-- so we can use option_id to point to the IDs in our new JSONB options

ALTER TABLE public.feedback_general DROP CONSTRAINT IF EXISTS feedback_general_option_id_fkey;
ALTER TABLE public.feedback_tags DROP CONSTRAINT IF EXISTS feedback_tags_option_id_fkey;

-- We keep the columns as UUID. They will now match the 'id' field inside form_items.options JSONB.
