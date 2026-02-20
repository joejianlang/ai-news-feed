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

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    try {
        const { status, reason } = await request.json();
        const supabase = await createSupabaseAdminClient();

        // 1. 更新 providers 表的状态
        const { error: providerError } = await supabase
            .from('providers')
            .update({
                status,
                rejection_reason: reason,
                verified_at: status === 'approved' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (providerError) throw providerError;

        // 2. 如果审核通过，更新 users 表的 role 为 'provider'
        if (status === 'approved') {
            const { error: userError } = await supabase
                .from('users')
                .update({ role: 'provider' })
                .eq('id', userId);

            if (userError) throw userError;
        }

        return NextResponse.json({ message: `Provider ${status} successfully` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
