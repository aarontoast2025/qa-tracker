-- 1. Create permissions for Audit
INSERT INTO public.user_permissions (code, name, description, group_name)
VALUES 
  ('audit.view', 'View Audit', 'Ability to view the audit module', 'Audit Management'),
  ('form.view', 'View Form', 'Ability to view audit forms', 'Audit Management'),
  ('form.add', 'Add Form', 'Ability to create new audit forms', 'Audit Management'),
  ('form.update', 'Update Form', 'Ability to update audit forms', 'Audit Management'),
  ('form.delete', 'Delete Form', 'Ability to delete audit forms', 'Audit Management'),
  ('form.archive', 'Archive Form', 'Ability to archive audit forms', 'Audit Management')
ON CONFLICT (code) DO NOTHING;

-- 2. Create tracker_audit_forms table
CREATE TABLE IF NOT EXISTS public.tracker_audit_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create tracker_audit_groups table
CREATE TABLE IF NOT EXISTS public.tracker_audit_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES public.tracker_audit_forms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create tracker_audit_items table
CREATE TABLE IF NOT EXISTS public.tracker_audit_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.tracker_audit_groups(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  short_name TEXT,
  item_type TEXT NOT NULL DEFAULT 'toggle_yes_no' CHECK (item_type IN ('toggle_yes_no', 'toggle_custom', 'dropdown_custom')),
  is_required BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create tracker_audit_item_options table
CREATE TABLE IF NOT EXISTS public.tracker_audit_item_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.tracker_audit_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT, 
  is_default BOOLEAN DEFAULT FALSE,
  is_correct BOOLEAN DEFAULT TRUE, 
  color TEXT, 
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable RLS
ALTER TABLE public.tracker_audit_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_audit_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_audit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_audit_item_options ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies (Idempotent)
DROP POLICY IF EXISTS "Users with form.view can view forms" ON public.tracker_audit_forms;
CREATE POLICY "Users with form.view can view forms" ON public.tracker_audit_forms FOR SELECT USING (has_permission('form.view'));
DROP POLICY IF EXISTS "Users with form.add can insert forms" ON public.tracker_audit_forms;
CREATE POLICY "Users with form.add can insert forms" ON public.tracker_audit_forms FOR INSERT WITH CHECK (has_permission('form.add'));
DROP POLICY IF EXISTS "Users with form.update can update forms" ON public.tracker_audit_forms;
CREATE POLICY "Users with form.update can update forms" ON public.tracker_audit_forms FOR UPDATE USING (has_permission('form.update'));
DROP POLICY IF EXISTS "Users with form.delete can delete forms" ON public.tracker_audit_forms;
CREATE POLICY "Users with form.delete can delete forms" ON public.tracker_audit_forms FOR DELETE USING (has_permission('form.delete'));

DROP POLICY IF EXISTS "Users with form.view can view groups" ON public.tracker_audit_groups;
CREATE POLICY "Users with form.view can view groups" ON public.tracker_audit_groups FOR SELECT USING (has_permission('form.view'));
DROP POLICY IF EXISTS "Users with form.update can insert groups" ON public.tracker_audit_groups;
CREATE POLICY "Users with form.update can insert groups" ON public.tracker_audit_groups FOR INSERT WITH CHECK (has_permission('form.update'));
DROP POLICY IF EXISTS "Users with form.update can update groups" ON public.tracker_audit_groups;
CREATE POLICY "Users with form.update can update groups" ON public.tracker_audit_groups FOR UPDATE USING (has_permission('form.update'));
DROP POLICY IF EXISTS "Users with form.update can delete groups" ON public.tracker_audit_groups;
CREATE POLICY "Users with form.update can delete groups" ON public.tracker_audit_groups FOR DELETE USING (has_permission('form.update'));

DROP POLICY IF EXISTS "Users with form.view can view items" ON public.tracker_audit_items;
CREATE POLICY "Users with form.view can view items" ON public.tracker_audit_items FOR SELECT USING (has_permission('form.view'));
DROP POLICY IF EXISTS "Users with form.update can insert items" ON public.tracker_audit_items;
CREATE POLICY "Users with form.update can insert items" ON public.tracker_audit_items FOR INSERT WITH CHECK (has_permission('form.update'));
DROP POLICY IF EXISTS "Users with form.update can update items" ON public.tracker_audit_items;
CREATE POLICY "Users with form.update can update items" ON public.tracker_audit_items FOR UPDATE USING (has_permission('form.update'));
DROP POLICY IF EXISTS "Users with form.update can delete items" ON public.tracker_audit_items;
CREATE POLICY "Users with form.update can delete items" ON public.tracker_audit_items FOR DELETE USING (has_permission('form.update'));

DROP POLICY IF EXISTS "Users with form.view can view options" ON public.tracker_audit_item_options;
CREATE POLICY "Users with form.view can view options" ON public.tracker_audit_item_options FOR SELECT USING (has_permission('form.view'));
DROP POLICY IF EXISTS "Users with form.update can insert options" ON public.tracker_audit_item_options;
CREATE POLICY "Users with form.update can insert options" ON public.tracker_audit_item_options FOR INSERT WITH CHECK (has_permission('form.update'));
DROP POLICY IF EXISTS "Users with form.update can update options" ON public.tracker_audit_item_options;
CREATE POLICY "Users with form.update can update options" ON public.tracker_audit_item_options FOR UPDATE USING (has_permission('form.update'));
DROP POLICY IF EXISTS "Users with form.update can delete options" ON public.tracker_audit_item_options;
CREATE POLICY "Users with form.update can delete options" ON public.tracker_audit_item_options FOR DELETE USING (has_permission('form.update'));

-- 8. Triggers
DROP TRIGGER IF EXISTS update_tracker_audit_forms_modtime ON public.tracker_audit_forms;
CREATE TRIGGER update_tracker_audit_forms_modtime BEFORE UPDATE ON public.tracker_audit_forms FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_tracker_audit_groups_modtime ON public.tracker_audit_groups;
CREATE TRIGGER update_tracker_audit_groups_modtime BEFORE UPDATE ON public.tracker_audit_groups FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_tracker_audit_items_modtime ON public.tracker_audit_items;
CREATE TRIGGER update_tracker_audit_items_modtime BEFORE UPDATE ON public.tracker_audit_items FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_tracker_audit_item_options_modtime ON public.tracker_audit_item_options;
CREATE TRIGGER update_tracker_audit_item_options_modtime BEFORE UPDATE ON public.tracker_audit_item_options FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
