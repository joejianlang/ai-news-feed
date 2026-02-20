import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function checkAdmin(authUser: any) {
    const supabase = authUser.source === 'legacy'
        ? await createSupabaseAdminClient()
        : await createSupabaseServerClient();
    const { data } = await supabase.from('users').select('role').eq('id', authUser.id).single();
    return data?.role === 'admin';
}

export async function GET(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || 'all';

    const supabase = await createSupabaseAdminClient();
    let query = supabase
        .from('cms_articles')
        .select('*', { count: 'exact' })
        .order('updated_at', { ascending: false });

    if (type) {
        query = query.eq('type', type);
    }
    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    const { data, count, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ articles: data || [], total: count || 0 });
}

export async function POST(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const supabase = await createSupabaseAdminClient();
        const { data, error } = await supabase
            .from('cms_articles')
            .insert({
                ...body,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ article: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
