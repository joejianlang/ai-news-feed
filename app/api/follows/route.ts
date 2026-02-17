import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { followSource, unfollowSource, getUserFollows, isFollowing } from '@/lib/supabase/queries';

// 获取用户关注列表
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const follows = await getUserFollows(authUser.id);
    return NextResponse.json({ follows });
  } catch (error: any) {
    console.error('获取关注列表失败:', error);
    return NextResponse.json({
      error: '获取关注列表失败',
      details: error?.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}

// 关注媒体源
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceId } = body;

    if (!sourceId) {
      return NextResponse.json({ error: '缺少sourceId' }, { status: 400 });
    }

    console.log(`User ${authUser.id} attempting to follow source ${sourceId}`);

    // 检查是否已关注
    const alreadyFollowing = await isFollowing(authUser.id, sourceId);
    if (alreadyFollowing) {
      return NextResponse.json({ error: '已经关注该媒体源' }, { status: 400 });
    }

    const follow = await followSource(authUser.id, sourceId);
    return NextResponse.json({ follow, success: true });
  } catch (error: any) {
    console.error('关注失败:', error);
    return NextResponse.json({
      error: '关注失败',
      details: error?.message || String(error),
      code: error?.code,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}

// 取消关注
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { sourceId } = await request.json();
    if (!sourceId) {
      return NextResponse.json({ error: '缺少sourceId' }, { status: 400 });
    }

    await unfollowSource(authUser.id, sourceId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('取消关注失败:', error);
    return NextResponse.json({
      error: '取消关注失败',
      details: error?.message || String(error),
      code: error?.code,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}
