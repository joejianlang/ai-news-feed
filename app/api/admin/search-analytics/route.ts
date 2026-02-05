import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    // 获取搜索统计（手动聚合，因为可能没有视图）
    const { data: searchLogs, error } = await supabase
      .from('search_logs')
      .select('keyword, results_count, has_results, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Search analytics error:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // 手动聚合数据
    const keywordStats: Record<string, {
      keyword: string;
      total_searches: number;
      searches_with_results: number;
      searches_without_results: number;
      avg_results: number;
      last_searched: string;
    }> = {};

    searchLogs?.forEach(log => {
      const keyword = log.keyword;
      if (!keywordStats[keyword]) {
        keywordStats[keyword] = {
          keyword,
          total_searches: 0,
          searches_with_results: 0,
          searches_without_results: 0,
          avg_results: 0,
          last_searched: log.created_at,
        };
      }

      const stats = keywordStats[keyword];
      stats.total_searches++;
      if (log.has_results) {
        stats.searches_with_results++;
      } else {
        stats.searches_without_results++;
      }
      stats.avg_results = (stats.avg_results * (stats.total_searches - 1) + log.results_count) / stats.total_searches;

      // 更新最后搜索时间
      if (new Date(log.created_at) > new Date(stats.last_searched)) {
        stats.last_searched = log.created_at;
      }
    });

    // 转换为数组并排序
    const analytics = Object.values(keywordStats)
      .sort((a, b) => b.total_searches - a.total_searches)
      .slice(0, 50); // 只返回前50个热门搜索

    // 获取高频无结果搜索
    const hotNoResults = analytics
      .filter(stat => stat.total_searches >= 3 && stat.avg_results < 2)
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      topSearches: analytics,
      hotNoResults,
      totalUniqueKeywords: Object.keys(keywordStats).length,
      totalSearches: searchLogs?.length || 0,
    });
  } catch (error) {
    console.error('Analytics failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}
