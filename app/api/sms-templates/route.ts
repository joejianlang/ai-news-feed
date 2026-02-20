import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ templates: data || [] });
}
