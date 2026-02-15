import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
    const supabase = await createSupabaseAdminClient();

    try {
        const { display_name, avatar_url, bio } = await request.json();
        const user = await getAuthUser(request);

        if (!user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const { error: updateError } = await supabase
            .from('users')
            .update({
                display_name,
                avatar_url,
                bio,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, message: '个人资料已更新' });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: '更新失败' }, { status: 500 });
    }
}
