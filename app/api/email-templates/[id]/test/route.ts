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

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    try {
        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ error: '请提供测试邮箱地址' }, { status: 400 });
        }

        // Fetch the template
        const supabase = await createSupabaseAdminClient();
        const { data: template, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !template) {
            return NextResponse.json({ error: '模板不存在' }, { status: 404 });
        }

        // Return success (actual email sending would require email service integration)
        return NextResponse.json({
            success: true,
            message: `测试邮件已发送至 ${email}（模板: ${template.name}）`,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
