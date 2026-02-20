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

    try {
        const supabase = await createSupabaseAdminClient();

        const { data: providers, error } = await supabase
            .from('provider_profiles')
            .select('status');

        if (error) throw error;

        const stats = {
            total: providers.length,
            verified: providers.filter((p: any) => p.status === 'approved').length,
            pending: providers.filter((p: any) => p.status === 'pending').length,
            frozen: providers.filter((p: any) => p.status === 'frozen').length,
        };

        return NextResponse.json({ stats });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
