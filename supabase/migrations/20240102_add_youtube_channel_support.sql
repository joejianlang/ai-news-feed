-- 添加 YouTube 频道支持
-- 如果你已经运行了初始的 schema，运行这个迁移文件来更新

-- 1. 添加 youtube_channel_id 字段
ALTER TABLE news_sources
ADD COLUMN IF NOT EXISTS youtube_channel_id TEXT;

-- 2. 更新 source_type 检查约束以包含 youtube_channel
ALTER TABLE news_sources
DROP CONSTRAINT IF EXISTS news_sources_source_type_check;

ALTER TABLE news_sources
ADD CONSTRAINT news_sources_source_type_check
CHECK (source_type IN ('web', 'youtube', 'youtube_channel', 'rss'));

-- 3. 为 YouTube 频道 ID 创建索引
CREATE INDEX IF NOT EXISTS idx_news_sources_youtube_channel_id
ON news_sources(youtube_channel_id)
WHERE youtube_channel_id IS NOT NULL;

-- 4. 添加视频 ID 字段到 news_items（用于存储 YouTube 视频 ID）
ALTER TABLE news_items
ADD COLUMN IF NOT EXISTS video_id TEXT;

CREATE INDEX IF NOT EXISTS idx_news_items_video_id
ON news_items(video_id)
WHERE video_id IS NOT NULL;
