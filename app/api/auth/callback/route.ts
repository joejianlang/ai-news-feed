import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getUserByEmail, createUser } from '@/lib/supabase/queries';
import { generateToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data?.user) {
            const email = data.user.email!;
            const username = data.user.user_metadata.full_name || data.user.user_metadata.name || email.split('@')[0];

            // 1. 检查用户是否存在于我们的自定义表中
            let user = await getUserByEmail(email);

            if (!user) {
                // 2. 如果不存在，创建一个（因为是 OAuth，密码可以随机或者为空，我们这里暂时用个随机字符串，因为登录是走 OAuth）
                // 注意：createUser 预期的是 passwordHash，对于 OAuth 用户，我们可以特殊处理
                // 或者修改 createUser 支持没有密码的情况（但在表中 password_hash 可能是必填的）
                const randomPassword = Math.random().toString(36).slice(-10);
                user = await createUser(email, username, `oauth_google_${randomPassword}`);
            }

            // 3. 生成我们的自定义 JWT Token
            const token = generateToken({
                userId: user.id,
                email: user.email,
                username: user.username,
            });

            // 4. 重定向到首页并设置 cookie
            const response = NextResponse.redirect(new URL('/', request.url));
            response.cookies.set('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7天
            });

            return response;
        }
    }

    // 如果出错或没有 code，重定向到登录页并带上错误信息
    return NextResponse.redirect(new URL('/login?error=Google 登录失败', request.url));
}
