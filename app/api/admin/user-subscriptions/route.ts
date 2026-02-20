import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/server';

async function checkAdmin(authUser: any) {
    const supabase = authUser.source === 'legacy'
        ? await createSupabaseAdminClient()
        : await createSupabaseServerClient();

    const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();

    return userProfile?.role === 'admin';
}

export async function GET(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const size = parseInt(searchParams.get('size') || '20');

    const supabase = await createSupabaseAdminClient();
    const { data, count, error } = await supabase
        .from('user_subscriptions')
        .select('*, user:users(username, email)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * size, page * size - 1);

    if (error) {
        if (error.code === '42P01') return NextResponse.json({ subscriptions: [], total: 0 });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        subscriptions: data,
        total: count || 0,
        page,
        size
    });
}
