import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, checkAdmin } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// GET - 获取所有 AI 配置
export async function GET(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: '未授权' }, { status: 401 });
    const isAdmin = await checkAdmin(authUser.id);
    if (!isAdmin) return NextResponse.json({ error: '权限不足' }, { status: 403 });

    const supabase = await createSupabaseAdminClient();
    try {
        const { data, error } = await supabase
            .from('ai_config')
            .select('*')
            .order('config_key');

        if (error) throw error;

        const config: Record<string, { value: string; description: string; updated_at: string }> = {};
        for (const item of data || []) {
            config[item.config_key] = {
                value: item.config_value,
                description: item.description,
                updated_at: item.updated_at,
            };
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error fetching AI config:', error);
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}

// PUT - 更新 AI 配置
export async function PUT(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: '未授权' }, { status: 401 });
    const isAdmin = await checkAdmin(authUser.id);
    if (!isAdmin) return NextResponse.json({ error: '权限不足' }, { status: 403 });

    const supabase = await createSupabaseAdminClient();
    try {
        const updates = await request.json();

        for (const [key, value] of Object.entries(updates)) {
            const { error } = await supabase
                .from('ai_config')
                .upsert({
                    config_key: key,
                    config_value: value as string,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'config_key' });

            if (error) throw error;
        }

        return NextResponse.json({ success: true, message: '配置已更新' });
    } catch (error) {
        console.error('Error updating AI config:', error);
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
}
