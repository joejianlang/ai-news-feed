-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Function to check for similar news items
-- Returns true if a similar item exists within the time window
CREATE OR REPLACE FUNCTION find_similar_news(
  check_title TEXT,
  check_url TEXT,
  time_window_hours INT DEFAULT 24,
  similarity_threshold FLOAT DEFAULT 0.6
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  similarity FLOAT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ni.id,
    ni.title,
    similarity(ni.title, check_title) as sim
  FROM news_items ni
  WHERE 
    (
      -- Condition 1: URL matches exactly (already handled by existing logic, but good as backup)
      ni.original_url = check_url
    )
    OR
    (
      -- Condition 2: Published recently AND title is similar
      ni.created_at > NOW() - (time_window_hours || ' hours')::INTERVAL
      AND similarity(ni.title, check_title) > similarity_threshold
    )
  ORDER BY sim DESC
  LIMIT 1;
END;
$$;

-- Create index for faster fuzzy search
CREATE INDEX IF NOT EXISTS idx_news_items_title_trgm ON news_items USING gin (title gin_trgm_ops);
