import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function checkAdmin(authUser: any) {
    const supabase = authUser.source === 'legacy'
        ? await createSupabaseAdminClient()
        : await createSupabaseServerClient();
    const { data } = await supabase.from('users').select('role').eq('id', authUser.id).single();
    return data?.role === 'admin';
}

export async function PUT(
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
        const supabase = await createSupabaseAdminClient();

        // Only allow updating name, content, description (not key)
        const updateData: any = {
            updated_at: new Date().toISOString(),
        };
        if (body.name !== undefined) updateData.name = body.name;
        if (body.content !== undefined) updateData.content = body.content;
        if (body.description !== undefined) updateData.description = body.description;

        const { data, error } = await supabase
            .from('sms_templates')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ message: '更新成功', template: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
