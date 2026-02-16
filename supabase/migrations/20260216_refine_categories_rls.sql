-- 为分类表启用 RLS 并设置安全策略
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 1. 允许所有人读取分类（无论是否登录）
DROP POLICY IF EXISTS "Allow public read categories" ON categories;
CREATE POLICY "Allow public read categories" ON categories
  FOR SELECT USING (true);

-- 2. 允许管理员进行增删改查
-- 注意：这里使用 auth.uid() 关联到业务 users 表检查 role
DROP POLICY IF EXISTS "Allow admin all categories" ON categories;
CREATE POLICY "Allow admin all categories" ON categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 3. 兼容 API 层（如果配置了 SERVICE_ROLE_KEY，则不受 RLS 限制）
-- 如果是通过后台 API 路由操作，通常会绕过 RLS，但增加此策略可以多一层保障
