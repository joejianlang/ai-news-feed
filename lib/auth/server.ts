import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifyToken } from './jwt';

export async function getAuthUser(request: NextRequest) {
    // 1. Try Supabase Session
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        return {
            id: user.id,
            email: user.email,
            source: 'supabase'
        };
    }

    // 2. Try Legacy Token
    const token = request.cookies.get('auth_token')?.value;
    if (token) {
        const payload = verifyToken(token);
        if (payload) {
            return {
                id: payload.userId,
                email: payload.email,
                source: 'legacy'
            };
        }
    }

    return null;
}
