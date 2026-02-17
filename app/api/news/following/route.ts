import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { getFollowingNewsItems } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const news = await getFollowingNewsItems(authUser.id, limit);
    return NextResponse.json(news);
  } catch (error) {
    console.error('获取关注新闻失败:', error);
    return NextResponse.json({ error: '获取关注新闻失败' }, { status: 500 });
  }
}
