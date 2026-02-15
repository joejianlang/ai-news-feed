import { NextRequest } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { verifyToken } from './jwt';

export async function getAuthUser(request: NextRequest) {
    // 1. Try Supabase Session
    const supabase = await createSupabaseServerClient();
    const { data: { user: sbUser } } = await supabase.auth.getUser();

    if (sbUser) {
        // Find user in public.users by email to get their local ID
        // Use Admin client to bypass RLS and ensure we find the record
        const adminClient = await createSupabaseAdminClient();
        const { data: publicUser, error } = await adminClient
            .from('users')
            .select('id, email, username')
            .eq('email', sbUser.email)
            .single();

        if (publicUser) {
            return {
                id: publicUser.id,
                email: publicUser.email,
                username: publicUser.username,
                source: 'supabase'
            };
        }

        // If not found in public.users, return the SB ID but mark source
        // This acts as a fallback if the callback didn't finish creation
        return {
            id: sbUser.id,
            email: sbUser.email,
            source: 'supabase_incomplete'
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
