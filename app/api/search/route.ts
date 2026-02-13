import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');

  if (!keyword || keyword.trim().length === 0) {
    return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
  }

  try {
    // 搜索新闻（标题和内容）
    const { data: newsItems, error: searchError } = await supabase
      .from('news_items')
      .select(`
        *,
        source:news_sources(*),
        categories(*)
      `)
      .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%,ai_summary.ilike.%${keyword}%,ai_commentary.ilike.%${keyword}%`)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (searchError) {
      console.error('Search error:', searchError);
      throw searchError;
    }

    const resultsCount = newsItems?.length || 0;
    const hasResults = resultsCount > 0;

    // 记录搜索日志（使用try-catch避免日志失败影响搜索结果）
    try {
      await supabase.from('search_logs').insert({
        keyword: keyword.trim(),
        results_count: resultsCount,
        has_results: hasResults,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });
    } catch (logError) {
      console.error('Failed to log search:', logError);
      // 继续返回搜索结果，即使日志记录失败
    }

    return NextResponse.json({
      keyword,
      results: newsItems || [],
      count: resultsCount,
    });
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json(
      { error: 'Search failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
