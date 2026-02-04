import { NextResponse } from 'next/server';
import { getActiveNewsSources, createNewsItem, updateLastFetchedTime, checkNewsItemExists } from '@/lib/supabase/queries';
import { scrapeContent } from '@/lib/scrapers';
import { analyzeContent } from '@/lib/ai/claude';
import { verifyAdmin } from '@/lib/auth/adminAuth';

// POST - 手动触发抓取（仅管理员）
export async function POST(request: Request) {
  // 验证管理员权限
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
  }

  try {
    const { sourceId } = await request.json();

    const sources = await getActiveNewsSources();
    const targetSources = sourceId
      ? sources.filter(s => s.id === sourceId)
      : sources;

    const results = [];

    for (const source of targetSources) {
      try {
        console.log(`Fetching from ${source.name}...`);

        // 抓取内容
        const scrapedItems = await scrapeContent(
          source.url,
          source.source_type,
          source.youtube_channel_id
        );

        let newItemsCount = 0;
        let skippedItemsCount = 0;

        for (const item of scrapedItems) {
          // 检查是否已存在（视频用video_id检查，文章用URL检查）
          const exists = await checkNewsItemExists(item.url, item.videoId);
          if (exists) {
            skippedItemsCount++;
            console.log(`Skipping existing item: ${item.title}`);
            continue;
          }

          // AI分析
          const analysis = await analyzeContent(
            item.content,
            item.title,
            source.commentary_style
          );

          // 使用翻译后的标题（如果有的话）
          const finalTitle = analysis.translatedTitle || item.title;

          // 保存到数据库
          const newsItem = await createNewsItem({
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

          results.push(newsItem);
          newItemsCount++;
        }

        console.log(`Fetched ${newItemsCount} new items, skipped ${skippedItemsCount} existing items from ${source.name}`);

        // 更新最后抓取时间
        await updateLastFetchedTime(source.id);

      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      items: results,
    });
  } catch (error) {
    console.error('Error in fetch API:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

// GET - 定时任务触发（通过cron job调用）
export async function GET(request: Request) {
  // 验证cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 执行抓取逻辑
  return POST(request);
}
