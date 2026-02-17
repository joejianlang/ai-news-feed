import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifyToken } from './jwt';

/**
 * 获取当前登录用户（通用版，支持 API Route 和 Server Component）
 */
export async function getAuthUser(request?: NextRequest) {
    // 1. 优先尝试本地业务 Token
    let token: string | undefined;

    if (request) {
        token = request.cookies.get('auth_token')?.value;
    } else {
        const cookieStore = await cookies();
        token = cookieStore.get('auth_token')?.value;
    }

    if (token) {
        const payload = verifyToken(token);
        if (payload) {
            return {
                id: payload.userId,
                email: payload.email,
                username: payload.username,
                source: 'legacy'
            };
        }
    }

    // 2. 如果没有业务 Token，尝试 Supabase 原生 Session
    const supabase = await createSupabaseServerClient();
    const { data: { user: sbUser } } = await supabase.auth.getUser();

    if (sbUser) {
        return {
            id: sbUser.id,
            email: sbUser.email,
            username: (sbUser as any).username || sbUser.email?.split('@')[0] || 'User',
            source: 'supabase'
        };
    }

    return null;
}
