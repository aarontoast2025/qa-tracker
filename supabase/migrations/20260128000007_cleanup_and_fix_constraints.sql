-- 1. Remove the problematic constraints first (to be safe)
ALTER TABLE public.feedback_general DROP CONSTRAINT IF EXISTS feedback_general_option_id_fkey;
ALTER TABLE public.feedback_tags DROP CONSTRAINT IF EXISTS feedback_tags_option_id_fkey;

-- 2. Delete any feedback records that refer to IDs not present in the NEW form_item_options table
-- This is necessary because your feedback table contains old data that doesn't exist in the new system.
DELETE FROM public.feedback_general 
WHERE option_id NOT IN (SELECT id FROM public.form_item_options);

DELETE FROM public.feedback_tags 
WHERE option_id NOT IN (SELECT id FROM public.form_item_options);

-- 3. Now safely add the foreign key constraints pointing to the NEW table
ALTER TABLE public.feedback_general 
  ADD CONSTRAINT feedback_general_option_id_fkey 
  FOREIGN KEY (option_id) REFERENCES public.form_item_options(id) ON DELETE CASCADE;

ALTER TABLE public.feedback_tags 
  ADD CONSTRAINT feedback_tags_option_id_fkey 
  FOREIGN KEY (option_id) REFERENCES public.form_item_options(id) ON DELETE CASCADE;
