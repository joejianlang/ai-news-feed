import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { createAd } from '@/lib/supabase/queries';

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);

        if (!user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const adData = await request.json();

        // 确保使用当前授权用户的 ID
        const finalAd = {
            ...adData,
            user_id: user.id,
            status: 'pending',
            payment_status: 'unpaid',
            created_at: new Date().toISOString()
        };

        const result = await createAd(finalAd);

        return NextResponse.json({ success: true, ad: result });
    } catch (error) {
        console.error('Failed to create ad via API:', error);
        return NextResponse.json({ error: '提交广告失败' }, { status: 500 });
    }
}
