import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { analyzeContentWithGemini } from '../lib/ai/gemini';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function reprocessNews() {
  // 找到一条最近的新闻
  const { data: news } = await supabase
    .from('news_items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!news) {
    console.log('没有找到新闻');
    return;
  }

  console.log('\n正在重新处理新闻:');
  console.log('标题:', news.title);
  console.log('='.repeat(70));

  // 重新分析
  const result = await analyzeContentWithGemini(
    news.content || '内容暂无',
    news.title,
    '犀利'
  );

  console.log('\n分析结果:');
  console.log('='.repeat(70));
  console.log('翻译标题:', result.translatedTitle || '（无）');
  console.log('\n摘要长度:', result.summary.length, '字符');
  console.log(result.summary);
  console.log('\n评论长度:', result.commentary.length, '字符');
  console.log(result.commentary.substring(0, 200) + '...');

  // 更新数据库
  const { error } = await supabase
    .from('news_items')
    .update({
      ai_summary: result.summary,
      ai_commentary: result.commentary,
      updated_at: new Date().toISOString(),
    })
    .eq('id', news.id);

  if (error) {
    console.error('\n更新失败:', error);
  } else {
    console.log('\n✅ 数据库已更新');
  }
}

reprocessNews().catch(console.error);
