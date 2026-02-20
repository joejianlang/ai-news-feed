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

    // Get the sales partner user
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, email, phone, role, created_at')
        .eq('id', id)
        .single();

    if (userError || !user) {
        return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Get sales profile
    const { data: profile } = await supabase
        .from('sales_profiles')
        .select('*')
        .eq('user_id', id)
        .single();

    // Get providers referred by this sales partner
    const { data: referredUsers } = await supabase
        .from('users')
        .select('id, name, email, phone, created_at')
        .eq('referrer_id', id)
        .eq('role', 'provider');

    // For each referred provider, get their order stats
    const providers = await Promise.all((referredUsers || []).map(async (provider: any) => {
        const { data: orders } = await supabase
            .from('orders')
            .select('id, total_amount, status')
            .eq('provider_id', provider.id);

        const orderCount = orders?.length || 0;
        const totalSales = (orders || []).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
        const commissionRate = profile?.commission_rate || 0.1;
        const contribution = totalSales * commissionRate;

        return {
            ...provider,
            stats: {
                order_count: orderCount,
                total_sales: totalSales.toFixed(2),
                contribution: contribution.toFixed(2)
            }
        };
    }));

    return NextResponse.json({
        partner: {
            ...user,
            profile: profile || null
        },
        providers
    });
}
