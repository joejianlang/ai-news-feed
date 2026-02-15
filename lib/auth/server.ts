import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifyToken } from './jwt';

export async function getAuthUser(request: NextRequest) {
    // 1. 优先尝试本地业务 Token (最可靠的业务身份)
    // 这是为了确保 Google 登录用户始终能拿到与其业务数据(广告、个人资料)匹配的本地 UUID
    const token = request.cookies.get('auth_token')?.value;
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
            source: 'supabase'
        };
    }

    return null;
}
