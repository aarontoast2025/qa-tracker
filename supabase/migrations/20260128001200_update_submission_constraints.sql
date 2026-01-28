-- Update foreign key constraints for audit_submissions and audit_submission_items
-- to point to the new form builder tables

-- 1. Update audit_submissions -> form_templates
ALTER TABLE public.audit_submissions DROP CONSTRAINT IF EXISTS audit_submissions_form_id_fkey;
ALTER TABLE public.audit_submissions 
  ADD CONSTRAINT audit_submissions_form_id_fkey 
  FOREIGN KEY (form_id) REFERENCES public.form_templates(id) ON DELETE SET NULL;

-- 2. Update audit_submission_items -> form_items
ALTER TABLE public.audit_submission_items DROP CONSTRAINT IF EXISTS audit_submission_items_item_id_fkey;
ALTER TABLE public.audit_submission_items 
  ADD CONSTRAINT audit_submission_items_item_id_fkey 
  FOREIGN KEY (item_id) REFERENCES public.form_items(id) ON DELETE SET NULL;

-- 3. Update audit_submission_items -> form_item_options
ALTER TABLE public.audit_submission_items DROP CONSTRAINT IF EXISTS audit_submission_items_answer_id_fkey;
ALTER TABLE public.audit_submission_items 
  ADD CONSTRAINT audit_submission_items_answer_id_fkey 
  FOREIGN KEY (answer_id) REFERENCES public.form_item_options(id) ON DELETE SET NULL;
