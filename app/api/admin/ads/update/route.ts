import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getUserById } from '@/lib/supabase/queries';

export async function POST(request: NextRequest) {
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

        const { id, status, rejectionReason } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ error: '参数缺失' }, { status: 400 });
        }

        const updates: any = { status, updated_at: new Date().toISOString() };
        if (rejectionReason) updates.rejection_reason = rejectionReason;

        // 如果是上线，处理日期
        if (status === 'active') {
            const now = new Date();
            updates.start_date = now.toISOString();
            updates.payment_status = 'paid';

            // 获取时长
            const { data: adData } = await supabaseAdmin
                .from('ads')
                .select('duration_days')
                .eq('id', id)
                .single();

            if (adData?.duration_days) {
                const endDate = new Date(now);
                endDate.setDate(endDate.getDate() + adData.duration_days);
                updates.end_date = endDate.toISOString();
            }
        }

        const { data, error } = await supabaseAdmin
            .from('ads')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Admin ad update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, ad: data });
    } catch (error) {
        console.error('Failed to update ad status:', error);
        return NextResponse.json({ error: '操作失败' }, { status: 500 });
    }
}
