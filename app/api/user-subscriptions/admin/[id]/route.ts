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
    { params }: { params: Promise<{ id: string }> }
) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    try {
        const body = await request.json();
        const { remaining_credits, remaining_listings, end_date, status } = body;

        const supabase = await createSupabaseAdminClient();

        const updatePayload: any = {
            updated_at: new Date().toISOString()
        };

        if (remaining_credits !== undefined) updatePayload.remaining_credits = remaining_credits;
        if (remaining_listings !== undefined) updatePayload.remaining_listings = remaining_listings;
        if (end_date) updatePayload.end_date = end_date;
        if (status) updatePayload.status = status;

        const { data, error } = await supabase
            .from('user_subscriptions')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ message: '订阅更新成功', subscription: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
