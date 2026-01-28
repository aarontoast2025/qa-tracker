-- Remove required column from form_items as all items are now mandatory
ALTER TABLE public.form_items DROP COLUMN IF EXISTS required;
