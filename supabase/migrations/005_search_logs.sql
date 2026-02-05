-- 搜索日志表
CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  has_results BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以加快查询
CREATE INDEX IF NOT EXISTS idx_search_logs_keyword ON search_logs(keyword);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id);

-- 创建搜索统计视图
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

-- RLS 策略：允许所有人插入搜索日志
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "允许所有人记录搜索"
  ON search_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "允许用户查看自己的搜索历史"
  ON search_logs
  FOR SELECT
  TO public
  USING (user_id = auth.uid() OR user_id IS NULL);

-- 注释
COMMENT ON TABLE search_logs IS '用户搜索日志表';
COMMENT ON COLUMN search_logs.keyword IS '搜索关键字';
COMMENT ON COLUMN search_logs.results_count IS '搜索结果数量';
COMMENT ON COLUMN search_logs.has_results IS '是否有搜索结果';
COMMENT ON COLUMN search_logs.user_id IS '用户ID（可为空）';
COMMENT ON COLUMN search_logs.ip_address IS 'IP地址';
