-- 创建系统设置表，用于存储抓取状态等系统配置
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE system_settings IS '系统设置表，存储抓取状态等配置';
COMMENT ON COLUMN system_settings.key IS '设置键名';
COMMENT ON COLUMN system_settings.value IS '设置值（JSON格式）';

-- 初始化抓取状态
INSERT INTO system_settings (key, value)
VALUES ('fetch_status', '{"is_running": false, "progress": 0, "total": 0}')
ON CONFLICT (key) DO NOTHING;

-- 允许匿名用户读取（用于前端显示状态）
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON system_settings
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated update" ON system_settings
  FOR ALL USING (true);
