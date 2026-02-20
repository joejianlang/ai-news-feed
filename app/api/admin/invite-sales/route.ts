import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/server';

async function checkAdmin(userId: string): Promise<boolean> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
    return data?.role === 'admin';
}

export async function POST(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser.id))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let contact: string;
    try {
        const body = await request.json();
        contact = body.contact;
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!contact) {
        return NextResponse.json({ error: '联系方式不能为空' }, { status: 400 });
    }

    // Generate a unique invite token
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 20);

    const supabase = await createSupabaseAdminClient();

    // Persist the invite token so the registration page can read it
    const { error: insertError } = await supabase
        .from('sales_invites')
        .insert({
            token,
            contact,
            created_by: authUser.id,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        });

    if (insertError) {
        // Table may not exist yet — return link anyway so admin can still use it
        console.warn('sales_invites insert failed (table may not exist):', insertError.message);
    }

    // Build the invite link pointing to the main app registration page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${baseUrl}/register?role=sales&invite=${token}&contact=${encodeURIComponent(contact)}`;

    return NextResponse.json({ message: '邀请链接已生成', link });
}
