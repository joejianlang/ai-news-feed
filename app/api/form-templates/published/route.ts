import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const templateMode = searchParams.get('template_mode');

    try {
        const supabase = await createSupabaseAdminClient();

        let query = supabase
            .from('form_templates')
            .select('*')
            .eq('status', 'published');

        if (type) query = query.eq('type', type);
        if (templateMode) query = query.eq('template_mode', templateMode);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

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
