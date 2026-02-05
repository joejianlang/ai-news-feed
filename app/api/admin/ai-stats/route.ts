import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/adminAuth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - 获取 AI 使用统计（仅管理员）
export async function GET() {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // 获取今天的新闻数量
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todayCount } = await supabase
      .from('news_items')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // 获取本月的新闻数量
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const { count: monthCount } = await supabase
      .from('news_items')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString());

    // 获取总新闻数量
    const { count: totalCount } = await supabase
      .from('news_items')
      .select('*', { count: 'exact', head: true });

    // 估算成本（基于 Haiku 4.0）
    const costPerNews = 0.000625; // $0.000625 per news item
    const todayCost = (todayCount || 0) * costPerNews;
    const monthCost = (monthCount || 0) * costPerNews;
    const totalCost = (totalCount || 0) * costPerNews;

    return NextResponse.json({
      today: {
        count: todayCount || 0,
        cost: todayCost,
      },
      month: {
        count: monthCount || 0,
        cost: monthCost,
      },
      total: {
        count: totalCount || 0,
        cost: totalCost,
      },
      config: {
        mode: process.env.AI_MODE || 'standard',
        model: 'claude-haiku-4-20250514',
      },
    });
  } catch (error) {
    console.error('Failed to get AI stats:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
