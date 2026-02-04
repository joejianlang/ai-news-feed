#!/usr/bin/env node

/**
 * 设置管理员账户
 * 通过Supabase RPC或直接SQL操作
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 缺少 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAdmin() {
  console.log('正在设置管理员...\n');

  const adminEmail = 'joelyan00@gmail.com';

  try {
    // 执行SQL：添加role列（如果不存在）
    const { data: addColumnData, error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_name='users' AND column_name='role') THEN
            ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
            ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));
            CREATE INDEX idx_users_role ON users(role);
          END IF;
        END $$;
      `
    });

    console.log('由于Supabase客户端限制，请手动在Supabase Dashboard执行以下SQL：\n');
    console.log('步骤1: 添加role列');
    console.log('-------------------------------------------');
    console.log(`
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);
    console.log('-------------------------------------------\n');

    console.log('步骤2: 设置你的账户为管理员');
    console.log('-------------------------------------------');
    console.log(`
UPDATE users SET role = 'admin' WHERE email = '${adminEmail}';
    `);
    console.log('-------------------------------------------\n');

    console.log('执行完毕后，重启开发服务器即可生效。');

  } catch (error) {
    console.error('操作失败:', error);
  }
}

setupAdmin();
