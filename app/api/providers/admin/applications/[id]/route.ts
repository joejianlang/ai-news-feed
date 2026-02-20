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

// 审核服务商申请：通过或拒绝
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
        const { status, reason } = await request.json();
        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: '无效状态' }, { status: 400 });
        }

        const supabase = await createSupabaseAdminClient();

        const updateData: any = {
            status,
            updated_at: new Date().toISOString(),
        };
        if (status === 'rejected' && reason) {
            updateData.rejection_reason = reason;
        }

        const { data, error } = await supabase
            .from('provider_profiles')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 同步更新 users 表的 role 字段
        if (status === 'approved' && data?.user_id) {
            await supabase
                .from('users')
                .update({ role: 'provider' })
                .eq('id', data.user_id);
        }

        return NextResponse.json({ message: status === 'approved' ? '已通过' : '已拒绝', application: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
