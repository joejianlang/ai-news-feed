import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
}
