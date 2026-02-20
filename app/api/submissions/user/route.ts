import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/server';

// POST: 用户提交定制服务需求（写入优服佳共享 submissions 表）
// submissions 表字段：id, template_id, user_id, user_name, user_email,
//                     form_data(JSONB), status, assigned_provider_id, notes,
//                     created_at, updated_at
export async function POST(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser) {
        return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdminClient();
        const body = await request.json();

        const {
            templateId,      // form_templates.id
            categoryName,    // 类别名称（冗余记录）
            title,           // 需求标题
            formData,        // 用户填写的字段值 { key: value }
            contactName,
            contactPhone,
        } = body;

        if (!formData) {
            return NextResponse.json({ error: '缺少表单数据' }, { status: 400 });
        }

        // 合并联系信息到 form_data，确保 admin 后台能看到
        const mergedFormData = {
            ...formData,
            ...(contactName && { contact_name: contactName }),
            ...(contactPhone && { contact_phone: contactPhone }),
            ...(title && { _title: title }),
            ...(categoryName && { _category: categoryName }),
        };

        // 查询用户信息
        const { data: userProfile } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', authUser.id)
            .single();

        const { data, error } = await supabase
            .from('submissions')
            .insert({
                template_id: templateId || null,
                user_id: authUser.id,
                user_name: userProfile?.name || contactName || null,
                user_email: userProfile?.email || authUser.email || null,
                form_data: mergedFormData,
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ submission: data });
    } catch (error: any) {
        console.error('Error creating submission:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: 查询当前用户的定制服务提交记录
export async function GET(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser) {
        return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdminClient();
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const { data, error, count } = await supabase
            .from('submissions')
            .select('*', { count: 'exact' })
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return NextResponse.json({ submissions: data || [], total: count || 0, page, limit });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
