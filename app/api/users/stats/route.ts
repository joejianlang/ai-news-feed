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

    // Total users
    const { count: total } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    // Active users (not suspended)
    const { count: active } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_suspended', false);

    // Today's new users
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: todayNew } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

    // This month's new users
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count: monthNew } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString());

    return NextResponse.json({
        total: total || 0,
        active: active || 0,
        todayNew: todayNew || 0,
        monthNew: monthNew || 0
    });
}
