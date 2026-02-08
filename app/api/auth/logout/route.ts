import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // 清除 Supabase session
        const supabase = await createSupabaseServerClient();
        await supabase.auth.signOut();
    } catch (error) {
        console.warn('Error signing out from Supabase:', error);
        // 继续清除本地 cookie，即使 Supabase 退出失败
    }

    // 清除自定义 auth_token cookie
    const response = NextResponse.json({ success: true, message: '已成功退出登录' });

    response.cookies.set('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0), // 立即过期
        path: '/',
    });

    // 同时清除 Supabase 相关的 cookies
    const supabaseAuthCookies = ['sb-access-token', 'sb-refresh-token'];
    for (const cookieName of supabaseAuthCookies) {
        response.cookies.set(cookieName, '', {
            expires: new Date(0),
            path: '/',
        });
    }

    return response;
}
