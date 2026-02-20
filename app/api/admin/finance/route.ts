import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseKey);
}

// GET: 获取财务统计与流水 (Admin)
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabase();

        // 1. 获取广告总收入 (基于支付状态为 'paid' 的广告)
        const { data: ads, error: adsError } = await supabase
            .from('ads')
            .select('amount')
            .eq('payment_status', 'paid');

        const totalAdRevenue = ads?.reduce((sum, ad: any) => sum + (ad.amount || 0), 0) || 0;

        // 2. 获取订单总额 (基于已完成的订单)
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('total_amount, status')
            .eq('status', 'completed');

        const totalOrderVolume = orders?.reduce((sum, order: any) => sum + (order.total_amount || 0), 0) || 0;
        const potentialCommission = totalOrderVolume * 0.1; // 假设 10% 抽成

        // 3. 获取最近 20 条流水 (模拟从 ads 和 orders 合并)
        // 在实际系统中，应该有一个独立的 transactions 表
        const { data: recentAds } = await supabase
            .from('ads')
            .select('id, title, amount, created_at, payment_status')
            .order('created_at', { ascending: false })
            .limit(10);

        const { data: recentOrders } = await supabase
            .from('orders')
            .select('id, order_no, total_amount, created_at, status')
            .order('created_at', { ascending: false })
            .limit(10);

        const transactions = [
            ...(recentAds?.map(ad => ({
                id: ad.id,
                type: '广告支付',
                amount: ad.amount || 0,
                user: ad.title,
                date: ad.created_at,
                status: ad.payment_status === 'paid' ? 'success' : 'pending'
            })) || []),
            ...(recentOrders?.map(order => ({
                id: order.id,
                type: '服务订单',
                amount: order.total_amount || 0,
                user: order.order_no,
                date: order.created_at,
                status: order.status === 'completed' ? 'success' : 'pending'
            })) || [])
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({
            stats: {
                totalRevenue: totalAdRevenue + potentialCommission,
                adRevenue: totalAdRevenue,
                orderVolume: totalOrderVolume,
                pendingWithdrawals: 0 // 暂时硬编码
            },
            transactions
        });
    } catch (error: any) {
        console.error('Admin finance fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
