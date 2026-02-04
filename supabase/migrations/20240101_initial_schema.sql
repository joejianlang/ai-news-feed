-- 创建新闻源配置表
CREATE TABLE news_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('web', 'youtube', 'youtube_channel', 'rss')),
  fetch_interval INTEGER DEFAULT 3600, -- 抓取间隔（秒）
  commentary_style TEXT DEFAULT 'professional', -- 评论风格
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  youtube_channel_id TEXT, -- YouTube 频道 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建新闻条目表
CREATE TABLE news_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES news_sources(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  content_type TEXT CHECK (content_type IN ('article', 'video')),
  ai_summary TEXT,
  ai_commentary TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提升查询性能
CREATE INDEX idx_news_items_source_id ON news_items(source_id);
CREATE INDEX idx_news_items_created_at ON news_items(created_at DESC);
CREATE INDEX idx_news_sources_is_active ON news_sources(is_active);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为两个表添加更新时间触发器
CREATE TRIGGER update_news_sources_updated_at BEFORE UPDATE ON news_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_items_updated_at BEFORE UPDATE ON news_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略（RLS）
ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

-- 创建公开访问策略（如果需要认证，可以修改这些策略）
CREATE POLICY "Allow public read access on news_sources"
  ON news_sources FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on news_sources"
  ON news_sources FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on news_sources"
  ON news_sources FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access on news_sources"
  ON news_sources FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access on news_items"
  ON news_items FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on news_items"
  ON news_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on news_items"
  ON news_items FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access on news_items"
  ON news_items FOR DELETE
  USING (true);
