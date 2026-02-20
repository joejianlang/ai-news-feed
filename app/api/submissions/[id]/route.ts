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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
        .from('orders')
        .select(`
            id, order_no, service_title, service_description, service_type,
            status, total_amount, deposit_amount, currency,
            user_note, created_at, updated_at, user_id, provider_id,
            service_listing_id, submission_id, provider_response_status,
            user:users!user_id(id, name, email, username)
        `)
        .eq('id', id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const submission = {
        id: data.id,
        order_no: data.order_no,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id,
        provider_id: data.provider_id,
        assigned_provider_id: data.provider_id,
        user_name: (Array.isArray(data.user) ? data.user[0]?.name || data.user[0]?.email : (data.user as any)?.name || (data.user as any)?.email) || '未知用户',
        user_email: (Array.isArray(data.user) ? data.user[0]?.email : (data.user as any)?.email) || '',
        form_templates: {
            name: data.service_title || data.service_type || '未知服务',
            type: data.service_type
        },
        form_data: {
            _order_no: data.order_no,
            service_title: data.service_title,
            service_description: data.service_description,
            total_amount: data.total_amount,
            deposit_amount: data.deposit_amount,
            currency: data.currency,
            user_note: data.user_note
        }
    };

    return NextResponse.json({ submission });
}
