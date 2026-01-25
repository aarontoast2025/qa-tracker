-- 1. Add feedback_text to tracker_audit_item_options
ALTER TABLE public.tracker_audit_item_options 
ADD COLUMN IF NOT EXISTS feedback_text TEXT;

-- 2. Create tracker_audit_item_tags table for targeted feedback
CREATE TABLE IF NOT EXISTS public.tracker_audit_item_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  option_id UUID REFERENCES public.tracker_audit_item_options(id) ON DELETE CASCADE,
  tag_label TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add permissions for feedback management
INSERT INTO public.user_permissions (code, name, description, group_name)
VALUES 
  ('feedback.manage', 'Manage Feedback Templates', 'Ability to create and edit feedback templates for audit forms', 'Audit Management')
ON CONFLICT (code) DO NOTHING;

-- 4. Enable RLS
ALTER TABLE public.tracker_audit_item_tags ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Users with form.view can view tags" ON public.tracker_audit_item_tags;
CREATE POLICY "Users with form.view can view tags" ON public.tracker_audit_item_tags FOR SELECT USING (has_permission('form.view'));

DROP POLICY IF EXISTS "Users with feedback.manage can manage tags" ON public.tracker_audit_item_tags;
CREATE POLICY "Users with feedback.manage can manage tags" ON public.tracker_audit_item_tags FOR ALL USING (has_permission('feedback.manage'));

-- 6. Trigger for modified column
DROP TRIGGER IF EXISTS update_tracker_audit_item_tags_modtime ON public.tracker_audit_item_tags;
CREATE TRIGGER update_tracker_audit_item_tags_modtime BEFORE UPDATE ON public.tracker_audit_item_tags FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
