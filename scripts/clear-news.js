#!/usr/bin/env node

/**
 * 清空新闻数据脚本
 * 删除所有新闻条目，保留新闻源、用户、分类等配置
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 缺少 Supabase 环境变量 (需要 SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearNewsData() {
  console.log('开始清空新闻数据...');

  try {
    // 删除所有新闻条目
    const { error: deleteError, count } = await supabase
      .from('news_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 删除所有记录

    if (deleteError) {
      throw deleteError;
    }

    console.log(`成功删除 ${count || 0} 条新闻记录`);

    // 重置新闻源的最后抓取时间
    const { error: updateError } = await supabase
      .from('news_sources')
      .update({ last_fetched_at: null })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (updateError) {
      throw updateError;
    }

    console.log('已重置所有新闻源的最后抓取时间');
    console.log('✅ 数据清空完成！');
  } catch (error) {
    console.error('清空数据失败:', error);
    process.exit(1);
  }
}

clearNewsData();
