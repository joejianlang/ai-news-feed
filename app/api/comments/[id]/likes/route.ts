import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { likeComment, unlikeComment } from '@/lib/supabase/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    await likeComment(id, authUser.id);
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
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    await unlikeComment(id, authUser.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('取消点赞失败:', error);
    return NextResponse.json({ error: '取消点赞失败' }, { status: 500 });
  }
}
