import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAuthUser, checkAdmin } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser.id))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdminClient();
        const { data, error } = await supabase
            .from('system_pricing_configs')
            .select('*');

        if (error) {
            // Table doesn't exist or other recoverable errors — return empty
            if (
                error.code === 'PGRST116' ||
                error.code === '42P01' ||
                error.message?.includes('does not exist') ||
                error.message?.includes('relation') ||
                error.message?.includes('schema cache')
            ) {
                return NextResponse.json({ configs: [], grouped: {} });
            }
            throw error;
        }

        // 按分类分组
        const grouped = (data || []).reduce((acc: any, item: any) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
        }, {});

        return NextResponse.json({ configs: data || [], grouped });
    } catch (error: any) {
        // Final fallback: if table is missing, return empty instead of 500
        const msg: string = error?.message || '';
        if (
            msg.includes('does not exist') ||
            msg.includes('relation') ||
            msg.includes('schema cache') ||
            msg.includes('42P01')
        ) {
            return NextResponse.json({ configs: [], grouped: {} });
        }
        console.error('Error fetching pricing configs:', error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser.id))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { configs } = await request.json();
        const supabase = await createSupabaseAdminClient();

        // 批量更新策略
        for (const config of configs) {
            await supabase
                .from('system_pricing_configs')
                .update({ config_value: config.config_value, updated_at: new Date().toISOString() })
                .eq('config_key', config.config_key);
        }

        return NextResponse.json({ message: 'Pricing configs updated successfully' });
    } catch (error: any) {
        const msg: string = error?.message || '';
        if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('schema cache')) {
            return NextResponse.json({ message: 'Table not configured yet', configs: [] });
        }
        console.error('Error updating pricing configs:', error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
