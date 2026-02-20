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
        const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .eq('key', 'platform_fee_percent')
            .single();

        if (error) {
            if (error.code === 'PGRST116') return NextResponse.json({ platform_fee_percent: 10 });
            throw error;
        }

        return NextResponse.json({ platform_fee_percent: parseFloat(data.value) });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { platform_fee_percent } = await request.json();
        const supabase = await createSupabaseAdminClient();

        const { error } = await supabase
            .from('system_settings')
            .upsert({
                key: 'platform_fee_percent',
                value: platform_fee_percent.toString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) throw error;
        return NextResponse.json({ message: 'Settings updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
