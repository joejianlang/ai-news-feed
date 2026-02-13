-- ==========================================
-- 1. Enable Extensions
-- ==========================================
-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Function to check for similar news items
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
    (ni.original_url = check_url)
    OR
    (
      ni.created_at > NOW() - (time_window_hours || ' hours')::INTERVAL
      AND similarity(ni.title, check_title) > similarity_threshold
    )
  ORDER BY sim DESC
  LIMIT 1;
END;
$$;

-- ==========================================
-- 2. Base Tables (Initial Schema)
-- ==========================================
CREATE TABLE news_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('web', 'youtube', 'youtube_channel', 'rss')),
  fetch_interval INTEGER DEFAULT 3600,
  commentary_style TEXT DEFAULT 'professional',
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  youtube_channel_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE INDEX idx_news_items_source_id ON news_items(source_id);
CREATE INDEX idx_news_items_created_at ON news_items(created_at DESC);
CREATE INDEX idx_news_sources_is_active ON news_sources(is_active);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_news_sources_updated_at BEFORE UPDATE ON news_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_items_updated_at BEFORE UPDATE ON news_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on news_sources" ON news_sources FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on news_sources" ON news_sources FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on news_sources" ON news_sources FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on news_sources" ON news_sources FOR DELETE USING (true);

CREATE POLICY "Allow public read access on news_items" ON news_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on news_items" ON news_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on news_items" ON news_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on news_items" ON news_items FOR DELETE USING (true);

-- ==========================================
-- 3. Users and Categories (Crucial Dependencies)
-- ==========================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO categories (name, description) VALUES
  ('传统新闻媒体', 'BBC, ABC, CBC等传统新闻机构'),
  ('YouTube网红', 'YouTube频道和内容创作者'),
  ('网络专业媒体', '雅虎财经、科技新闻等网络媒体')
ON CONFLICT DO NOTHING;

ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_user_id ON user_follows(user_id);

-- ==========================================
-- 4. Updates to Base Tables (YouTube, etc)
-- ==========================================
ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS youtube_channel_id TEXT;
ALTER TABLE news_sources DROP CONSTRAINT IF EXISTS news_sources_source_type_check;
ALTER TABLE news_sources ADD CONSTRAINT news_sources_source_type_check 
CHECK (source_type IN ('web', 'youtube', 'youtube_channel', 'rss'));
CREATE INDEX IF NOT EXISTS idx_news_sources_youtube_channel_id ON news_sources(youtube_channel_id) WHERE youtube_channel_id IS NOT NULL;
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS video_id TEXT;
CREATE INDEX IF NOT EXISTS idx_news_items_video_id ON news_items(video_id) WHERE video_id IS NOT NULL;

-- ==========================================
-- 5. Comments System
-- ==========================================
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_item_id UUID NOT NULL REFERENCES news_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comments_news_item_id ON comments(news_item_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_policy" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_policy" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "comments_update_policy" ON comments FOR UPDATE USING (true);
CREATE POLICY "comments_delete_policy" ON comments FOR DELETE USING (true);
CREATE POLICY "comment_likes_select_policy" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "comment_likes_insert_policy" ON comment_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "comment_likes_delete_policy" ON comment_likes FOR DELETE USING (true);

ALTER TABLE news_items ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE news_items SET comment_count = comment_count + 1 WHERE id = NEW.news_item_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE news_items SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.news_item_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted != NEW.is_deleted THEN
    IF NEW.is_deleted THEN
      UPDATE news_items SET comment_count = GREATEST(0, comment_count - 1) WHERE id = NEW.news_item_id;
    ELSE
      UPDATE news_items SET comment_count = comment_count + 1 WHERE id = NEW.news_item_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE OR UPDATE OF is_deleted ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- ==========================================
-- 6. Batch and Publish Features
-- ==========================================
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS fetch_batch_id UUID;
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS batch_completed_at TIMESTAMPTZ;
UPDATE news_items SET is_published = true, batch_completed_at = created_at WHERE is_published IS NULL;
CREATE INDEX IF NOT EXISTS idx_news_items_batch_id ON news_items(fetch_batch_id);
CREATE INDEX IF NOT EXISTS idx_news_items_published ON news_items(is_published);
CREATE INDEX IF NOT EXISTS idx_news_items_batch_completed ON news_items(batch_completed_at DESC);

-- ==========================================
-- 7. Source Test Status
-- ==========================================
ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS test_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS test_result JSONB;
ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS tested_at TIMESTAMPTZ;
UPDATE news_sources SET test_status = 'passed' WHERE is_active = true AND test_status = 'pending';

-- ==========================================
-- 8. System Settings
-- ==========================================
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO system_settings (key, value) VALUES ('fetch_status', '{"is_running": false, "progress": 0, "total": 0}') ON CONFLICT (key) DO NOTHING;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update" ON system_settings FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 9. News Enhancements (Deep Dive, Categories)
-- ==========================================
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS deep_background TEXT;
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS deep_prediction TEXT;

INSERT INTO categories (name, description) VALUES
  ('本地', '本地新闻和社区资讯'),
  ('热点', '热门话题和趋势新闻'),
  ('政治', '政治新闻和时事评论'),
  ('科技', '科技创新和数码产品'),
  ('财经', '财经新闻和市场分析'),
  ('文化娱乐', '文化艺术和娱乐资讯'),
  ('体育', '体育赛事和运动新闻'),
  ('深度', '深度调查和专题报道')
ON CONFLICT DO NOTHING;

ALTER TABLE news_items ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_news_items_category_id ON news_items(category_id);

-- ==========================================
-- 10. Verification Codes
-- ==========================================
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_code ON verification_codes (email, code) WHERE used_at IS NULL;

-- ==========================================
-- 11. AI Config
-- ==========================================
CREATE TABLE IF NOT EXISTS ai_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_ai_config_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_config_updated_at BEFORE UPDATE ON ai_config FOR EACH ROW EXECUTE FUNCTION update_ai_config_updated_at();

INSERT INTO ai_config (config_key, config_value, description) VALUES
('filter_rules', '日程安排/节目表
活动预告/观赛指南/购票指南
周期性总结
纯粹的广告或促销内容
天气预报、体育比分列表', '内容过滤规则'),
('summary_requirements', '80-150字，概括核心内容、关键要素、影响，全部中文', '摘要生成要求'),
('commentary_requirements', '幽默犀利，有深度有趣味，全部使用中文简体', '评论生成要求'),
('commentary_length_article', '300-500字', '文章评论字数要求'),
('commentary_length_video', '150-250字，简洁精炼', '视频评论字数要求'),
('commentary_length_deep_dive', '800-1000字，请分为三个部分：【背景】、【分析】、【影响】', '深度分析评论字数要求'),
('classification_categories', '本地
热点
政治
科技
财经
文化娱乐
体育
深度', '新闻分类类别列表'),
('classification_rules', '1. **本地 (Local)**：加拿大城市...
2. **热点**：中文圈热点...
3. **深度**：结构性问题...', '分类优先级规则說明'),
('canadian_cities', 'Ontario: Toronto... BC: Vancouver...', '加拿大主要城市列表')
ON CONFLICT (config_key) DO NOTHING;

-- ==========================================
-- 12. Forum & Services
-- ==========================================
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE POLICY "Active posts are viewable by everyone" ON forum_posts FOR SELECT USING (status = 'active');
CREATE POLICY "Comments are viewable by everyone" ON forum_comments FOR SELECT USING (true);
CREATE POLICY "Likes are viewable by everyone" ON post_likes FOR SELECT USING (true);
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price TEXT,
  price_unit TEXT DEFAULT '月',
  location TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_wechat TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending')),
  view_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
INSERT INTO service_categories (name, name_en, icon, sort_order) VALUES
  ('房屋出租', 'Rent', 'Home', 1),
  ('维修服务', 'Repair', 'Wrench', 2),
  ('二手市场', 'Marketplace', 'ShoppingBag', 3),
  ('本地优惠', 'Deals', 'Tag', 4)
ON CONFLICT DO NOTHING;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services public read" ON services FOR SELECT USING (status = 'active');
CREATE POLICY "Service cats public read" ON service_categories FOR SELECT USING (true);

-- ==========================================
-- 13. Ads and Search Logs
-- ==========================================
CREATE TABLE IF NOT EXISTS ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    raw_content TEXT,
    image_url TEXT,
    link_url TEXT,
    contact_info TEXT,
    scope TEXT DEFAULT 'local',
    target_city TEXT,
    target_province TEXT,
    duration_days INTEGER DEFAULT 7,
    price_total DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
);
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active ads public read" ON ads FOR SELECT USING (status = 'active');

INSERT INTO system_settings (key, value) VALUES ('ad_pricing', '{"scope": {"local": 50, "city": 100, "province": 200, "national": 500}, "duration": {"1": 10, "3": 25, "7": 50, "14": 80, "30": 150}}') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  has_results BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert search logs" ON search_logs FOR INSERT TO public WITH CHECK (true);

-- ==========================================
-- 14. Latest Updates (Pinned items, etc)
-- ==========================================
ALTER TABLE news_sources DROP CONSTRAINT IF EXISTS news_sources_source_type_check;
ALTER TABLE news_sources ADD CONSTRAINT news_sources_source_type_check 
CHECK (source_type IN ('web', 'youtube', 'youtube_channel', 'rss', 'youtube_trending'));

ALTER TABLE IF EXISTS news_items ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_news_items_pinned ON news_items(is_pinned DESC);

CREATE TABLE IF NOT EXISTS recommended_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('rss', 'youtube_channel', 'web')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  youtube_channel_id VARCHAR(255),
  fetch_interval INTEGER DEFAULT 3600,
  commentary_style TEXT DEFAULT '专业分析',
  recommended_reason TEXT,
  popularity_score INTEGER,
  subscriber_count BIGINT,
  view_count BIGINT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));

