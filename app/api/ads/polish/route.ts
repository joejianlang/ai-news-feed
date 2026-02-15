import { NextRequest, NextResponse } from 'next/server';
import { polishAdContent } from '@/lib/ai/ad';
import { getAuthUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);

        if (!user) {
            return NextResponse.json({ error: '未登录' }, { status: 401 });
        }

        const { productName, rawDescription } = await request.json();

        if (!productName || !rawDescription) {
            return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
        }

        const polished = await polishAdContent(productName, rawDescription);
        return NextResponse.json(polished);
    } catch (error) {
        console.error('广告润色失败:', error);
        return NextResponse.json({ error: '广告润色失败' }, { status: 500 });
    }
}
