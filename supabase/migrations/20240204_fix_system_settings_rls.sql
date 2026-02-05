-- 修复 system_settings 表的 RLS 策略
-- 允许所有用户（包括匿名用户）更新抓取状态

-- 删除旧的策略
DROP POLICY IF EXISTS "Allow authenticated update" ON system_settings;

-- 创建新的策略：允许所有人读取和更新
CREATE POLICY "Allow public update" ON system_settings
  FOR ALL USING (true) WITH CHECK (true);
