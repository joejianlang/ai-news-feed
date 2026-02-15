import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getUserById } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
    const supabaseAdmin = await createSupabaseAdminClient();

    try {
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        // 验证用户是否为管理员
        const userDetails = await getUserById(authUser.id);
        if (userDetails?.role !== 'admin') {
            return NextResponse.json({ error: '权限不足' }, { status: 403 });
        }

        const { data, error } = await supabaseAdmin
            .from('ads')
            .select('*')
            .in('status', ['pending', 'unpaid'])
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Fetch pending ads error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ads: data });
    } catch (error) {
        console.error('Failed to fetch pending ads:', error);
        return NextResponse.json({ error: '获取失败' }, { status: 500 });
    }
}
