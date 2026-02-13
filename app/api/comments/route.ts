import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getCommentsByNewsItem, createComment } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const newsItemId = searchParams.get('newsItemId');

    if (!newsItemId) {
      return NextResponse.json({ error: '缺少newsItemId参数' }, { status: 400 });
    }

    const token = request.cookies.get('auth_token')?.value;
    const payload = token ? verifyToken(token) : null;
    const currentUserId = payload?.userId;

    const comments = await getCommentsByNewsItem(newsItemId, currentUserId);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    return NextResponse.json({ error: '获取评论列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token无效' }, { status: 401 });
    }

    const { getUserById } = await import('@/lib/supabase/queries');
    const user = await getUserById(payload.userId);

    if (user?.is_suspended) {
      return NextResponse.json({ error: '账号已被封禁' }, { status: 403 });
    }

    if (user?.is_muted) {
      return NextResponse.json({ error: '您已被禁言，暂时无法发表评论。' }, { status: 403 });
    }

    const { newsItemId, content, parentId } = await request.json();

    if (!newsItemId || !content?.trim()) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: '评论内容过长' }, { status: 400 });
    }

    const comment = await createComment({
      news_item_id: newsItemId,
      user_id: payload.userId,
      parent_id: parentId || null,
      content: content.trim(),
    });

    return NextResponse.json({ comment, success: true });
  } catch (error) {
    console.error('创建评论失败:', error);
    return NextResponse.json({ error: '创建评论失败' }, { status: 500 });
  }
}
