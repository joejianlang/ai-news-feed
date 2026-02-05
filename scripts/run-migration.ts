import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function runMigration() {
  const sql = fs.readFileSync('supabase/migrations/005_search_logs.sql', 'utf8');

  console.log('📋 开始执行SQL迁移...\n');
  console.log(sql);
  console.log('\n' + '='.repeat(70));

  // 由于Supabase客户端不支持直接执行DDL，我们需要手动在Supabase Dashboard执行
  console.log('\n⚠️ 请手动在Supabase Dashboard执行以上SQL');
  console.log('或者使用 Supabase CLI: supabase db push');
  console.log('\nSupabase Dashboard SQL Editor:');
  console.log('https://supabase.com/dashboard/project/vthuysxkirpaewgudaok/sql/new');
}

runMigration().catch(console.error);
