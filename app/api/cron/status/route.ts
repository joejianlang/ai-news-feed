import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - 获取当前抓取状态
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value, updated_at')
      .eq('key', 'fetch_status')
      .single();

    if (error) {
      // 如果表不存在或没有数据，返回默认状态
      return NextResponse.json({
        is_running: false,
        progress: 0,
        total: 0,
        message: '未开始抓取',
      });
    }

    return NextResponse.json({
      ...data.value,
      updated_at: data.updated_at,
    });
  } catch (error) {
    console.error('Failed to get fetch status:', error);
    return NextResponse.json({
      is_running: false,
      error: 'Failed to get status',
    });
  }
}
