-- Add source column to feedback_general and feedback_tags tables
ALTER TABLE public.feedback_general ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.feedback_tags ADD COLUMN IF NOT EXISTS source TEXT;

-- Update the existing comments/documentation if needed
COMMENT ON COLUMN public.feedback_general.source IS 'The source or reference for the general feedback text.';
COMMENT ON COLUMN public.feedback_tags.source IS 'The source or reference for the tag feedback text.';
