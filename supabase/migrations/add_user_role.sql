-- 添加用户角色字段
-- role: 'admin' (管理员) 或 'user' (普通用户)

-- 添加 role 列
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 添加检查约束
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));

-- 为第一个用户设置为管理员（你可以根据实际情况修改）
-- UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
