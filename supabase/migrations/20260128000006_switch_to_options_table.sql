-- 1. Create the form_item_options table
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

-- 2. Trigger for updated_at
DROP TRIGGER IF EXISTS update_form_item_options_modtime ON public.form_item_options;
CREATE TRIGGER update_form_item_options_modtime BEFORE UPDATE ON public.form_item_options FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3. Remove the JSONB options column from form_items
ALTER TABLE public.form_items DROP COLUMN IF EXISTS options;

-- 4. Update Feedback tables to point to the NEW options table
-- First remove the old constraints (some might have been dropped in previous steps)
ALTER TABLE public.feedback_general DROP CONSTRAINT IF EXISTS feedback_general_option_id_fkey;
ALTER TABLE public.feedback_tags DROP CONSTRAINT IF EXISTS feedback_tags_option_id_fkey;

-- Add new foreign keys pointing to form_item_options
ALTER TABLE public.feedback_general 
  ADD CONSTRAINT feedback_general_option_id_fkey 
  FOREIGN KEY (option_id) REFERENCES public.form_item_options(id) ON DELETE CASCADE;

ALTER TABLE public.feedback_tags 
  ADD CONSTRAINT feedback_tags_option_id_fkey 
  FOREIGN KEY (option_id) REFERENCES public.form_item_options(id) ON DELETE CASCADE;
