import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/server';

// GET: 获取全平台订单 (Admin)
export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = await createSupabaseAdminClient();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('size') || searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let query = supabase
            .from('orders')
            .select(`
                *,
                user:user_id(id, name, email)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            orders: data || [],
            total: count || 0,
            page,
            limit
        });
    } catch (error: any) {
        console.error('Admin orders fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: 更新订单状态 (核销、关闭等)
export async function PATCH(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = await createSupabaseAdminClient();
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('orders')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ order: data });
    } catch (error: any) {
        console.error('Admin orders update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
