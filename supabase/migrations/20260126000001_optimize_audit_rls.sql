-- Optimize and Expand RLS policies for audit_submissions
DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.audit_submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.audit_submissions;
DROP POLICY IF EXISTS "Users can manage their own submissions" ON public.audit_submissions;

CREATE POLICY "Users can manage their own submissions" ON public.audit_submissions
    FOR ALL USING ((select auth.uid()) = submitted_by)
    WITH CHECK ((select auth.uid()) = submitted_by);

-- Optimize and Expand RLS policies for audit_submission_items
DROP POLICY IF EXISTS "Users can insert items for their own submissions" ON public.audit_submission_items;
DROP POLICY IF EXISTS "Users can view items for their own submissions" ON public.audit_submission_items;
DROP POLICY IF EXISTS "Users can manage items for their own submissions" ON public.audit_submission_items;

CREATE POLICY "Users can manage items for their own submissions" ON public.audit_submission_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.audit_submissions
            WHERE id = submission_id
            AND submitted_by = (select auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.audit_submissions
            WHERE id = submission_id
            AND submitted_by = (select auth.uid())
        )
    );

-- Optimize RLS policies for feedback_general
DROP POLICY IF EXISTS "Users can manage their own general feedback" ON public.feedback_general;
CREATE POLICY "Users can manage their own general feedback" ON public.feedback_general
  FOR ALL USING ((select auth.uid()) = user_id);

-- Optimize RLS policies for feedback_tags
DROP POLICY IF EXISTS "Users can manage their own feedback tags" ON public.feedback_tags;
CREATE POLICY "Users can manage their own feedback tags" ON public.feedback_tags
  FOR ALL USING ((select auth.uid()) = user_id);