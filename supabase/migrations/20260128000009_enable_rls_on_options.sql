-- Enable RLS on form_item_options
ALTER TABLE public.form_item_options ENABLE ROW LEVEL SECURITY;

-- 1. Policy for Authenticated users to manage options of their own forms
-- This allows creators to INSERT, UPDATE, DELETE, and SELECT their own form options.
DROP POLICY IF EXISTS "Users can manage options of their own forms" ON public.form_item_options;
CREATE POLICY "Users can manage options of their own forms" ON public.form_item_options
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.form_items
      JOIN public.form_sections ON form_sections.id = public.form_items.section_id
      JOIN public.form_templates ON form_templates.id = form_sections.form_id
      WHERE public.form_items.id = public.form_item_options.item_id
      AND form_templates.created_by = auth.uid()
    )
  );

-- 2. Policy for Public (anon) to view options of active forms
-- This is required for the public bookmarklet/embed functionality.
DROP POLICY IF EXISTS "Public can view options" ON public.form_item_options;
CREATE POLICY "Public can view options" ON public.form_item_options
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM public.form_items
      JOIN public.form_sections ON form_sections.id = public.form_items.section_id
      JOIN public.form_templates ON form_templates.id = form_sections.form_id
      WHERE public.form_items.id = public.form_item_options.item_id
      AND form_templates.status = 'active'
    )
  );
