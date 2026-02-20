import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const templateMode = searchParams.get('template_mode');

    try {
        const supabase = await createSupabaseAdminClient();

        let query = supabase.from('form_templates').select('*');

        if (type) query = query.eq('type', type);
        if (status) query = query.eq('status', status);
        if (templateMode) query = query.eq('template_mode', templateMode);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Add computed fields for frontend
        const templates = (data || []).map((t: any) => ({
            ...t,
            fieldsCount: t.steps
                ? (t.steps as any[]).reduce((sum: number, s: any) => sum + (s.fields?.length || 0), 0)
                : 0,
            stepsCount: t.steps ? (t.steps as any[]).length : 0,
            updatedAt: t.updated_at
                ? new Date(t.updated_at).toLocaleDateString('zh-CN')
                : '-',
        }));

        return NextResponse.json({ templates });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const supabase = await createSupabaseAdminClient();

        const { data, error } = await supabase
            .from('form_templates')
            .insert([{ ...body, created_by: authUser.id }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ message: '创建成功', template: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
