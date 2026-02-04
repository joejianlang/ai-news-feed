#!/bin/bash

# 从.env.local读取DATABASE_URL
source .env.local

# 执行SQL文件
echo "执行SQL迁移..."

# 方法1: 使用curl调用Supabase Management API (需要service role key)
# 方法2: 直接告诉用户在Dashboard执行

echo "
请打开 Supabase Dashboard:
https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor

然后在SQL Editor中执行以下SQL:

-------------------------------------------
-- 添加用户角色字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 添加检查约束
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 设置管理员
UPDATE users SET role = 'admin' WHERE email = 'joelyan00@gmail.com';
-------------------------------------------

执行完成后按回车继续...
"

read -p "按回车继续..."
echo "✅ 完成！请重启开发服务器。"
