import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/server';

async function checkAdmin(authUser: any) {
    const supabase = authUser.source === 'legacy'
        ? await createSupabaseAdminClient()
        : await createSupabaseServerClient();

    const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();

    return userProfile?.role === 'admin';
}

export async function GET(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdminClient();

        // 1. 今日新增需求
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: todayRequests } = await supabase
            .from('form_submissions')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        // 2. 待处理需求
        const { count: pendingRequests } = await supabase
            .from('form_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        // 3. 活跃服务商
        const { count: activeProviders } = await supabase
            .from('providers')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved');

        // 4. 本月成交额 (基于已完成订单)
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);
        const { data: monthlyOrders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('status', 'completed')
            .gte('created_at', firstDayOfMonth.toISOString());

        const monthlyRevenue = monthlyOrders?.reduce((sum, order: any) => sum + (order.total_amount || 0), 0) || 0;

        // 5. 最新需求列表
        const { data: recentRequests } = await supabase
            .from('form_submissions')
            .select('*, template:form_templates(name)')
            .order('created_at', { ascending: false })
            .limit(5);

        return NextResponse.json({
            stats: {
                todayRequests: todayRequests || 0,
                pendingRequests: pendingRequests || 0,
                activeProviders: activeProviders || 0,
                monthlyRevenue: monthlyRevenue
            },
            recentRequests: recentRequests?.map(r => ({
                id: r.id,
                service: r.template?.name || '未知服务',
                user: (r.form_data as any)?.name || '匿名用户', // 假设 form_data 中有 name
                date: r.created_at,
                status: r.status === 'pending' ? '待处理' : (r.status === 'processing' ? '派单中' : '已完成')
            })) || []
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
