import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// GET: 获取标准服务分类（只返回 standard_enabled = true 的分类）
export async function GET() {
    try {
        const supabase = await createSupabaseAdminClient();

        const { data, error } = await supabase
            .from('service_categories')
            .select('id, name, icon, sort_order')
            .eq('is_active', true)
            .eq('standard_enabled', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ categories: data || [] });
    } catch (error) {
        console.error('Error fetching service categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
