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

        // 查询 provider_profiles（服务商入驻申请），关联 users 表获取申请人信息
        const { data, error } = await supabase
            .from('provider_profiles')
            .select(`
                id,
                company_name,
                description,
                status,
                service_categories,
                rejection_reason,
                business_scope,
                license_url,
                extra_data,
                created_at,
                updated_at,
                user_id,
                user:users!user_id(id, name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map to expected application format
        const applications = (data || []).map((p: any) => ({
            id: p.id,
            created_at: p.created_at,
            updated_at: p.updated_at,
            status: p.status,
            category: Array.isArray(p.service_categories)
                ? p.service_categories.join(', ')
                : (p.service_categories || '-'),
            reason: p.description || p.business_scope || '',
            user: p.user
                ? { id: p.user.id, name: p.user.name || p.company_name, email: p.user.email }
                : { id: p.user_id, name: p.company_name || '-', email: '' },
            company_name: p.company_name,
            rejection_reason: p.rejection_reason,
            extra_data: p.extra_data,
            license_url: p.license_url,
        }));

        return NextResponse.json({ applications });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
