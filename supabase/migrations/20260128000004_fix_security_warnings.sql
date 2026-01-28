-- 1. Fix Function Search Path Mutable warning
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 2. Fix Overly Permissive RLS Policies

-- Form Templates
DROP POLICY IF EXISTS "Authenticated users can manage forms" ON public.form_templates;
CREATE POLICY "Users can manage their own forms" ON public.form_templates
  FOR ALL TO authenticated 
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Form Sections
DROP POLICY IF EXISTS "Authenticated users can manage sections" ON public.form_sections;
CREATE POLICY "Users can manage sections of their own forms" ON public.form_sections
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.form_templates
      WHERE form_templates.id = public.form_sections.form_id
      AND form_templates.created_by = auth.uid()
    )
  );

-- Form Items
DROP POLICY IF EXISTS "Authenticated users can manage items" ON public.form_items;
CREATE POLICY "Users can manage items of their own forms" ON public.form_items
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.form_sections
      JOIN public.form_templates ON form_templates.id = public.form_sections.form_id
      WHERE public.form_sections.id = public.form_items.section_id
      AND form_templates.created_by = auth.uid()
    )
  );

-- Ensure public SELECT policies remain (previously added)
-- These allow 'anon' to read but NOT modify.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active forms') THEN
        CREATE POLICY "Public can view active forms" ON public.form_templates FOR SELECT TO anon USING (status = 'active');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view sections') THEN
        CREATE POLICY "Public can view sections" ON public.form_sections FOR SELECT TO anon USING (
            EXISTS (
                SELECT 1 FROM public.form_templates
                WHERE form_templates.id = form_sections.form_id
                AND form_templates.status = 'active'
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view items') THEN
        CREATE POLICY "Public can view items" ON public.form_items FOR SELECT TO anon USING (
            EXISTS (
                SELECT 1 FROM public.form_sections
                JOIN public.form_templates ON form_templates.id = form_sections.form_id
                WHERE form_sections.id = form_items.section_id
                AND form_templates.status = 'active'
            )
        );
    END IF;
END $$;
