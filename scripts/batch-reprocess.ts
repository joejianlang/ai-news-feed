import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { analyzeContentWithGemini } from '../lib/ai/gemini';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// 并发控制
const BATCH_SIZE = 10; // 每批处理10条
const DELAY_MS = 1000; // 每批之间延迟1秒

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function batchReprocess() {
  // 获取所有"暂无评论"的新闻
  const { data: newsItems, error } = await supabase
    .from('news_items')
    .select('*')
    .eq('ai_commentary', '暂无评论')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('查询失败:', error);
    return;
  }

  if (!newsItems || newsItems.length === 0) {
    console.log('没有需要重新处理的新闻');
    return;
  }

  console.log(`\n📋 找到 ${newsItems.length} 条需要重新处理的新闻\n`);
  console.log('开始批量处理...\n');
  console.log('='.repeat(70));

  let successCount = 0;
  let failCount = 0;

  // 分批处理
  for (let i = 0; i < newsItems.length; i += BATCH_SIZE) {
    const batch = newsItems.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(newsItems.length / BATCH_SIZE);

    console.log(`\n[批次 ${batchNum}/${totalBatches}] 处理 ${batch.length} 条新闻...`);

    // 并发处理当前批次
    const promises = batch.map(async (news, index) => {
      try {
        const result = await analyzeContentWithGemini(
          news.content || '内容暂无',
          news.title,
          '犀利'
        );

        // 更新数据库
        const { error: updateError } = await supabase
          .from('news_items')
          .update({
            ai_summary: result.summary,
            ai_commentary: result.commentary,
            updated_at: new Date().toISOString(),
          })
          .eq('id', news.id);

        if (updateError) {
          console.error(`  ❌ [${i + index + 1}] 更新失败: ${news.title.substring(0, 30)}...`);
          return false;
        }

        console.log(`  ✅ [${i + index + 1}] ${news.title.substring(0, 40)}...`);
        return true;
      } catch (error) {
        console.error(`  ❌ [${i + index + 1}] 处理失败: ${news.title.substring(0, 30)}...`);
        console.error(`     错误:`, error instanceof Error ? error.message : error);
        return false;
      }
    });

    const results = await Promise.all(promises);
    successCount += results.filter(r => r).length;
    failCount += results.filter(r => !r).length;

    // 批次间延迟，避免API限流
    if (i + BATCH_SIZE < newsItems.length) {
      console.log(`  ⏳ 等待 ${DELAY_MS}ms 后继续...`);
      await sleep(DELAY_MS);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 批量处理完成！');
  console.log(`✅ 成功: ${successCount} 条`);
  console.log(`❌ 失败: ${failCount} 条`);
  console.log(`📈 成功率: ${((successCount / newsItems.length) * 100).toFixed(1)}%`);
}

batchReprocess().catch(console.error);
