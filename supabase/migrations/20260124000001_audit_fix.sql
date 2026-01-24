-- FIX: Add missing columns and update constraints for existing audit tables

-- 1. Add short_name column to tracker_audit_items
ALTER TABLE public.tracker_audit_items 
ADD COLUMN IF NOT EXISTS short_name TEXT;

-- 2. Update the item_type check constraint
-- First, remove the old one if it exists
ALTER TABLE public.tracker_audit_items 
DROP CONSTRAINT IF EXISTS tracker_audit_items_item_type_check;

-- Add the new constraint with supported types
ALTER TABLE public.tracker_audit_items 
ADD CONSTRAINT tracker_audit_items_item_type_check 
CHECK (item_type IN ('toggle_yes_no', 'toggle_custom', 'dropdown_custom'));

-- 3. Update the default value for the item_type column
ALTER TABLE public.tracker_audit_items 
ALTER COLUMN item_type SET DEFAULT 'toggle_yes_no';

-- 4. Ensure any existing data that might have old types is migrated (Optional)
-- UPDATE public.tracker_audit_items SET item_type = 'dropdown_custom' WHERE item_type = 'select';
-- UPDATE public.tracker_audit_items SET item_type = 'toggle_yes_no' WHERE item_type = 'toggle';
