import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/adminAuth';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
}

// GET - 获取所有系统配置
export async function GET(request: NextRequest) {
    const { isAdmin } = await verifyAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { data, error } = await getSupabaseAdmin()
            .from('system_settings')
            .select('*');

        if (error) throw error;

        const settings: Record<string, any> = {};
        data?.forEach(item => {
            settings[item.key] = item.value;
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// POST - 更新系统配置
export async function POST(request: NextRequest) {
    const { isAdmin } = await verifyAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { key, value } = await request.json();

        const { error } = await getSupabaseAdmin()
            .from('system_settings')
            .upsert({
                key,
                value,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'key'
            });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
