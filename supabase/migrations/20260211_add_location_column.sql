-- Add missing location column to news_items
ALTER TABLE IF EXISTS news_items ADD COLUMN IF NOT EXISTS location TEXT;

-- Verify if PostgREST cache can be reloaded (usually automatic in Supabase, but sometimes needs a ping)
NOTIFY pgrst, 'reload schema';
