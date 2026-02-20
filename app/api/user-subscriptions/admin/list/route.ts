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
    const status = searchParams.get('status') || '';

    const supabase = await createSupabaseAdminClient();

    let query = supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);

    const { data: subs, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * size, page * size - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (!subs || subs.length === 0) {
        return NextResponse.json({ subscriptions: [], total: 0 });
    }

    // Get user info for all subscriptions
    const userIds = [...new Set(subs.map((s: any) => s.user_id))];
    const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

    const userMap: Record<string, any> = {};
    (users || []).forEach((u: any) => { userMap[u.id] = u; });

    // Get plan details for all subscriptions
    const planIds = [...new Set(subs.map((s: any) => s.plan_id).filter(Boolean))];
    const { data: plans } = await supabase
        .from('subscription_plans')
        .select('id, name, tier, included_credits, included_standard_listings')
        .in('id', planIds);

    const planMap: Record<string, any> = {};
    (plans || []).forEach((p: any) => { planMap[p.id] = p; });

    // Get provider names (providers are users with role=provider)
    const providerIds = userIds.filter((id: string) => {
        const user = userMap[id];
        return user?.role === 'provider';
    });
    const { data: providerProfiles } = providerIds.length > 0 ? await supabase
        .from('provider_profiles')
        .select('user_id, company_name')
        .in('user_id', providerIds) : { data: [] };

    const providerNameMap: Record<string, string> = {};
    (providerProfiles || []).forEach((p: any) => {
        providerNameMap[p.user_id] = p.company_name;
    });

    const subscriptions = subs.map((sub: any) => {
        const user = userMap[sub.user_id] || {};
        const plan = planMap[sub.plan_id] || {};
        return {
            ...sub,
            user_email: user.email || '未知',
            user_name: user.name || '未知',
            provider_name: providerNameMap[sub.user_id] || null,
            plan_name: plan.name || '未知套餐',
            plan_tier: plan.tier || 'basic',
            included_credits: plan.included_credits ?? sub.remaining_credits,
            included_standard_listings: plan.included_standard_listings ?? sub.remaining_listings
        };
    });

    return NextResponse.json({ subscriptions, total: count || 0 });
}
