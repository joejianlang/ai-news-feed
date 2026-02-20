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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const size = parseInt(searchParams.get('size') || '20');

    try {
        const supabase = await createSupabaseAdminClient();

        let query = supabase
            .from('provider_services')
            .select(`
                id,
                service_identity_id,
                title,
                description,
                price,
                price_unit,
                deposit_ratio,
                service_mode,
                images,
                status,
                category,
                created_at,
                updated_at,
                provider_id,
                form_data,
                user:users!provider_id(id, email, username, name)
            `, { count: 'exact' });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range((page - 1) * size, page * size - 1);

        if (error) throw error;

        // Map to the format the frontend expects
        const submissions = (data || []).map((service: any) => ({
            id: service.id,
            service_identity_id: service.service_identity_id,
            serviceIdentityId: service.service_identity_id,
            status: service.status,
            listing_status: service.status,
            created_at: service.created_at,
            updated_at: service.updated_at,
            provider_id: service.provider_id,
            user: service.user
                ? { id: service.user.id, name: service.user.name || service.user.username || service.user.email, email: service.user.email }
                : { id: service.provider_id, name: '-', email: '' },
            category: service.category || null,
            form_data: {
                title: service.title,
                description: service.description,
                price: service.price,
                price_unit: service.price_unit,
                deposit_ratio: service.deposit_ratio,
                service_mode: service.service_mode,
                images: service.images || [],
                ...(service.form_data || {}),
            },
            title: service.title,
            source: 'provider_services',
        }));

        return NextResponse.json({
            submissions,
            total: count,
            page,
            size
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
