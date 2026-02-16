import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const supabase = await createSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    try {
        let query = supabase.from('system_settings').select('key, value');

        if (key) {
            query = query.eq('key', key);
        } else {
            // Default: get all agreement related keys
            query = query.like('key', 'agreement_%');
        }

        const { data, error } = await query;

        if (error) throw error;

        const agreements: Record<string, any> = {};
        data?.forEach(item => {
            agreements[item.key] = item.value;
        });

        return NextResponse.json(agreements);
    } catch (error) {
        console.error('Error fetching agreements:', error);
        return NextResponse.json({ error: 'Failed to fetch agreements' }, { status: 500 });
    }
}
