import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/adminAuth';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 获取所有 AI 配置
export async function GET(request: NextRequest) {
    const { isAdmin } = await verifyAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('ai_config')
            .select('*')
            .order('config_key');

        if (error) throw error;

        // 转换为键值对格式
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
    const { isAdmin } = await verifyAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    try {
        const updates = await request.json();

        // 批量更新
        for (const [key, value] of Object.entries(updates)) {
            const { error } = await supabaseAdmin
                .from('ai_config')
                .upsert({
                    config_key: key,
                    config_value: value as string,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'config_key'
                });

            if (error) {
                console.error(`Error updating ${key}:`, error);
                throw error;
            }
        }

        return NextResponse.json({ success: true, message: '配置已更新' });
    } catch (error) {
        console.error('Error updating AI config:', error);
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
}
