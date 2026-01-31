-- Add source column to knowledge_base_pages
ALTER TABLE public.knowledge_base_pages ADD COLUMN IF NOT EXISTS source TEXT;

COMMENT ON COLUMN public.knowledge_base_pages.source IS 'The source reference URL or text for the knowledge base page.';
