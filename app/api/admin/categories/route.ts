import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, checkAdmin } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// GET — 获取所有服务分类（service_categories 表，含全部字段供管理端使用）
export async function GET(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser.id))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdminClient();
        const { data, error } = await supabase
            .from('service_categories')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return NextResponse.json({ categories: data || [] });
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — 新建服务分类
export async function POST(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser.id))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdminClient();
        const body = await request.json();
        const { name, icon, description, sort_order, is_active, parent_id, standard_enabled, custom_enabled, quote_credit_cost } = body;

        const { data, error } = await supabase
            .from('service_categories')
            .insert({
                name,
                icon: icon || 'grid',
                description: description || null,
                sort_order: sort_order ?? 100,
                is_active: is_active ?? true,
                parent_id: parent_id || null,
                standard_enabled: standard_enabled ?? false,
                custom_enabled: custom_enabled ?? true,
                quote_credit_cost: quote_credit_cost ?? 0,
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error creating category:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — 更新服务分类
export async function PUT(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser.id))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdminClient();
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { data, error } = await supabase
            .from('service_categories')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error updating category:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — 删除服务分类
export async function DELETE(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser.id))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdminClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { error } = await supabase
            .from('service_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting category:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
