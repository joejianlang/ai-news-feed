import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    const supabaseAdmin = await createSupabaseAdminClient();
    try {
        const user = await getAuthUser(request);
        if (!user) return NextResponse.json({ error: '未授权' }, { status: 401 });

        const { adId, method, voucherUrl } = await request.json();

        if (!adId || !method) {
            return NextResponse.json({ error: '参数缺失' }, { status: 400 });
        }

        // 验证广告状态和所属权
        const { data: ad, error: fetchError } = await supabaseAdmin
            .from('ads')
            .select('*')
            .eq('id', adId)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !ad) {
            return NextResponse.json({ error: '未找到相关广告' }, { status: 404 });
        }

        if (ad.status !== 'unpaid' && ad.status !== 'rejected') {
            // 允许在驳回后重新支付（如果是因为支付问题被驳回）
            // 但通常 unpaid 是主要入口
        }

        const updates: any = {
            payment_method: method,
            updated_at: new Date().toISOString()
        };

        if (method === 'manual') {
            if (!voucherUrl) return NextResponse.json({ error: '请上传支付凭证' }, { status: 400 });
            updates.payment_voucher_url = voucherUrl;
            updates.payment_status = 'verifying';
            updates.status = 'verifying_payment';
        } else if (method === 'online') {
            // 这里原本应该跳到支付网关，目前模拟自动成功
            updates.payment_status = 'paid';
            updates.status = 'active';

            // 自动激活日期计算
            const now = new Date();
            updates.start_date = now.toISOString();
            const duration = ad.duration_days || 1;
            const endDate = new Date(now);
            endDate.setDate(endDate.getDate() + duration);
            updates.end_date = endDate.toISOString();
        }

        const { error: updateError } = await supabaseAdmin
            .from('ads')
            .update(updates)
            .eq('id', adId)
            .eq('user_id', user.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, status: updates.status });
    } catch (error) {
        console.error('Payment submission error:', error);
        return NextResponse.json({ error: '提交失败' }, { status: 500 });
    }
}
