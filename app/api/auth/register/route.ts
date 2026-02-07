import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/supabase/queries';
import { hashPassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, code } = await request.json();

    // 验证输入
    if (!email || !username || !password || !code) {
      return NextResponse.json(
        { error: '请提供邮箱、用户名、密码和验证码' },
        { status: 400 }
      );
    }

    // 校验验证码
    const { verifyRegistrationCode } = await import('@/lib/supabase/queries');
    const isValidCode = await verifyRegistrationCode(email, code);
    if (!isValidCode) {
      return NextResponse.json(
        { error: '验证码无效或已过期' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少6个字符' },
        { status: 400 }
      );
    }

    // 检查用户是否已存在
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 创建用户
    const passwordHash = await hashPassword(password);
    const user = await createUser(email, username, passwordHash);

    // 生成token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // 设置cookie
    const response = NextResponse.json({ user, token });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7天
    });

    return response;
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json(
      { error: '注册失败' },
      { status: 500 }
    );
  }
}
