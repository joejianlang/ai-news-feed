import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, checkAdmin } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// GET - 获取 AI 使用统计及抓取日志（仅管理员）
export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '未授权' }, { status: 401 });
  const isAdmin = await checkAdmin(authUser.id);
  if (!isAdmin) return NextResponse.json({ error: '权限不足' }, { status: 403 });

  const supabase = await createSupabaseAdminClient();

  try {
    const now = new Date();
    const utcTodayStr = now.toISOString().split('T')[0];
    const today = new Date(utcTodayStr + 'T00:00:00.000Z');
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

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

    const { data: recentLogs } = await supabase
      .from('fetch_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: dailyData } = await supabase
      .from('fetch_logs')
      .select('*')
      .gte('started_at', sevenDaysAgo.toISOString())
      .order('started_at', { ascending: true });

    const dailyStats: Record<string, any> = {};
    dailyData?.forEach(log => {
      const date = new Date(log.started_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { date, total_scraped: 0, published: 0, failed_or_skipped: 0, ai_skipped: 0, ai_failed: 0, duplicates: 0 };
      }
      dailyStats[date].total_scraped += log.total_scraped || 0;
      dailyStats[date].published += log.published_count || 0;
      dailyStats[date].ai_skipped += log.ai_skipped || 0;
      dailyStats[date].ai_failed += log.ai_failed || 0;
      dailyStats[date].duplicates += log.skipped_duplicate || 0;
      dailyStats[date].failed_or_skipped += (log.total_scraped - log.published_count);
    });

    const dailyStatsArray = Object.values(dailyStats).map((day: any) => ({
      ...day,
      successRate: day.total_scraped > 0 ? ((day.published / day.total_scraped) * 100).toFixed(1) + '%' : '0%',
    }));

    const costPerNews = 0.000625;

    return NextResponse.json({
      summary: {
        today: { count: todayCount || 0, cost: (todayCount || 0) * costPerNews },
        month: { count: monthCount || 0, cost: (monthCount || 0) * costPerNews },
        total: { count: totalCount || 0 },
      },
      recentLogs: recentLogs || [],
      dailyStats: dailyStatsArray,
      config: { mode: process.env.AI_MODE || 'standard', model: 'gemini-2.0-flash' },
    });
  } catch (error) {
    console.error('Failed to get AI stats:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
