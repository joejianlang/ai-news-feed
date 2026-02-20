import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
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

export async function GET(request: Request) {
    const authUser = await getAuthUser();
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const supabase = authUser.source === 'legacy'
        ? await createSupabaseAdminClient()
        : await createSupabaseServerClient();

    let query = supabase.from('form_templates').select('*');

    if (type) {
        query = query.eq('type', type);
    }
    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates: data });
}

export async function POST(request: Request) {
    const authUser = await getAuthUser();
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = authUser.source === 'legacy'
        ? await createSupabaseAdminClient()
        : await createSupabaseServerClient();

    const { data, error } = await supabase
        .from('form_templates')
        .insert([{
            ...body,
            created_by: authUser.id
        }])
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: data });
}
