-- 为 news_sources 表添加测试状态字段

-- 添加测试状态列
ALTER TABLE news_sources
ADD COLUMN IF NOT EXISTS test_status VARCHAR(20) DEFAULT 'pending';

-- 添加测试结果列（JSON格式存储详细信息）
ALTER TABLE news_sources
ADD COLUMN IF NOT EXISTS test_result JSONB;

-- 添加最后测试时间列
ALTER TABLE news_sources
ADD COLUMN IF NOT EXISTS tested_at TIMESTAMPTZ;

-- 添加注释
COMMENT ON COLUMN news_sources.test_status IS '测试状态: pending-待测试, passed-已通过, failed-测试未通过';
COMMENT ON COLUMN news_sources.test_result IS '测试结果详情，包含抓取数量、错误信息等';
COMMENT ON COLUMN news_sources.tested_at IS '最后测试时间';

-- 为已存在的活跃源设置默认测试状态为 passed
UPDATE news_sources
SET test_status = 'passed'
WHERE is_active = true AND test_status = 'pending';
