import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// GET: 获取标准服务分类（共用优服佳数据库 service_categories 表）
export async function GET() {
    try {
        const supabase = await createSupabaseAdminClient();

        // 优先只取 is_active=true 的分类（standard_enabled 字段可能不存在，不强制过滤）
        let { data, error } = await supabase
            .from('service_categories')
            .select('id, name, name_en, icon, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        // 如果报错（字段不存在等），降级为不加过滤
        if (error) {
            console.warn('service_categories filtered query failed, falling back:', error.message);
            const fallback = await supabase
                .from('service_categories')
                .select('id, name, name_en, icon, sort_order')
                .order('sort_order', { ascending: true });
            data = fallback.data;
            if (fallback.error) throw fallback.error;
        }

        return NextResponse.json({ categories: data || [] });
    } catch (error) {
        console.error('Error fetching service categories:', error);
        return NextResponse.json({ categories: [], error: 'Failed to fetch categories' });
    }
}
