-- 添加批次ID和发布状态字段到news_items表

-- 添加 fetch_batch_id 字段（批次ID，用于标识同一批抓取的新闻）
ALTER TABLE news_items
ADD COLUMN IF NOT EXISTS fetch_batch_id UUID;

-- 添加 is_published 字段（是否已发布，false表示草稿状态）
ALTER TABLE news_items
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- 添加 batch_completed_at 字段（批次完成时间，用于显示"更新时间"）
ALTER TABLE news_items
ADD COLUMN IF NOT EXISTS batch_completed_at TIMESTAMPTZ;

-- 为现有数据设置默认值
UPDATE news_items
SET is_published = true,
    batch_completed_at = created_at
WHERE is_published IS NULL;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_news_items_batch_id ON news_items(fetch_batch_id);
CREATE INDEX IF NOT EXISTS idx_news_items_published ON news_items(is_published);
CREATE INDEX IF NOT EXISTS idx_news_items_batch_completed ON news_items(batch_completed_at DESC);

-- 添加注释
COMMENT ON COLUMN news_items.fetch_batch_id IS '抓取批次ID，同一次抓取任务的新闻共享同一个batch_id';
COMMENT ON COLUMN news_items.is_published IS '是否已发布。false表示草稿状态，抓取完成后才设为true';
COMMENT ON COLUMN news_items.batch_completed_at IS '批次完成时间，用于前端显示"更新时间"';
