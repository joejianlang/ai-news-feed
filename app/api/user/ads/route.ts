import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { getUserAds } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);

        if (!user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const ads = await getUserAds(user.id);
        return NextResponse.json({ success: true, ads });
    } catch (error) {
        console.error('Fetch user ads error:', error);
        return NextResponse.json({ error: '获取失败' }, { status: 500 });
    }
}
