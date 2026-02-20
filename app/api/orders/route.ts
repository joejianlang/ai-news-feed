import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/server';

// 订单号格式对齐优服佳：ORD + yyyyMMdd + 6位随机
function generateOrderNo(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, ''); // yyyyMMdd
    const rand = Math.floor(100000 + Math.random() * 900000); // 6-digit random
    return `ORD${date}${rand}`;
}

// POST: 用户创建标准服务订单（对齐优服佳 orders 表字段）
export async function POST(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser) {
        return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdminClient();
        const body = await request.json();

        const {
            service_id,       // provider_services.id → service_listing_id
            service_name,     // 服务名称快照 → service_title
            provider_id,
            total_amount,
            deposit_amount,
            deposit_ratio,    // 定金比例（0~100）→ deposit_rate
        } = body;

        if (!service_name || total_amount === undefined) {
            return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
        }

        const order_no = generateOrderNo();
        const depositRate = deposit_ratio ?? 30; // 默认30%
        const finalDepositAmount = deposit_amount ?? (total_amount * depositRate / 100);

        const insertData: Record<string, any> = {
            order_no,
            user_id: authUser.id,
            provider_id: provider_id || null,
            service_title: service_name,          // 优服佳字段名
            service_type: 'standard',              // 优服佳枚举：standard / simple_custom / complex_custom
            total_amount,
            deposit_amount: finalDepositAmount,
            deposit_rate: depositRate,             // 优服佳字段
            currency: 'CAD',
            regret_period_hours: 24,               // 标准服务默认24小时反悔期
            status: 'created',                     // 优服佳初始状态（非 pending_payment）
        };

        // service_listing_id 可选（优服佳关联 provider_services.id）
        if (service_id) {
            insertData.service_listing_id = service_id;
        }

        const { data, error } = await supabase
            .from('orders')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            // 部分字段可能不存在（旧版数据库），降级重试
            console.warn('Full order insert failed, retrying minimal:', error.message);
            const minimalData = {
                order_no,
                user_id: authUser.id,
                provider_id: provider_id || null,
                service_title: service_name,
                service_type: 'standard',
                total_amount,
                deposit_amount: finalDepositAmount,
                status: 'created',
            };
            const retry = await supabase.from('orders').insert(minimalData).select().single();
            if (retry.error) throw retry.error;
            return NextResponse.json({ order: retry.data });
        }

        return NextResponse.json({ order: data });
    } catch (error: any) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: 查询单个订单（用户只能查自己的）
export async function GET(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser) {
        return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdminClient();
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('id');

        if (!orderId) {
            return NextResponse.json({ error: '缺少订单 ID' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .eq('user_id', authUser.id)
            .single();

        if (error) throw error;

        return NextResponse.json({ order: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
