-- 添加顶置字段到news_items表
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_news_items_pinned ON news_items(is_pinned DESC);

-- 更新注释
COMMENT ON COLUMN news_items.is_pinned IS '是否顶置文章';
