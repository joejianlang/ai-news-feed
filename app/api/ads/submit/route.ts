import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    const supabase = await createSupabaseServerClient();

    try {
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const adData = await request.json();

        // 确保使用当前授权用户的 ID，并设置初始状态
        const finalAd = {
            ...adData,
            user_id: authUser.id,
            status: 'pending',
            payment_status: 'unpaid'
        };

        // 直接使用通过授权的 supabase 客户端进行插入，以通过 RLS 检查
        // RLS 策略 "Users can insert their own ads" 要求 auth.uid() = user_id
        const { data, error } = await supabase
            .from('ads')
            .insert([finalAd])
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error details:', error);
            return NextResponse.json({
                error: '数据库存储失败',
                details: error.message
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, ad: data });
    } catch (error) {
        console.error('Failed to create ad via API:', error);
        return NextResponse.json({ error: '后端提交处理失败' }, { status: 500 });
    }
}
