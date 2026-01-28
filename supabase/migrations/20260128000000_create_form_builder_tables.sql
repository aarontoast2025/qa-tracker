-- Create form_templates table
CREATE TABLE IF NOT EXISTS public.form_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT form_templates_pkey PRIMARY KEY (id)
);

-- Create form_sections table (replaces groups)
CREATE TABLE IF NOT EXISTS public.form_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT form_sections_pkey PRIMARY KEY (id)
);

-- Create form_items table (replaces items + options)
CREATE TABLE IF NOT EXISTS public.form_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.form_sections(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'text',
  label text NOT NULL,
  help_text text,
  required boolean DEFAULT false,
  order_index integer DEFAULT 0,
  options jsonb DEFAULT '[]'::jsonb, -- Stores options for select/radio/checkbox
  validation_rules jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT form_items_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all access for authenticated users" ON public.form_templates FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.form_sections FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.form_items FOR ALL TO authenticated USING (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_form_templates_modtime ON public.form_templates;
CREATE TRIGGER update_form_templates_modtime BEFORE UPDATE ON public.form_templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_sections_modtime ON public.form_sections;
CREATE TRIGGER update_form_sections_modtime BEFORE UPDATE ON public.form_sections FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_items_modtime ON public.form_items;
CREATE TRIGGER update_form_items_modtime BEFORE UPDATE ON public.form_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
