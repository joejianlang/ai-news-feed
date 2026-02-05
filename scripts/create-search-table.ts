import { config } from 'dotenv';
config({ path: '.env.local' });

async function createTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ 缺少环境变量');
    return;
  }

  const sql = `
-- 搜索日志表
CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  has_results BOOLEAN DEFAULT FALSE,
  user_id UUID,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_search_logs_keyword ON search_logs(keyword);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at DESC);
  `;

  console.log('📋 SQL to execute:');
  console.log('='.repeat(70));
  console.log(sql);
  console.log('='.repeat(70));

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    const result = await response.text();
    console.log('\n📤 Response:', response.status, response.statusText);
    console.log(result);

    if (response.ok) {
      console.log('\n✅ 表创建成功！');
    } else {
      console.log('\n⚠️ 请手动在Supabase Dashboard SQL Editor中执行以上SQL');
      console.log('Dashboard: https://supabase.com/dashboard/project/vthuysxkirpaewgudaok/sql');
    }
  } catch (error) {
    console.error('\n❌ 执行失败:', error);
    console.log('\n请手动在Supabase Dashboard SQL Editor中执行以上SQL');
  }
}

createTable().catch(console.error);
