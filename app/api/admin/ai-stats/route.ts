import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/adminAuth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - 获取 AI 使用统计及抓取日志（仅管理员）
export async function GET() {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const now = new Date();
    const utcTodayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const today = new Date(utcTodayStr + 'T00:00:00.000Z');

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. 基础新闻计数
    const { count: todayCount } = await supabase
      .from('news_items')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const { count: monthCount } = await supabase
      .from('news_items')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString());

    const { count: totalCount } = await supabase
      .from('news_items')
      .select('*', { count: 'exact', head: true });

    // 2. 获取最近 30 条抓取明细记录
    const { data: recentLogs } = await supabase
      .from('fetch_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(30);

    // 3. 每日汇总统计 (最近 7 天)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 由于 Supabase JS SDK 不直接支持复杂的 GROUP BY，我们获取数据后在 JS 端聚合
    const { data: dailyData } = await supabase
      .from('fetch_logs')
      .select('*')
      .gte('started_at', sevenDaysAgo.toISOString())
      .order('started_at', { ascending: true });

    const dailyStats: Record<string, any> = {};

    dailyData?.forEach(log => {
      const date = new Date(log.started_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          total_scraped: 0,
          published: 0,
          failed_or_skipped: 0,
          ai_skipped: 0,
          ai_failed: 0,
          duplicates: 0
        };
      }
      dailyStats[date].total_scraped += log.total_scraped || 0;
      dailyStats[date].published += log.published_count || 0;
      dailyStats[date].ai_skipped += log.ai_skipped || 0;
      dailyStats[date].ai_failed += log.ai_failed || 0;
      dailyStats[date].duplicates += log.skipped_duplicate || 0;
      dailyStats[date].failed_or_skipped += (log.total_scraped - log.published_count);
    });

    // 转换为数组并计算百分比
    const dailyStatsArray = Object.values(dailyStats).map((day: any) => {
      const successRate = day.total_scraped > 0
        ? ((day.published / day.total_scraped) * 100).toFixed(1) + '%'
        : '0%';
      return { ...day, successRate };
    });

    // 估算成本
    const costPerNews = 0.000625;
    const todayCost = (todayCount || 0) * costPerNews;
    const monthCost = (monthCount || 0) * costPerNews;

    return NextResponse.json({
      summary: {
        today: { count: todayCount || 0, cost: todayCost },
        month: { count: monthCount || 0, cost: monthCost },
        total: { count: totalCount || 0 }
      },
      recentLogs: recentLogs || [],
      dailyStats: dailyStatsArray,
      config: {
        mode: process.env.AI_MODE || 'standard',
        model: 'gemini-2.0-flash',
      },
    });
  } catch (error) {
    console.error('Failed to get AI stats:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
