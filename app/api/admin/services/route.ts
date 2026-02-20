import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseKey);
}

// GET: 获取全平台服务列表 (Admin)
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // 'pending', 'active', 'closed'
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        let query = supabase
            .from('services')
            .select(`
                *,
                service_categories(id, name),
                users(email, id)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            services: data || [],
            total: count || 0,
            page,
            limit
        });
    } catch (error: any) {
        console.error('Admin services fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: 更新服务状态 (审核操作)
export async function PATCH(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const body = await request.json();
        const { id, status, rejection_reason } = body;

        if (!id || !status) {
            return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('services')
            .update({
                status,
                rejection_reason: rejection_reason || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ service: data });
    } catch (error: any) {
        console.error('Admin services update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
