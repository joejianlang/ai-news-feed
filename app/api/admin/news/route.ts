import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
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
    const categoryId = searchParams.get('categoryId') || '';
    const status = searchParams.get('status'); // 'published', 'draft'

    const supabase = await createSupabaseAdminClient();
    let query = supabase
        .from('news_items')
        .select('*, source:news_sources(*), categories(*)', { count: 'exact' });

    if (keyword) {
        query = query.ilike('title', `%${keyword}%`);
    }
    if (categoryId) {
        query = query.eq('category_id', categoryId);
    }
    if (status === 'published') {
        query = query.eq('is_published', true);
    } else if (status === 'draft') {
        query = query.eq('is_published', false);
    }

    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * size, page * size - 1);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        items: data,
        total: count || 0,
        page,
        size
    });
}

export async function PATCH(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, ...updates } = await request.json();
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const supabase = await createSupabaseAdminClient();
        const { data, error } = await supabase
            .from('news_items')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ item: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const supabase = await createSupabaseAdminClient();
    const { error } = await supabase
        .from('news_items')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Deleted successfully' });
}
