import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - 重置抓取状态
export async function GET() {
  try {
    console.log('[Reset] 🔄 重置抓取状态...');
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'fetch_status',
        value: { is_running: false, progress: 0, total: 0 },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })
      .select();

    if (error) {
      console.error('[Reset] ❌ 重置失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Reset] ✅ 状态已重置');
    return NextResponse.json({
      success: true,
      message: '抓取状态已重置',
      data
    });
  } catch (error) {
    console.error('[Reset] ❌ 异常:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
