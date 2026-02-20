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
    const keyword = searchParams.get('keyword') || '';
    const status = searchParams.get('status') || '';
    const role = searchParams.get('role') || '';

    const supabase = await createSupabaseAdminClient();

    let query = supabase
        .from('users')
        .select('id, name, email, phone, role, status, avatar_url, last_login, created_at, is_suspended', { count: 'exact' });

    if (role) query = query.eq('role', role);
    if (status === 'active') query = query.eq('is_suspended', false);
    if (status === 'disabled') query = query.eq('is_suspended', true);
    if (keyword) {
        query = query.or(`name.ilike.%${keyword}%,email.ilike.%${keyword}%,phone.ilike.%${keyword}%`);
    }

    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * size, page * size - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Normalize status field
    const users = (data || []).map((u: any) => ({
        ...u,
        status: u.is_suspended ? 'disabled' : 'active'
    }));

    return NextResponse.json({
        users,
        total: count || 0,
        page,
        size
    });
}
