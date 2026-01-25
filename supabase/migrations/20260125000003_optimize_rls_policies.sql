-- Optimize RLS policies for feedback_general
DROP POLICY IF EXISTS "Users can manage their own general feedback" ON public.feedback_general;
CREATE POLICY "Users can manage their own general feedback" ON public.feedback_general
  FOR ALL USING ((select auth.uid()) = user_id);

-- Optimize RLS policies for feedback_tags
DROP POLICY IF EXISTS "Users can manage their own feedback tags" ON public.feedback_tags;
CREATE POLICY "Users can manage their own feedback tags" ON public.feedback_tags
  FOR ALL USING ((select auth.uid()) = user_id);
