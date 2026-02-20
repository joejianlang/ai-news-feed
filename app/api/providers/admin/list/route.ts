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
    const keyword = searchParams.get('keyword');

    const supabase = await createSupabaseAdminClient();

    // Query provider_profiles joined with users
    let query = supabase
        .from('provider_profiles')
        .select(`
            id, user_id, company_name, status, service_categories,
            service_city, description, created_at,
            user:users!user_id(id, name, email, phone, credits, avatar_url, created_at, is_suspended)
        `, { count: 'exact' });

    if (status) {
        query = query.eq('status', status);
    }

    if (keyword) {
        query = query.or(`company_name.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * size, page * size - 1);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get order counts per provider
    const userIds = (data || []).map((p: any) => p.user_id).filter(Boolean);
    const { data: orderCounts } = userIds.length > 0 ? await supabase
        .from('orders')
        .select('provider_id')
        .in('provider_id', userIds)
        .eq('status', 'completed') : { data: [] };

    const orderCountMap: Record<string, number> = {};
    (orderCounts || []).forEach((o: any) => {
        if (o.provider_id) orderCountMap[o.provider_id] = (orderCountMap[o.provider_id] || 0) + 1;
    });

    // Map to frontend expected format
    const providers = (data || []).map((p: any) => ({
        id: p.user_id,           // frontend uses row.id for credit/verify operations
        profileId: p.id,
        name: p.user?.name || p.company_name || '未知',
        email: p.user?.email || '',
        phone: p.user?.phone || '-',
        avatar: p.user?.avatar_url || '',
        category: Array.isArray(p.service_categories) ? p.service_categories.join(', ') : (p.service_categories || '-'),
        credits: p.user?.credits || 0,
        rating: 5.0,             // rating not stored yet, default to 5
        orders: orderCountMap[p.user_id] || 0,
        joinDate: p.created_at ? new Date(p.created_at).toLocaleDateString() : '-',
        status: p.status || 'pending',
        statusText: p.status === 'approved' ? '已认证' : p.status === 'pending' ? '待审核' : p.status === 'frozen' ? '已冻结' : p.status,
        city: p.service_city || '-'
    }));

    return NextResponse.json({
        providers,
        total: count || 0,
        page,
        size
    });
}
