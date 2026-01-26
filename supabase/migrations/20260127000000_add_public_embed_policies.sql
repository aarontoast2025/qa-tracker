-- Add public read access for embed forms
-- This allows the bookmarklet to work without authentication
-- while still protecting write operations

-- Public read policy for forms
DROP POLICY IF EXISTS "Public can view active forms for embed" ON public.tracker_audit_forms;
CREATE POLICY "Public can view active forms for embed" 
ON public.tracker_audit_forms 
FOR SELECT 
USING (status = 'active');

-- Public read policy for groups
DROP POLICY IF EXISTS "Public can view groups for embed" ON public.tracker_audit_groups;
CREATE POLICY "Public can view groups for embed" 
ON public.tracker_audit_groups 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tracker_audit_forms 
    WHERE id = tracker_audit_groups.form_id 
    AND status = 'active'
  )
);

-- Public read policy for items
DROP POLICY IF EXISTS "Public can view items for embed" ON public.tracker_audit_items;
CREATE POLICY "Public can view items for embed" 
ON public.tracker_audit_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tracker_audit_groups g
    JOIN public.tracker_audit_forms f ON f.id = g.form_id
    WHERE g.id = tracker_audit_items.group_id 
    AND f.status = 'active'
  )
);

-- Public read policy for options
DROP POLICY IF EXISTS "Public can view options for embed" ON public.tracker_audit_item_options;
CREATE POLICY "Public can view options for embed" 
ON public.tracker_audit_item_options 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tracker_audit_items i
    JOIN public.tracker_audit_groups g ON g.id = i.group_id
    JOIN public.tracker_audit_forms f ON f.id = g.form_id
    WHERE i.id = tracker_audit_item_options.item_id 
    AND f.status = 'active'
  )
);

-- Public read policy for general feedback
DROP POLICY IF EXISTS "Public can view general feedback for embed" ON public.feedback_general;
CREATE POLICY "Public can view general feedback for embed" 
ON public.feedback_general 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tracker_audit_item_options o
    JOIN public.tracker_audit_items i ON i.id = o.item_id
    JOIN public.tracker_audit_groups g ON g.id = i.group_id
    JOIN public.tracker_audit_forms f ON f.id = g.form_id
    WHERE o.id = feedback_general.option_id 
    AND f.status = 'active'
  )
);

-- Public read policy for feedback tags
DROP POLICY IF EXISTS "Public can view feedback tags for embed" ON public.feedback_tags;
CREATE POLICY "Public can view feedback tags for embed" 
ON public.feedback_tags 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tracker_audit_item_options o
    JOIN public.tracker_audit_items i ON i.id = o.item_id
    JOIN public.tracker_audit_groups g ON g.id = i.group_id
    JOIN public.tracker_audit_forms f ON f.id = g.form_id
    WHERE o.id = feedback_tags.option_id 
    AND f.status = 'active'
  )
);

-- Note: The existing permission-based policies remain in place
-- This creates a permissive OR condition where either:
-- 1. User has form.view permission (authenticated), OR
-- 2. Form is active (public embed access)
-- 
-- Security: Only 'active' forms are publicly accessible
-- Draft and archived forms remain protected and require authentication
