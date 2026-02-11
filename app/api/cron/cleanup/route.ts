import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
}

// GET - 定时自动清理旧闻
export async function GET(request: NextRequest) {
    // 验证 Cron 密钥
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    try {
        // 读取清理配置
        const { data: configData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'cleanup_settings')
            .maybeSingle();

        const settings = configData?.value || { auto_enabled: false, retention_hours: 168 };

        if (!settings.auto_enabled) {
            return NextResponse.json({ message: 'Auto cleanup is disabled' });
        }

        const retentionHours = parseInt(settings.retention_hours) || 168;
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - retentionHours);

        console.log(`[Cron Cleanup] 正在清理 ${cutoffDate.toISOString()} 之前的新闻...`);

        const { count, error } = await supabase
            .from('news_items')
            .delete({ count: 'exact' })
            .lt('created_at', cutoffDate.toISOString());

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: `自动清理完成，删除了 ${count} 条记录`,
            cutoff: cutoffDate.toISOString(),
            deleted_count: count
        });

    } catch (error) {
        console.error('[Cron Cleanup] 任务执行异常:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
