import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { followSource, unfollowSource, getUserFollows, isFollowing } from '@/lib/supabase/queries';

// 获取用户关注列表
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

    const follows = await getUserFollows(payload.userId);
    return NextResponse.json({ follows });
  } catch (error) {
    console.error('获取关注列表失败:', error);
    return NextResponse.json({ error: '获取关注列表失败' }, { status: 500 });
  }
}

// 关注媒体源
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

    const { sourceId } = await request.json();
    if (!sourceId) {
      return NextResponse.json({ error: '缺少sourceId' }, { status: 400 });
    }

    // 检查是否已关注
    const alreadyFollowing = await isFollowing(payload.userId, sourceId);
    if (alreadyFollowing) {
      return NextResponse.json({ error: '已经关注该媒体源' }, { status: 400 });
    }

    const follow = await followSource(payload.userId, sourceId);
    return NextResponse.json({ follow, success: true });
  } catch (error) {
    console.error('关注失败:', error);
    return NextResponse.json({ error: '关注失败' }, { status: 500 });
  }
}

// 取消关注
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token无效' }, { status: 401 });
    }

    const { sourceId } = await request.json();
    if (!sourceId) {
      return NextResponse.json({ error: '缺少sourceId' }, { status: 400 });
    }

    await unfollowSource(payload.userId, sourceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('取消关注失败:', error);
    return NextResponse.json({ error: '取消关注失败' }, { status: 500 });
  }
}
