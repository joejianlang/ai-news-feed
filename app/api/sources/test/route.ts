import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/adminAuth';
import { scrapeContent } from '@/lib/scrapers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST - 测试新闻源抓取
export async function POST(request: Request) {
  // 验证管理员权限
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
  }

  try {
    const { sourceId, url, source_type, youtube_channel_id } = await request.json();

    if (!url || !source_type) {
      return NextResponse.json({ error: 'Missing url or source_type' }, { status: 400 });
    }

    console.log(`Testing source: ${url} (${source_type})`);

    // 尝试抓取内容
    const startTime = Date.now();
    const scrapedItems = await scrapeContent(url, source_type, youtube_channel_id);
    const duration = Date.now() - startTime;

    const success = scrapedItems.length > 0;
    const testResult = {
      success,
      itemCount: scrapedItems.length,
      duration,
      sampleTitles: scrapedItems.slice(0, 3).map(item => item.title),
      error: success ? null : '无法抓取到任何内容',
    };

    // 如果提供了 sourceId，更新数据库中的测试状态
    if (sourceId) {
      await supabase
        .from('news_sources')
        .update({
          test_status: success ? 'passed' : 'failed',
          test_result: testResult,
          tested_at: new Date().toISOString(),
          // 如果测试失败，自动禁用
          is_active: success,
        })
        .eq('id', sourceId);
    }

    return NextResponse.json({
      ...testResult,
    });
  } catch (error) {
    console.error('Test failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // 如果有 sourceId，更新失败状态
    const body = await request.clone().json().catch(() => ({}));
    if (body.sourceId) {
      await supabase
        .from('news_sources')
        .update({
          test_status: 'failed',
          test_result: { success: false, error: errorMessage },
          tested_at: new Date().toISOString(),
          is_active: false,
        })
        .eq('id', body.sourceId);
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      itemCount: 0,
      duration: 0,
      sampleTitles: [],
    });
  }
}
