-- Add author_name column to news_items table
ALTER TABLE public.news_items 
ADD COLUMN IF NOT EXISTS author_name TEXT;

COMMENT ON COLUMN public.news_items.author_name IS 'Custom author name for original articles, displayed instead of source name';
