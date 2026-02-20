import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const supabase = await createSupabaseAdminClient();

        const { data, error } = await supabase
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
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: '服务不存在' }, { status: 404 });

        const service = {
            ...data,
            images: Array.isArray(data.images)
                ? (data.images as string[]).filter((img: string) => typeof img === 'string' && img.startsWith('http'))
                : [],
            service_categories: { name: (data as any).category || '其他' },
        };

        // 查询服务商信息
        let provider = null;
        if (data.provider_id) {
            const { data: providerData } = await supabase
                .from('users')
                .select('id, name, email, avatar_url')
                .eq('id', data.provider_id)
                .single();
            provider = providerData;
        }

        return NextResponse.json({ service, provider });
    } catch (error: any) {
        console.error('Error fetching service:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
