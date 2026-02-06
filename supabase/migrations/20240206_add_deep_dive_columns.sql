-- Add deep dive enhancement columns to news_items table
-- These columns store enriched content for '深度' category news

-- Add deep_background column for historical context
ALTER TABLE news_items
ADD COLUMN IF NOT EXISTS deep_background TEXT;

-- Add deep_prediction column for future impact analysis
ALTER TABLE news_items
ADD COLUMN IF NOT EXISTS deep_prediction TEXT;

-- Add comment for documentation
COMMENT ON COLUMN news_items.deep_background IS '深度新闻的历史背景分析';
COMMENT ON COLUMN news_items.deep_prediction IS '深度新闻的未来影响预测';
