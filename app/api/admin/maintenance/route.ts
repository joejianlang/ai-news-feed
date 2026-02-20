import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/server';

async function checkAdmin(authUser: any) {
    const supabase = authUser.source === 'legacy'
        ? await createSupabaseAdminClient()
        : await createSupabaseServerClient();
    const { data } = await supabase.from('users').select('role').eq('id', authUser.id).single();
    return data?.role === 'admin';
}

// GET - 获取清理配置和系统统计
export async function GET(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseAdminClient();

    try {
        // 获取自动清理配置
        const { data: settings } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'cleanup_settings')
            .maybeSingle();

        // 获取当前新闻总数统计
        const { count: totalNews } = await supabase
            .from('news_items')
            .select('*', { count: 'exact', head: true });

        return NextResponse.json({
            settings: settings?.value || { auto_enabled: false, retention_hours: 168 },
            stats: { totalNews: totalNews || 0 }
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// POST - 执行手动清理 或 更新自动清理配置
export async function POST(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseAdminClient();
    const body = await request.json();
    const { action } = body;

    try {
        if (action === 'manual_cleanup') {
            const { start_date, end_date } = body;
            if (!start_date || !end_date) {
                return NextResponse.json({ error: 'Missing date range' }, { status: 400 });
            }

            console.log(`[Maintenance] 手动清理中: ${start_date} 到 ${end_date}`);

            const { count, error } = await supabase
                .from('news_items')
                .delete({ count: 'exact' })
                .gte('created_at', start_date)
                .lte('created_at', end_date);

            if (error) throw error;

            return NextResponse.json({
                success: true,
                message: `成功清理 ${count} 条新闻`,
                deleted_count: count
            });
        }

        if (action === 'update_settings') {
            const { settings } = body;
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    key: 'cleanup_settings',
                    value: settings,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;
            return NextResponse.json({ success: true, message: '配置已保存' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('[Maintenance] 操作失败:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
