#!/usr/bin/env node

/**
 * 添加用户角色功能
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 缺少 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addUserRole() {
  console.log('正在添加用户角色功能...\n');

  try {
    // 注意：由于Supabase JS客户端不支持直接执行DDL，
    // 我们需要手动在Supabase Dashboard执行SQL
    console.log('请在 Supabase Dashboard 的 SQL Editor 中执行以下SQL：\n');
    console.log('-------------------------------------------');
    console.log(`
-- 添加用户角色字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 添加检查约束
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);
    console.log('-------------------------------------------\n');

    // 获取所有用户，让用户选择谁是管理员
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, username')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('获取用户列表失败:', error);
      return;
    }

    if (users && users.length > 0) {
      console.log('当前用户列表：');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.username})`);
      });
      console.log('\n请在执行完上述SQL后，手动设置管理员：');
      console.log(`UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';`);
    }

  } catch (error) {
    console.error('操作失败:', error);
    process.exit(1);
  }
}

addUserRole();
