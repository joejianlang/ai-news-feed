require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFetchStatus() {
  console.log('🔍 检查当前状态...');

  // 读取当前状态
  const { data: current, error: readError } = await supabase
    .from('system_settings')
    .select('*')
    .eq('key', 'fetch_status')
    .single();

  if (readError) {
    console.log('❌ 读取错误:', readError.message);
    return;
  }

  console.log('✅ 当前状态:', JSON.stringify(current, null, 2));

  // 测试更新状态
  console.log('\n📝 测试更新状态为运行中...');
  const { data: updated, error: updateError } = await supabase
    .from('system_settings')
    .upsert({
      key: 'fetch_status',
      value: {
        is_running: true,
        progress: 1,
        total: 4,
        current_source: '测试源'
      },
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })
    .select()
    .single();

  if (updateError) {
    console.log('❌ 更新错误:', updateError.message);
    console.log('详细信息:', JSON.stringify(updateError, null, 2));
  } else {
    console.log('✅ 更新成功:', JSON.stringify(updated, null, 2));
  }

  // 再次读取验证
  console.log('\n🔍 验证更新后的状态...');
  const { data: verified, error: verifyError } = await supabase
    .from('system_settings')
    .select('*')
    .eq('key', 'fetch_status')
    .single();

  if (verifyError) {
    console.log('❌ 验证错误:', verifyError.message);
  } else {
    console.log('✅ 验证成功:', JSON.stringify(verified, null, 2));
  }

  // 恢复状态
  console.log('\n🔄 恢复初始状态...');
  await supabase
    .from('system_settings')
    .upsert({
      key: 'fetch_status',
      value: {
        is_running: false,
        progress: 0,
        total: 0
      },
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });

  console.log('✅ 测试完成！');
}

testFetchStatus().catch(console.error);
