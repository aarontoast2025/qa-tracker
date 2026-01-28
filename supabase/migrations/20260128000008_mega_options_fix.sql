-- MEGA FIX: Create table, Cleanup Orphans, and Fix Constraints in correct order

-- 1. Create the form_item_options table first
CREATE TABLE IF NOT EXISTS public.form_item_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.form_items(id) ON DELETE CASCADE,
  label text NOT NULL,
  value text,
  is_default boolean DEFAULT false,
  is_correct boolean DEFAULT false,
  color text DEFAULT 'gray',
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT form_item_options_pkey PRIMARY KEY (id)
);

-- 2. Ensure updated_at trigger exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_form_item_options_modtime ON public.form_item_options;
CREATE TRIGGER update_form_item_options_modtime BEFORE UPDATE ON public.form_item_options FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3. Safely remove JSONB options column if it still exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_items' AND column_name='options') THEN
        ALTER TABLE public.form_items DROP COLUMN options;
    END IF;
END $$;

-- 4. CLEANUP: Remove old constraints and orphaned data
ALTER TABLE public.feedback_general DROP CONSTRAINT IF EXISTS feedback_general_option_id_fkey;
ALTER TABLE public.feedback_tags DROP CONSTRAINT IF EXISTS feedback_tags_option_id_fkey;

-- Delete feedback that doesn't point to a valid new option
DELETE FROM public.feedback_general 
WHERE option_id NOT IN (SELECT id FROM public.form_item_options);

DELETE FROM public.feedback_tags 
WHERE option_id NOT IN (SELECT id FROM public.form_item_options);

-- 5. Finalize connections
ALTER TABLE public.feedback_general 
  ADD CONSTRAINT feedback_general_option_id_fkey 
  FOREIGN KEY (option_id) REFERENCES public.form_item_options(id) ON DELETE CASCADE;

ALTER TABLE public.feedback_tags 
  ADD CONSTRAINT feedback_tags_option_id_fkey 
  FOREIGN KEY (option_id) REFERENCES public.form_item_options(id) ON DELETE CASCADE;
