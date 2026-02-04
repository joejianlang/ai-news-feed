import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getUserById } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  try {
    // 从cookie获取token
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 验证token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token无效' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const user = await getUserById(payload.userId);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}
