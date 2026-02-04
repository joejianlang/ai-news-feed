-- 清空新闻数据（保留新闻源配置）
-- 这将删除所有新闻条目，但保留用户、新闻源、分类等配置

-- 删除所有新闻条目
DELETE FROM news_items;

-- 可选：重置新闻源的最后抓取时间
UPDATE news_sources SET last_fetched_at = NULL;
