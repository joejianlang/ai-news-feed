import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/server';

// GET: 获取当前用户的订单列表
export async function GET(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser) {
        return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdminClient();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let query = supabase
            .from('orders')
            .select('*', { count: 'exact' })
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        return NextResponse.json({ orders: data || [], total: count || 0, page, limit });
    } catch (error: any) {
        console.error('Error fetching user orders:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
