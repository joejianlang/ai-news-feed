-- 创建推荐新闻源表
-- 用于存储AI推荐的待审核新闻源

CREATE TABLE IF NOT EXISTS recommended_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('rss', 'youtube_channel', 'web')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  youtube_channel_id VARCHAR(255),
  fetch_interval INTEGER DEFAULT 3600,
  commentary_style TEXT DEFAULT '专业分析',

  -- 推荐相关信息
  recommended_reason TEXT, -- AI推荐理由
  popularity_score INTEGER, -- 热度评分 (1-100)
  subscriber_count BIGINT, -- 订阅数（YouTube）
  view_count BIGINT, -- 观看数

  -- 审核状态
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_recommended_sources_status ON recommended_sources(status);
CREATE INDEX IF NOT EXISTS idx_recommended_sources_created_at ON recommended_sources(created_at DESC);

-- 添加注释
COMMENT ON TABLE recommended_sources IS 'AI推荐的待审核新闻源';
COMMENT ON COLUMN recommended_sources.recommended_reason IS 'AI推荐理由';
COMMENT ON COLUMN recommended_sources.popularity_score IS '热度评分 1-100';
COMMENT ON COLUMN recommended_sources.status IS 'pending-待审核, approved-已批准, rejected-已拒绝';
