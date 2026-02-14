import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    const supabase = await createSupabaseServerClient();

    try {
        const { password } = await request.json();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: '密码修改成功' });
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ error: '修改失败' }, { status: 500 });
    }
}
