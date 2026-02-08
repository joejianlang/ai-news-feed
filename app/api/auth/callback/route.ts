import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getUserByEmail, createUser } from '@/lib/supabase/queries';
import { generateToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const errorMsg = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error');

    if (errorMsg) {
        console.error('OAuth callback error from Supabase:', errorMsg);
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMsg)}`, request.url));
    }

    if (code) {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('Error exchanging code for session:', error.message, error);
            return NextResponse.redirect(new URL(`/login?error=Session交换失败: ${encodeURIComponent(error.message)}`, request.url));
        }

        if (data?.user) {
            const email = data.user.email!;
            const username = data.user.user_metadata.full_name || data.user.user_metadata.name || email.split('@')[0];

            // 1. 检查用户是否存在于我们的自定义表中
            let user = await getUserByEmail(email);

            if (!user) {
                // 2. 如果不存在，创建一个
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

    // 如果没有任何信息
    console.warn('OAuth callback reached without code or session.');
    return NextResponse.redirect(new URL('/login?error=未收到认证 code，请确保使用 PKCE 流程或检查配置', request.url));
}
