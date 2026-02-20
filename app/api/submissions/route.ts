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
    const templateId = searchParams.get('templateId');

    const supabase = await createSupabaseAdminClient();
    let query = supabase
        .from('orders')
        .select(`
            id, order_no, service_title, service_description, service_type,
            status, total_amount, deposit_amount, currency,
            user_note, created_at, updated_at, user_id, provider_id,
            service_listing_id, submission_id, provider_response_status,
            user:users!user_id(id, name, email, username)
        `, { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (templateId) query = query.eq('service_listing_id', templateId);

    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * size, page * size - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Normalize order status to frontend-expected values
    const normalizeStatus = (status: string) => {
        const map: Record<string, string> = {
            auth_hold: 'pending',
            pending: 'pending',
            confirmed: 'assigned',
            assigned: 'assigned',
            in_progress: 'in_progress',
            completed: 'completed',
            cancelled: 'cancelled',
            refunded: 'cancelled'
        };
        return map[status] || status;
    };

    // Map orders to the format the frontend expects
    const submissions = (data || []).map((order: any) => ({
        id: order.id,
        order_no: order.order_no,
        status: normalizeStatus(order.status),
        created_at: order.created_at,
        updated_at: order.updated_at,
        user_id: order.user_id,
        provider_id: order.provider_id,
        assigned_provider_id: order.provider_id,
        user_name: order.user?.name || order.user?.email || '未知用户',
        user_email: order.user?.email || '',
        form_templates: {
            name: order.service_title || order.service_type || '未知服务',
            type: order.service_type
        },
        form_data: {
            _order_no: order.order_no,
            service_title: order.service_title,
            service_description: order.service_description,
            total_amount: order.total_amount,
            deposit_amount: order.deposit_amount,
            currency: order.currency,
            user_note: order.user_note
        }
    }));

    return NextResponse.json({
        submissions,
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
        const { id, status, feedback, assignedProviderId } = await request.json();
        const supabase = await createSupabaseAdminClient();

        const updatePayload: any = {
            status,
            updated_at: new Date().toISOString()
        };

        if (assignedProviderId) {
            updatePayload.provider_id = assignedProviderId;
        }

        const { data, error } = await supabase
            .from('orders')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ message: 'Status updated successfully', submission: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
