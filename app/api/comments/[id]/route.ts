import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getCommentById, updateComment, deleteComment } from '@/lib/supabase/queries';

export async function PUT(
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
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 });
    }

    const existingComment = await getCommentById(id);
    if (!existingComment) {
      return NextResponse.json({ error: '评论不存在' }, { status: 404 });
    }
    if (existingComment.user_id !== payload.userId) {
      return NextResponse.json({ error: '无权限修改此评论' }, { status: 403 });
    }

    const comment = await updateComment(id, { content: content.trim() });
    return NextResponse.json({ comment, success: true });
  } catch (error) {
    console.error('更新评论失败:', error);
    return NextResponse.json({ error: '更新评论失败' }, { status: 500 });
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

    const existingComment = await getCommentById(id);
    if (!existingComment) {
      return NextResponse.json({ error: '评论不存在' }, { status: 404 });
    }
    if (existingComment.user_id !== payload.userId) {
      return NextResponse.json({ error: '无权限删除此评论' }, { status: 403 });
    }

    await deleteComment(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除评论失败:', error);
    return NextResponse.json({ error: '删除评论失败' }, { status: 500 });
  }
}
