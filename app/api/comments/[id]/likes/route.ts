import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { likeComment, unlikeComment } from '@/lib/supabase/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token无效' }, { status: 401 });
    }

    const { id } = await params;
    await likeComment(id, payload.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('点赞失败:', error);
    return NextResponse.json({ error: '点赞失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token无效' }, { status: 401 });
    }

    const { id } = await params;
    await unlikeComment(id, payload.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('取消点赞失败:', error);
    return NextResponse.json({ error: '取消点赞失败' }, { status: 500 });
  }
}
