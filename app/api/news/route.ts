import { NextResponse } from 'next/server';
import { getNewsItemsByBatch, getUserFollows } from '@/lib/supabase/queries';
import { verifyToken } from '@/lib/auth/jwt';
import type { NewsItem } from '@/types';

// 按批次分组新闻
function groupNewsByBatch(news: NewsItem[]) {
  const batches = new Map<string, NewsItem[]>();

  news.forEach(item => {
    const batchKey = item.batch_completed_at || item.created_at;
    if (!batches.has(batchKey)) {
      batches.set(batchKey, []);
    }
    batches.get(batchKey)!.push(item);
  });

  // 转换为数组并按批次时间降序排序
  return Array.from(batches.entries())
    .map(([batchTime, items]) => ({
      batchTime,
      items: items.sort((a, b) => {
        // 每个批次内按新闻发布时间降序排序（混合排序）
        const timeA = a.published_at || a.created_at;
        const timeB = b.published_at || b.created_at;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      })
    }))
    .sort((a, b) => new Date(b.batchTime).getTime() - new Date(a.batchTime).getTime());
}

// GET - 获取新闻列表（按批次分组）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const categoryId = searchParams.get('categoryId') || undefined;
    const cityTag = searchParams.get('city') || undefined;

    // 检查用户登录状态以进行个性化过滤
    let excludeSourceIds: string[] = [];

    // 从请求中获取 cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const token = cookieHeader
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];

    if (token) {
      try {
        const payload = verifyToken(token);
        if (payload && payload.userId) {
          const follows = await getUserFollows(payload.userId);
          if (follows && follows.length > 0) {
            // 类型断言或检查以确保 source_id 存在
            excludeSourceIds = (follows as any[]).map(f => f.source_id);
          }
        }
      } catch (e) {
        console.error('Token verification failed in news route:', e);
      }
    }

    const news = await getNewsItemsByBatch(limit, categoryId, cityTag, excludeSourceIds);
    const groupedNews = groupNewsByBatch(news);

    return NextResponse.json(groupedNews);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
