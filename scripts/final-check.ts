import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function finalCheck() {
  const { count: noCommentary } = await supabase
    .from('news_items')
    .select('*', { count: 'exact', head: true })
    .eq('ai_commentary', '暂无评论');

  const { count: total } = await supabase
    .from('news_items')
    .select('*', { count: 'exact', head: true });

  const { data: sample } = await supabase
    .from('news_items')
    .select('title, ai_summary, ai_commentary')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('\n🎉 最终验证结果');
  console.log('='.repeat(70));
  console.log('总新闻数:', total);
  console.log('"暂无评论":', noCommentary);
  console.log('完成率:', ((1 - (noCommentary || 0) / (total || 1)) * 100).toFixed(1) + '%');

  if (sample && sample.length > 0) {
    console.log('\n📰 最新3条新闻示例:\n');
    sample.forEach((item, i) => {
      console.log(`${i+1}. ${item.title.substring(0, 40)}...`);
      console.log(`   摘要长度: ${item.ai_summary?.length || 0} 字符`);
      console.log(`   评论长度: ${item.ai_commentary?.length || 0} 字符`);
      const isGood = item.ai_commentary && item.ai_commentary !== '暂无评论' && item.ai_commentary.length > 100;
      console.log(`   状态: ${isGood ? '✅ 优质' : '⚠️'}`);
      console.log();
    });
  }
}

finalCheck().catch(console.error);
