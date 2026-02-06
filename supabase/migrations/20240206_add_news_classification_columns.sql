-- Add category and tags columns to news_items table
-- This enables news classification functionality

-- Add category_id column to news_items if not exists
ALTER TABLE news_items
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Add tags column to news_items if not exists
ALTER TABLE news_items
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_news_items_category_id ON news_items(category_id);
