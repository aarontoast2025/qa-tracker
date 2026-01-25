-- Create feedback_general table for user-specific general feedback templates
CREATE TABLE IF NOT EXISTS public.feedback_general (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  option_id UUID REFERENCES public.tracker_audit_item_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(option_id, user_id)
);

-- Create feedback_tags table for user-specific targeted feedback tags
CREATE TABLE IF NOT EXISTS public.feedback_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  option_id UUID REFERENCES public.tracker_audit_item_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_label TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feedback_general ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage their own general feedback" ON public.feedback_general;
CREATE POLICY "Users can manage their own general feedback" ON public.feedback_general
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own feedback tags" ON public.feedback_tags;
CREATE POLICY "Users can manage their own feedback tags" ON public.feedback_tags
  FOR ALL USING (auth.uid() = user_id);

-- Optional: Migrate existing feedback from options to the new table for the system/current user
-- This is tricky because we don't have a specific user here, so we skip it or assign to a default.
-- For now, we follow the user's request to NOT have it in options.

-- Triggers for updated_at
CREATE TRIGGER update_feedback_general_modtime BEFORE UPDATE ON public.feedback_general FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_feedback_tags_modtime BEFORE UPDATE ON public.feedback_tags FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
