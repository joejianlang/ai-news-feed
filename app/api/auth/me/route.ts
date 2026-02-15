import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { getUserById } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 获取详细用户信息
    let user = null;
    try {
      user = await getUserById(authUser.id);
    } catch (dbError) {
      console.warn('Could not find profile in public.users for auth user:', authUser.id, dbError);
      // 如果数据库里还没同步到用户信息，返回一个基础信息
      user = {
        id: authUser.id,
        email: authUser.email,
        username: (authUser as any).username || authUser.email.split('@')[0],
        role: 'user', // 默认角色
        is_incomplete: true
      };
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('获取用户信息整体失败:', error);
    return NextResponse.json(
      { error: '获取用户信息失败', detail: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
