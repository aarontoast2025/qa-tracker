-- Fix public read policies for feedback tables to use the new form builder schema
-- This allows the bookmarklet to fetch feedback templates for active forms

-- Fix feedback_general public access
DROP POLICY IF EXISTS "Public can view general feedback for embed" ON public.feedback_general;
CREATE POLICY "Public can view general feedback for embed" 
ON public.feedback_general 
FOR SELECT 
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.form_item_options o
    JOIN public.form_items i ON i.id = o.item_id
    JOIN public.form_sections s ON s.id = i.section_id
    JOIN public.form_templates t ON t.id = s.form_id
    WHERE o.id = feedback_general.option_id 
    AND t.status = 'active'
  )
);

-- Fix feedback_tags public access
DROP POLICY IF EXISTS "Public can view feedback tags for embed" ON public.feedback_tags;
CREATE POLICY "Public can view feedback tags for embed" 
ON public.feedback_tags 
FOR SELECT 
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.form_item_options o
    JOIN public.form_items i ON i.id = o.item_id
    JOIN public.form_sections s ON s.id = i.section_id
    JOIN public.form_templates t ON t.id = s.form_id
    WHERE o.id = feedback_tags.option_id 
    AND t.status = 'active'
  )
);

-- Ensure authenticated users can still see feedback for forms they can view
-- (Existing policies might already cover this via user_id, but this ensures broader access for team members)
DROP POLICY IF EXISTS "Authenticated users can view feedback" ON public.feedback_general;
CREATE POLICY "Authenticated users can view feedback" 
ON public.feedback_general 
FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can view tags" ON public.feedback_tags;
CREATE POLICY "Authenticated users can view tags" 
ON public.feedback_tags 
FOR SELECT 
TO authenticated 
USING (true);
