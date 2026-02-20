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
    const status = searchParams.get('status');

    const supabase = await createSupabaseAdminClient();

    // 查询服务上架申请 (假设在 form_submissions 表中，template_type 为 'listing_application')
    let query = supabase
        .from('form_submissions')
        .select('*, template:form_templates!inner(type)', { count: 'exact' })
        .eq('template.type', 'listing_application');

    if (status) {
        query = query.eq('status', status);
    }

    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * size, page * size - 1);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        submissions: data,
        total: count || 0,
        page,
        size
    });
}
