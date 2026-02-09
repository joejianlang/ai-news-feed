import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 延迟初始化 Supabase
function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseKey);
}

// GET: 获取服务列表
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let query = supabase
            .from('services')
            .select(`
        *,
        service_categories(id, name, name_en, icon),
        users:user_id(email)
      `, { count: 'exact' })
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            services: data || [],
            total: count || 0,
            page,
            limit
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}

// POST: 创建新服务
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const body = await request.json();

        const {
            userId,
            categoryId,
            title,
            description,
            price,
            priceUnit,
            location,
            contactName,
            contactPhone,
            contactWechat,
            images
        } = body;

        if (!title || !categoryId) {
            return NextResponse.json({ error: '标题和分类必填' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('services')
            .insert({
                user_id: userId,
                category_id: categoryId,
                title,
                description,
                price,
                price_unit: priceUnit || '月',
                location,
                contact_name: contactName,
                contact_phone: contactPhone,
                contact_wechat: contactWechat,
                images: images || []
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ service: data });
    } catch (error) {
        console.error('Error creating service:', error);
        return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }
}
