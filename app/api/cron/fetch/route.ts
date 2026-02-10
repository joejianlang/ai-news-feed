import { NextResponse } from 'next/server';
import { getActiveNewsSources, createNewsItem, updateLastFetchedTime, checkNewsItemExists, publishBatch } from '@/lib/supabase/queries';
import { scrapeContent } from '@/lib/scrapers';
import { analyzeContent } from '@/lib/ai'; // 使用统一接口
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { executeConcurrently } from '@/lib/utils/concurrency';

// 使用 ANON_KEY，配合修改后的 RLS 策略允许更新
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 更新抓取状态到数据库
async function updateFetchStatus(status: {
  is_running: boolean;
  current_source?: string;
  progress?: number;
  total?: number;
  last_completed_at?: string;
  error?: string;
}) {
  console.log('[updateFetchStatus] 📝 准备写入状态:', status);
  const { data, error } = await supabase
    .from('system_settings')
    .upsert({
      key: 'fetch_status',
      value: status,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })
    .select();

  if (error) {
    console.error('[updateFetchStatus] ❌ 写入失败:', error);
  } else {
    console.log('[updateFetchStatus] ✅ 写入成功:', data);
  }
}

// 自动修复：查找因之前脚本中断而卡在草稿状态的新闻
async function healStuckItems() {
  console.log('[Heal] 🔍 检查是否有被卡住的草稿...');
  const { data: stuckItems, error } = await supabase
    .from('news_items')
    .update({
      is_published: true,
      batch_completed_at: new Date().toISOString()
    })
    .eq('is_published', false)
    .not('ai_summary', 'is', null) // 只修复已经有了摘要的
    .select('id');

  if (error) {
    console.error('[Heal] ❌ 修复失败:', error);
  } else if (stuckItems && stuckItems.length > 0) {
    console.log(`[Heal] ✅ 成功修复并发布了 ${stuckItems.length} 个被卡住的新闻项`);
  }
}

// GET - 定时任务触发（通过 cron job 调用）
export async function GET(request: Request) {
  console.log('[Cron] 📥 收到抓取请求');

  // 先进行自我修复
  await healStuckItems();

  // 验证 cron secret（可选，用于外部调用时验证）
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  console.log('[Cron] 🔐 CRON_SECRET:', cronSecret ? '已设置' : '未设置');
  console.log('[Cron] 🔑 Authorization Header:', authHeader ? '已提供' : '未提供');

  // 如果设置了 CRON_SECRET 且不是默认值，则验证
  // 本地开发时使用默认值 'your-cron-secret' 不需要验证
  if (cronSecret && cronSecret !== 'your-cron-secret' && authHeader !== `Bearer ${cronSecret}`) {
    console.log('[Cron] ❌ 认证失败');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron] ✅ 认证通过');

  try {
    // 获取所有活跃且测试通过的新闻源
    console.log('[Cron] 📚 获取活跃新闻源...');
    const allSources = await getActiveNewsSources();
    const sources = allSources.filter(s => s.test_status !== 'failed');

    console.log(`[Cron] 📊 找到 ${allSources.length} 个活跃源，其中 ${sources.length} 个通过测试`);

    if (sources.length === 0) {
      console.log('[Cron] ⚠️ 没有可抓取的新闻源');
      return NextResponse.json({ message: 'No active sources to fetch' });
    }

    console.log(`[Cron] 🚀 开始顺序抓取 ${sources.length} 个新闻源`);

    // 生成本次抓取的批次ID和时间
    const batchId = randomUUID();
    const completedAt = new Date().toISOString();
    console.log(`[Cron] 📦 批次ID: ${batchId}, 批次时间: ${completedAt}`);

    // 更新状态：开始抓取
    console.log('[Cron] 💾 更新状态为运行中...');
    await updateFetchStatus({
      is_running: true,
      progress: 0,
      total: sources.length,
    });
    console.log('[Cron] ✅ 状态已更新');

    const results = {
      totalSources: sources.length,
      successSources: 0,
      failedSources: 0,
      newItems: 0,
      skippedItems: 0,
      errors: [] as string[],
    };

    // 顺序抓取每个源
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];

      // 更新当前进度
      console.log(`[Cron] 🔄 更新进度: ${i + 1}/${sources.length} - ${source.name}`);
      await updateFetchStatus({
        is_running: true,
        current_source: source.name,
        progress: i + 1,
        total: sources.length,
      });
      console.log(`[Cron] ✅ 进度已更新`);

      try {
        console.log(`[Cron] Fetching ${i + 1}/${sources.length}: ${source.name}`);

        // 为单个源的抓取添加超时保护（5分钟）
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Source fetch timeout (5 minutes)')), 5 * 60 * 1000);
        });

        const fetchPromise = (async () => {
          // 抓取内容
          const scrapedItems = await scrapeContent(
            source.url,
            source.source_type,
            source.youtube_channel_id
          );

          let newCount = 0;
          let skipCount = 0;

          // 并发处理新闻项（AI 分析）
          // Gemini 支持更高并发，Claude 较保守
          const maxConcurrent = 10; // Gemini 可以 10 并发

          const results = await executeConcurrently(
            scrapedItems,
            async (item) => {
              // 检查是否已存在
              const exists = await checkNewsItemExists(item.url, item.videoId);
              if (exists) {
                return { skipped: true };
              }

              // AI 分析
              const analysis = await analyzeContent(
                item.content,
                item.title,
                source.commentary_style
              );

              const finalTitle = analysis.translatedTitle || item.title;

              // 保存到数据库
              await createNewsItem({
                source_id: source.id,
                original_url: item.url,
                title: finalTitle,
                content: item.content,
                content_type: item.contentType,
                ai_summary: analysis.summary,
                ai_commentary: analysis.commentary,
                published_at: item.publishedAt?.toISOString(),
                video_id: item.videoId,
                image_url: item.imageUrl,
                fetch_batch_id: batchId,
                is_published: true, // Default to true for immediate visibility
                batch_completed_at: completedAt, // Use consistent batch time
              });

              return { skipped: false };
            },
            { maxConcurrent, delayBetweenBatches: 100 }
          );

          // 统计结果
          newCount = results.filter(r => !r.skipped).length;
          skipCount = results.filter(r => r.skipped).length;

          return { newCount, skipCount };
        })();

        // 使用 Promise.race 实现超时控制
        const { newCount, skipCount } = await Promise.race([fetchPromise, timeoutPromise]) as { newCount: number; skipCount: number };

        // 更新最后抓取时间
        await updateLastFetchedTime(source.id);

        results.successSources++;
        results.newItems += newCount;
        results.skippedItems += skipCount;

        console.log(`[Cron] ${source.name}: ${newCount} new, ${skipCount} skipped`);

        // 添加小延迟，避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.failedSources++;
        const errorMsg = `${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(`[Cron] Error fetching ${source.name}:`, error);

        // 即使失败也继续下一个源，不要中断整个流程
      }
    }

    // 批量发布本次抓取的所有新闻（冗余但安全的最后一步）
    console.log(`[Cron] 📢 发布批次 ${batchId} 的 ${results.newItems} 条新闻...`);
    await publishBatch(batchId, completedAt);
    console.log(`[Cron] ✅ 批次已发布`);

    // 更新状态：抓取完成
    await updateFetchStatus({
      is_running: false,
      progress: sources.length,
      total: sources.length,
      last_completed_at: completedAt,
    });

    console.log(`[Cron] Fetch completed: ${results.newItems} new items from ${results.successSources} sources`);

    return NextResponse.json({
      success: true,
      message: 'Sequential fetch completed',
      ...results,
    });

  } catch (error) {
    console.error('[Cron] Fetch failed:', error);

    // 更新状态：抓取失败
    await updateFetchStatus({
      is_running: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
