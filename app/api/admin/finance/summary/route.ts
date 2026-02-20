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

        // 1. 获取广告总收入 (基于支付状态为 'paid' 的广告)
        const { data: ads } = await supabase
            .from('ads')
            .select('amount')
            .eq('payment_status', 'paid');

        // 2. 获取已完成订单的总额
        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('status', 'completed');

        const stripe_balance = 125840.50; // 模拟 Stripe 余额
        const platform_revenue = (ads?.reduce((sum, ad: any) => sum + (ad.amount || 0), 0) || 0) +
            (orders?.reduce((sum, o: any) => sum + (o.total_amount || 0), 0) || 0) * 0.1;
        const escrow_balance = 45200.00; // 模拟代管资金

        return NextResponse.json({
            stripe_balance,
            escrow_balance,
            platform_revenue
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
