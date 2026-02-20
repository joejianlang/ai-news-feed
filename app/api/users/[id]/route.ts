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
    try {
        const supabase = await createSupabaseAdminClient();

        // Get user basic info
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, phone, role, status, avatar_url, last_login, created_at, is_suspended, credits, wallet_balance, member_id')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Get provider profile if applicable
        const { data: providerProfile } = await supabase
            .from('provider_profiles')
            .select('*')
            .eq('user_id', id)
            .maybeSingle();

        // Get recent orders
        const { data: recentOrders } = await supabase
            .from('orders')
            .select('id, order_no, service_title, status, total_amount, created_at')
            .eq('user_id', id)
            .order('created_at', { ascending: false })
            .limit(10);

        return NextResponse.json({
            user: {
                ...user,
                status: user.is_suspended ? 'disabled' : 'active',
                provider_profile: providerProfile || null,
                recent_orders: recentOrders || []
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
