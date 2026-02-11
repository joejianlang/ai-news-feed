-- Update the check constraint for news_sources.source_type
ALTER TABLE news_sources DROP CONSTRAINT IF EXISTS news_sources_source_type_check;

ALTER TABLE news_sources ADD CONSTRAINT news_sources_source_type_check 
CHECK (source_type IN ('web', 'youtube', 'youtube_channel', 'rss', 'youtube_trending'));
