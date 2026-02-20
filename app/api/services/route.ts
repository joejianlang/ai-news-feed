import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// GET: 获取标准服务列表（来自 provider_services 表，status = approved）
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseAdminClient();
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let query = supabase
            .from('provider_services')
            .select(`
                id, title, description, price, price_unit, category, category_id,
                service_mode, service_city, service_area, images,
                deposit_ratio, duration, advance_booking,
                is_licensed, has_insurance, tax_included,
                cancellation_policy, client_requirements,
                inclusions, exclusions, extra_fees, add_ons,
                status, created_at, updated_at,
                service_identity_id, provider_id
            `, { count: 'exact' })
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        // 过滤掉 base64 图片，只保留 http/https URL
        const services = (data || []).map((s: any) => ({
            ...s,
            images: Array.isArray(s.images)
                ? s.images.filter((img: string) => typeof img === 'string' && img.startsWith('http'))
                : [],
            // 前端 ServiceCard 使用的字段别名
            service_categories: { name: s.category || '其他' },
        }));

        return NextResponse.json({
            services,
            total: count || 0,
            page,
            limit,
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}

// POST: 服务商发布新标准服务（draft 状态，待管理员审核）
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseAdminClient();
        const body = await request.json();

        const { userId, categoryId, category, title, description, price, priceUnit, serviceMode, serviceCity, images } = body;

        if (!title || !categoryId) {
            return NextResponse.json({ error: '标题和分类必填' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('provider_services')
            .insert({
                provider_id: userId,
                category_id: categoryId,
                category: category || '',
                title,
                description,
                price,
                price_unit: priceUnit || 'per_service',
                service_mode: serviceMode || 'offline',
                service_city: serviceCity || '',
                images: images || [],
                status: 'draft',
            })
            .select('id, title, status')
            .single();

        if (error) throw error;

        return NextResponse.json({ service: data });
    } catch (error) {
        console.error('Error creating service:', error);
        return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }
}
