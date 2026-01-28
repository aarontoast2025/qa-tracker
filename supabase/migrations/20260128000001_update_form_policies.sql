-- Enable public read access for forms, sections, and items (for embed/bookmarklet)

-- Form Templates
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.form_templates;

CREATE POLICY "Authenticated users can manage forms" ON public.form_templates
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Public can view active forms" ON public.form_templates
  FOR SELECT TO anon USING (status = 'active');


-- Form Sections
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.form_sections;

CREATE POLICY "Authenticated users can manage sections" ON public.form_sections
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Public can view sections" ON public.form_sections
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM public.form_templates
      WHERE form_templates.id = form_sections.form_id
      AND form_templates.status = 'active'
    )
  );


-- Form Items
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.form_items;

CREATE POLICY "Authenticated users can manage items" ON public.form_items
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Public can view items" ON public.form_items
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM public.form_sections
      JOIN public.form_templates ON form_templates.id = form_sections.form_id
      WHERE form_sections.id = form_items.section_id
      AND form_templates.status = 'active'
    )
  );
