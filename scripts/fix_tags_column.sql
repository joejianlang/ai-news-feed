-- ============================================================================
-- 修复：news_items 表缺失 tags 字段导致 500 错误
-- ============================================================================

-- 1. 为 news_items 表添加 tags 字段
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_items' AND column_name = 'tags') THEN
        ALTER TABLE news_items ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
END $$;
