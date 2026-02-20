import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, checkAdmin } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// GET - 获取所有系统配置
export async function GET(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: '未授权' }, { status: 401 });
    const isAdmin = await checkAdmin(authUser.id);
    if (!isAdmin) return NextResponse.json({ error: '权限不足' }, { status: 403 });

    const supabase = await createSupabaseAdminClient();
    try {
        const { data, error } = await supabase.from('system_settings').select('*');
        if (error) throw error;

        const settings: Record<string, any> = {};
        data?.forEach(item => { settings[item.key] = item.value; });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// POST - 更新系统配置
export async function POST(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: '未授权' }, { status: 401 });
    const isAdmin = await checkAdmin(authUser.id);
    if (!isAdmin) return NextResponse.json({ error: '权限不足' }, { status: 403 });

    const supabase = await createSupabaseAdminClient();
    try {
        const { key, value } = await request.json();

        const { error } = await supabase
            .from('system_settings')
            .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
