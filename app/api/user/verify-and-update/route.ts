import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifyCode } from '@/lib/supabase/queries';

export async function POST(request: NextRequest) {
    const supabase = await createSupabaseServerClient();

    try {
        const { type, identifier, code } = await request.json();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: '未授权' }, { status: 401 });

        const isValid = await verifyCode(identifier, code);
        if (!isValid) return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });

        if (type === 'email') {
            const { error } = await supabase.auth.updateUser({ email: identifier });
            if (error) throw error;
        } else if (type === 'phone') {
            const { error } = await supabase
                .from('users')
                .update({ phone: identifier })
                .eq('id', user.id);
            if (error) throw error;
        }

        return NextResponse.json({ success: true, message: '更新成功' });
    } catch (error) {
        console.error('Verify and update error:', error);
        return NextResponse.json({ error: '验证失败' }, { status: 500 });
    }
}
