-- Create audit_submissions table
CREATE TABLE IF NOT EXISTS public.audit_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID REFERENCES public.tracker_audit_forms(id) ON DELETE SET NULL,
    interaction_id TEXT,
    advocate_name TEXT,
    call_ani_dnis TEXT,
    interaction_date TIMESTAMPTZ,
    evaluation_date TIMESTAMPTZ DEFAULT NOW(),
    case_number TEXT,
    call_duration TEXT,
    case_category TEXT,
    issue_concern TEXT,
    page_url TEXT,
    submitted_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_submission_items table
CREATE TABLE IF NOT EXISTS public.audit_submission_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID REFERENCES public.audit_submissions(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.tracker_audit_items(id) ON DELETE SET NULL,
    answer_text TEXT,
    answer_id UUID REFERENCES public.tracker_audit_item_options(id) ON DELETE SET NULL,
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_submission_items ENABLE ROW LEVEL SECURITY;

-- Policies for audit_submissions
-- Allow authenticated users to insert their own submissions
CREATE POLICY "Users can insert their own submissions" ON public.audit_submissions
    FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- Allow users to view their own submissions (and potentially others based on permission, but keeping simple for now)
CREATE POLICY "Users can view their own submissions" ON public.audit_submissions
    FOR SELECT USING (auth.uid() = submitted_by);

-- Policies for audit_submission_items
-- Allow authenticated users to insert items for their own submissions
CREATE POLICY "Users can insert items for their own submissions" ON public.audit_submission_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.audit_submissions
            WHERE id = submission_id
            AND submitted_by = auth.uid()
        )
    );

CREATE POLICY "Users can view items for their own submissions" ON public.audit_submission_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.audit_submissions
            WHERE id = submission_id
            AND submitted_by = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_audit_submissions_modtime
    BEFORE UPDATE ON public.audit_submissions
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
