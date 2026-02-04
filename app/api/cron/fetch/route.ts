import { NextResponse } from 'next/server';
import { getActiveNewsSources, createNewsItem, updateLastFetchedTime, checkNewsItemExists } from '@/lib/supabase/queries';
import { scrapeContent } from '@/lib/scrapers';
import { analyzeContent } from '@/lib/ai/claude';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
  await supabase
    .from('system_settings')
    .upsert({
      key: 'fetch_status',
      value: status,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
}

// GET - 定时任务触发（通过 cron job 调用）
export async function GET(request: Request) {
  // 验证 cron secret（可选，用于外部调用时验证）
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // 如果设置了 CRON_SECRET，则验证
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 获取所有活跃且测试通过的新闻源
    const allSources = await getActiveNewsSources();
    const sources = allSources.filter(s => s.test_status !== 'failed');

    if (sources.length === 0) {
      return NextResponse.json({ message: 'No active sources to fetch' });
    }

    console.log(`[Cron] Starting sequential fetch for ${sources.length} sources`);

    // 更新状态：开始抓取
    await updateFetchStatus({
      is_running: true,
      progress: 0,
      total: sources.length,
    });

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
      await updateFetchStatus({
        is_running: true,
        current_source: source.name,
        progress: i + 1,
        total: sources.length,
      });

      try {
        console.log(`[Cron] Fetching ${i + 1}/${sources.length}: ${source.name}`);

        // 抓取内容
        const scrapedItems = await scrapeContent(
          source.url,
          source.source_type,
          source.youtube_channel_id
        );

        let newCount = 0;
        let skipCount = 0;

        for (const item of scrapedItems) {
          // 检查是否已存在
          const exists = await checkNewsItemExists(item.url, item.videoId);
          if (exists) {
            skipCount++;
            continue;
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
          });

          newCount++;
        }

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
      }
    }

    // 更新状态：抓取完成
    await updateFetchStatus({
      is_running: false,
      progress: sources.length,
      total: sources.length,
      last_completed_at: new Date().toISOString(),
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
