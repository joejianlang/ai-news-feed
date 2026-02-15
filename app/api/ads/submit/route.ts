import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    // 这里我们使用普通的 Server Client，配合放宽的 RLS 策略
    const supabase = await createSupabaseServerClient();

    try {
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json({ error: '请先登录' }, { status: 401 });
        }

        const adData = await request.json();

        // 严格字段校验与构造，防止多余字段干扰
        const finalAd = {
            title: adData.title,
            content: adData.content,
            raw_content: adData.raw_content,
            image_url: adData.image_url,
            link_url: adData.link_url,
            contact_info: adData.contact_info,
            scope: adData.scope,
            duration_days: adData.duration_days,
            price_total: adData.price_total,
            user_id: authUser.id,
            status: 'pending',
            payment_status: 'unpaid'
        };

        // 执行插入操作。由于 RLS 已通过 20260214_fix_ads_rls.sql 放宽，
        // 即便是在匿名环境下也能成功插入，我们已经在上方的 getAuthUser 保证了 user_id 的真实性。
        const { data, error } = await supabase
            .from('ads')
            .insert([finalAd])
            .select()
            .single();

        if (error) {
            console.error('Database insertion error:', error);
            return NextResponse.json({
                error: '广告提交存入失败',
                details: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: '提交成功，请等待审核',
            ad: data
        });
    } catch (error) {
        console.error('API submission exception:', error);
        return NextResponse.json({ error: '服务器处理异常' }, { status: 500 });
    }
}
