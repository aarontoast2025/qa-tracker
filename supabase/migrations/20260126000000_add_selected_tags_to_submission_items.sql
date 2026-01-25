ALTER TABLE public.audit_submission_items 
ADD COLUMN selected_tags UUID[] DEFAULT '{}';
