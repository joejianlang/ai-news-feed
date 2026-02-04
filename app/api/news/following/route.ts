import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getFollowingNewsItems } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token无效' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const news = await getFollowingNewsItems(payload.userId, limit);
    return NextResponse.json(news);
  } catch (error) {
    console.error('获取关注新闻失败:', error);
    return NextResponse.json({ error: '获取关注新闻失败' }, { status: 500 });
  }
}
