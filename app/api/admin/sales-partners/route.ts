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

    const supabase = await createSupabaseAdminClient();

    // Get all sales users
    const { data: salesUsers, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, phone, role, created_at')
        .eq('role', 'sales')
        .order('created_at', { ascending: false });

    if (usersError) {
        return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!salesUsers || salesUsers.length === 0) {
        return NextResponse.json({ partners: [] });
    }

    // Get sales profiles for these users
    const userIds = salesUsers.map((u: any) => u.id);
    const { data: salesProfiles } = await supabase
        .from('sales_profiles')
        .select('*')
        .in('user_id', userIds);

    const profileMap: Record<string, any> = {};
    (salesProfiles || []).forEach((p: any) => {
        profileMap[p.user_id] = p;
    });

    // Count providers referred by each sales partner
    const { data: referredProviders } = await supabase
        .from('users')
        .select('id, referrer_id')
        .eq('role', 'provider')
        .in('referrer_id', userIds);

    const providerCountMap: Record<string, number> = {};
    (referredProviders || []).forEach((u: any) => {
        if (u.referrer_id) {
            providerCountMap[u.referrer_id] = (providerCountMap[u.referrer_id] || 0) + 1;
        }
    });

    const partners = salesUsers.map((user: any) => ({
        ...user,
        profile: profileMap[user.id] || null,
        provider_count: providerCountMap[user.id] || 0
    }));

    return NextResponse.json({ partners });
}
