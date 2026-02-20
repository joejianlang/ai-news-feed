-- ============================================================================
-- 数位 Buffet -> 优服佳：业务数据迁移脚本 (UNIQUE 约束修复版)
-- 说明：此脚本会先清理 potential duplicates，确保 categories.name 唯一，然后加上 UNIQUE 约束。
-- ============================================================================

-- 0. 基础环境
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. 新闻分类 (安全处理：清理重复 -> 添加约束 -> 插入数据)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- [关键修复]：清理重复的分类名 (如有)，保留最新的一个
DELETE FROM categories a USING categories b
WHERE a.id < b.id AND a.name = b.name;

-- [关键修复]：确保 name 字段有唯一约束
DO $category_migration$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_name_key') THEN
        ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE (name);
    END IF;
END $category_migration$ LANGUAGE plpgsql;

-- 现在可以安全地使用 ON CONFLICT 了
INSERT INTO categories (name, description) VALUES
  ('本地', '本地新闻和社区资讯'),
  ('热点', '热门话题和趋势新闻'),
  ('科技', '科技创新和数码产品'),
  ('财经', '财经新闻和市场分析'),
  ('文化娱乐', '文化艺术和娱乐资讯'),
  ('体育', '体育赛事和运动新闻'),
  ('深度', '深度调查和专题报道')
ON CONFLICT (name) DO NOTHING;

-- 2. 新闻业务表
CREATE TABLE IF NOT EXISTS news_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('web', 'youtube', 'youtube_channel', 'rss', 'youtube_trending')),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    fetch_interval INTEGER DEFAULT 3600,
    is_active BOOLEAN DEFAULT true,
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    youtube_channel_id TEXT,
    commentary_style TEXT,
    test_status TEXT,
    test_result JSONB,
    tested_at TIMESTAMP WITH TIME ZONE,
    description TEXT,
    language TEXT,
    country TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 移除 source_type 的检查约束 (兼容旧数据)
ALTER TABLE news_sources DROP CONSTRAINT IF EXISTS news_sources_source_type_check;

CREATE TABLE IF NOT EXISTS news_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id UUID REFERENCES news_sources(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    original_url TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    content_type TEXT CHECK (content_type IN ('article', 'video')),
    ai_summary TEXT,
    ai_commentary TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT true,
    video_id TEXT,
    image_url TEXT,
    fetch_batch_id UUID,
    tags TEXT[] DEFAULT '{}',
    location TEXT,
    comment_count INT DEFAULT 0,
    is_hot BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    author_name TEXT,
    batch_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 用户关注
CREATE TABLE IF NOT EXISTS user_source_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, source_id)
);

-- 4. 服务数据
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL, 
    title TEXT NOT NULL,
    description TEXT,
    price TEXT,
    price_unit TEXT DEFAULT '元',
    location TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending')),
    view_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $news_migration$
BEGIN
    -- 5.1 news_sources 表补全
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_sources' AND column_name = 'test_status') THEN
        ALTER TABLE news_sources ADD COLUMN test_status TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_sources' AND column_name = 'test_result') THEN
        ALTER TABLE news_sources ADD COLUMN test_result JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_sources' AND column_name = 'tested_at') THEN
        ALTER TABLE news_sources ADD COLUMN tested_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_sources' AND column_name = 'commentary_style') THEN
        ALTER TABLE news_sources ADD COLUMN commentary_style TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_sources' AND column_name = 'description') THEN
        ALTER TABLE news_sources ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_sources' AND column_name = 'language') THEN
        ALTER TABLE news_sources ADD COLUMN language TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_sources' AND column_name = 'country') THEN
        ALTER TABLE news_sources ADD COLUMN country TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_sources' AND column_name = 'logo_url') THEN
        ALTER TABLE news_sources ADD COLUMN logo_url TEXT;
    END IF;

    -- 5.2 news_items 表补全
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_items' AND column_name = 'video_id') THEN
        ALTER TABLE news_items ADD COLUMN video_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_items' AND column_name = 'image_url') THEN
        ALTER TABLE news_items ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_items' AND column_name = 'fetch_batch_id') THEN
        ALTER TABLE news_items ADD COLUMN fetch_batch_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_items' AND column_name = 'tags') THEN
        ALTER TABLE news_items ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_items' AND column_name = 'location') THEN
        ALTER TABLE news_items ADD COLUMN location TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_items' AND column_name = 'comment_count') THEN
        ALTER TABLE news_items ADD COLUMN comment_count INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_items' AND column_name = 'is_hot') THEN
        ALTER TABLE news_items ADD COLUMN is_hot BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_items' AND column_name = 'is_pinned') THEN
        ALTER TABLE news_items ADD COLUMN is_pinned BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_items' AND column_name = 'author_name') THEN
        ALTER TABLE news_items ADD COLUMN author_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_items' AND column_name = 'batch_completed_at') THEN
        ALTER TABLE news_items ADD COLUMN batch_completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $news_migration$ LANGUAGE plpgsql;

    -- 5.3 ads 表补全字段)
CREATE TABLE IF NOT EXISTS ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    link_url TEXT,
    raw_content TEXT,
    contact_info TEXT,
    scope TEXT DEFAULT 'local',
    target_city TEXT,
    target_province TEXT,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    payment_method TEXT,
    payment_voucher_url TEXT,
    rejection_reason TEXT,
    price_total NUMERIC(10, 2),
    duration_days INTEGER DEFAULT 30,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $ads_migration$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'start_date') THEN
        ALTER TABLE ads ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'end_date') THEN
        ALTER TABLE ads ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'duration_days') THEN
        ALTER TABLE ads ADD COLUMN duration_days INTEGER DEFAULT 30;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'raw_content') THEN
        ALTER TABLE ads ADD COLUMN raw_content TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'contact_info') THEN
        ALTER TABLE ads ADD COLUMN contact_info TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'target_city') THEN
        ALTER TABLE ads ADD COLUMN target_city TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'target_province') THEN
        ALTER TABLE ads ADD COLUMN target_province TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'payment_method') THEN
        ALTER TABLE ads ADD COLUMN payment_method TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'payment_voucher_url') THEN
        ALTER TABLE ads ADD COLUMN payment_voucher_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'rejection_reason') THEN
        ALTER TABLE ads ADD COLUMN rejection_reason TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'price_total') THEN
        ALTER TABLE ads ADD COLUMN price_total NUMERIC(10, 2);
    END IF;
END $ads_migration$ LANGUAGE plpgsql;

-- 6. 用户配置表 (public.users) 补全
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    role TEXT DEFAULT 'user',
    is_muted BOOLEAN DEFAULT false,
    is_suspended BOOLEAN DEFAULT false,
    real_name TEXT,
    id_card_number TEXT,
    id_card_scan_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $users_migration$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'username') THEN
        ALTER TABLE public.users ADD COLUMN username TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'display_name') THEN
        ALTER TABLE public.users ADD COLUMN display_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'phone') THEN
        ALTER TABLE public.users ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'bio') THEN
        ALTER TABLE public.users ADD COLUMN bio TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'is_muted') THEN
        ALTER TABLE public.users ADD COLUMN is_muted BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'is_suspended') THEN
        ALTER TABLE public.users ADD COLUMN is_suspended BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'real_name') THEN
        ALTER TABLE public.users ADD COLUMN real_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'id_card_number') THEN
        ALTER TABLE public.users ADD COLUMN id_card_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'id_card_scan_url') THEN
        ALTER TABLE public.users ADD COLUMN id_card_scan_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'is_verified') THEN
        ALTER TABLE public.users ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'phone_verified') THEN
        ALTER TABLE public.users ADD COLUMN phone_verified BOOLEAN DEFAULT false;
    END IF;
END $users_migration$ LANGUAGE plpgsql;

-- 6.10 AI 配置表
CREATE TABLE IF NOT EXISTS ai_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间触发器 (ai_config)
CREATE OR REPLACE FUNCTION update_ai_config_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ai_config_updated_at ON ai_config;
CREATE TRIGGER trigger_ai_config_updated_at
    BEFORE UPDATE ON ai_config
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_config_updated_at();

-- 插入默认 AI 配置 (如果不存在)
INSERT INTO ai_config (config_key, config_value, description) VALUES
('filter_rules', '日程安排/节目表（如电视播放时间、直播安排）
活动预告/观赛指南/购票指南
周期性总结（如"本周回顾"、"今日要闻"、"每日简报"等汇总帖）
纯粹的广告或促销内容
天气预报、体育比分列表等纯信息罗列', '内容过滤规则，每行一条，AI 会自动跳过符合这些规则的内容'),

('summary_requirements', '80-150字，概括核心内容、关键要素、影响，全部中文', '摘要生成要求'),

('commentary_requirements', '幽默犀利，有深度有趣味，全部使用中文简体，不要出现任何英文词汇或缩写', '评论生成要求'),

('commentary_length_article', '300-500字', '文章评论字数要求'),

('commentary_length_video', '150-250字，简洁精炼', '视频评论字数要求'),

('commentary_length_deep_dive', '800-1000字，请分为三个部分：【背景】历史与来龙去脉、【分析】核心观点与深层解读、【影响】未来趋势与建议', '深度分析评论字数要求'),

('classification_categories', '本地
热点
政治
科技
财经
文化娱乐
体育
深度', '新闻分类类别列表，每行一个'),

('classification_rules', '1. **本地 (Local)**：新闻中提到加拿大城市、省份、联邦/省级政府机构（CBSA, CRA, Health Canada）或加拿大特有事物
2. **热点**：中文圈热点（微博、微信、抖音热门）或全球主流媒体头条，或突发重大事件
3. **深度**：侧重结构性问题、宏观经济、颠覆性技术或高热度社会争议的深度分析
4. **其他分类**：财经、科技、政治（非加拿大）、文化娱乐、体育', '分类优先级规则说明'),

('canadian_cities', 'Ontario: Toronto, Mississauga, Brampton, Markham, Richmond Hill, Vaughan, Oakville, Burlington, Hamilton, Ottawa, Guelph, Waterloo, London, Kitchener, Cambridge
BC: Vancouver, Richmond, Burnaby, Surrey, Coquitlam, Victoria, Kelowna
Quebec: Montreal, Quebec City, Laval, Gatineau
Alberta: Calgary, Edmonton
Others: Winnipeg, Halifax, Saskatoon, Regina', '加拿大主要城市列表（用于本地新闻识别）')

ON CONFLICT (config_key) DO NOTHING;
CREATE TABLE IF NOT EXISTS forum_posts (
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

CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Note: Renamed from comment_likes to avoid conflict with news comments
CREATE TABLE IF NOT EXISTS forum_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 6.12 推荐源与搜索日志
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
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  has_results BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE VIEW search_analytics AS
SELECT
  keyword,
  COUNT(*) as total_searches,
  SUM(CASE WHEN has_results THEN 1 ELSE 0 END) as searches_with_results,
  SUM(CASE WHEN NOT has_results THEN 1 ELSE 0 END) as searches_without_results,
  AVG(results_count) as avg_results_count,
  MAX(created_at) as last_searched_at
FROM search_logs
GROUP BY keyword
ORDER BY total_searches DESC;

-- 6.5 评论系统
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    news_item_id UUID REFERENCES news_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- 6.6 验证码
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    phone TEXT,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6.7 用户地址与支付
CREATE TABLE IF NOT EXISTS user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_method_id TEXT NOT NULL,
    brand TEXT NOT NULL,
    last4 TEXT NOT NULL,
    exp_month INTEGER NOT NULL,
    exp_year INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6.8 服务分类 (被 services 表引用)
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6.9 系统设置
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 开启 RLS
ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommended_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- Forum Functions & Triggers (Using $func$ to avoid Supabase Editor syntax errors)

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_forum_posts_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_forum_posts_updated_at ON forum_posts;
CREATE TRIGGER trigger_forum_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_posts_updated_at();

-- 点赞计数触发器
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $func$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_post_likes_count ON post_likes;
CREATE TRIGGER trigger_post_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- 评论计数触发器
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $func$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_post_comments_count ON forum_comments;
CREATE TRIGGER trigger_post_comments_count
  AFTER INSERT OR DELETE ON forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

DO $policy$
BEGIN
    DROP POLICY IF EXISTS "Public Read" ON news_sources;
    CREATE POLICY "Public Read" ON news_sources FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public Read" ON news_items;
    CREATE POLICY "Public Read" ON news_items FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public Read" ON services;
    CREATE POLICY "Public Read" ON services FOR SELECT USING (status = 'active');
    
    DROP POLICY IF EXISTS "Public Read" ON ads;
    CREATE POLICY "Public Read" ON ads FOR SELECT USING (status = 'active');

    DROP POLICY IF EXISTS "Public Read" ON comments;
    CREATE POLICY "Public Read" ON comments FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public Read" ON service_categories;
    CREATE POLICY "Public Read" ON service_categories FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public Read" ON ai_config;
    CREATE POLICY "Public Read" ON ai_config FOR SELECT USING (true);

    -- Forum & Others Public Read (Simplified for migration)
    DROP POLICY IF EXISTS "Public Read" ON forum_posts;
    CREATE POLICY "Public Read" ON forum_posts FOR SELECT USING (status = 'active');

    DROP POLICY IF EXISTS "Public Read" ON recommended_sources;
    CREATE POLICY "Public Read" ON recommended_sources FOR SELECT USING (true);
END $policy$ LANGUAGE plpgsql;

-- 6.13 抓取日志系统
CREATE TABLE IF NOT EXISTS fetch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'running',
    total_scraped INTEGER DEFAULT 0,
    skipped_duplicate INTEGER DEFAULT 0,
    ai_processed INTEGER DEFAULT 0,
    ai_skipped INTEGER DEFAULT 0,
    ai_failed INTEGER DEFAULT 0,
    published_count INTEGER DEFAULT 0,
    failure_reasons JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fetch_logs ENABLE ROW LEVEL SECURITY;

DO $log_policy$
BEGIN
    DROP POLICY IF EXISTS "Public Read" ON fetch_logs;
    CREATE POLICY "Public Read" ON fetch_logs FOR SELECT USING (true);
END $log_policy$ LANGUAGE plpgsql;
