import { NextResponse } from 'next/server';
import { getActiveNewsSources, createNewsItem, updateLastFetchedTime, checkNewsItemExists, checkSimilarNewsItem } from '@/lib/supabase/queries';
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


    const results: any[] = [];


    for (const source of targetSources) {
      try {
        console.log(`Fetching from ${source.name}...`);

        // 超时包装函数：60秒超时
        const fetchWithTimeout = async () => {
          return Promise.race([
            scrapeContent(
              source.url,
              source.source_type,
              source.youtube_channel_id
            ),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`抓取 ${source.name} 超时（60秒）`)), 60000)
            )
          ]);
        };

        const scrapedItems = await fetchWithTimeout();

        let newItemsCount = 0;
        let skippedItemsCount = 0;
        let consecutiveSkips = 0;
        const MAX_CONSECUTIVE_SKIPS = 3; // 连续3次遇到旧新闻就停止抓取该源

        for (const item of scrapedItems) {
          try {
            // 为每条新闻处理添加30秒超时
            await Promise.race([
              (async () => {
                // 检查是否已存在或标题相似（智能去重）
                const exists = await checkSimilarNewsItem(item.title, item.url);

                if (exists) {
                  skippedItemsCount++;
                  consecutiveSkips++;
                  console.log(`Skipping existing/similar item: ${item.title}`);

                  // 如果连续多次遇到旧新闻，且不是YouTube频道（防止置顶视频干扰），则停止
                  // 注意：RSS通常是按时间倒序的，所以这个策略有效。
                  // YouTube频道置顶视频可能始终在最前，所以要小心。
                  // 这里简单策略：如果是RSS或Web，且连续跳过，则break。
                  if (consecutiveSkips >= MAX_CONSECUTIVE_SKIPS && source.source_type !== 'youtube_channel') {
                    console.log(`Hit ${MAX_CONSECUTIVE_SKIPS} consecutive existing items, stopping fetch for ${source.name}`);
                    return 'BREAK';
                  }
                  return 'CONTINUE';
                }

                // 重置连续跳过计数
                consecutiveSkips = 0;

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
              })(),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`处理新闻超时: ${item.title.substring(0, 50)}...`)), 30000)
              )
            ]).then((result) => {
              if (result === 'BREAK') throw new Error('BREAK_LOOP');
              if (result === 'CONTINUE') return;
            });

          } catch (itemError: any) {
            if (itemError?.message === 'BREAK_LOOP') {
              break; // 跳出内层循环
            }
            console.error(`Error processing item from ${source.name}:`, itemError);
            // 继续处理下一条新闻
            continue;
          }
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
