import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { saveVerificationCode } from '@/lib/supabase/queries';
import { sendVerificationEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
    const supabase = await createSupabaseServerClient();

    try {
        const { type, identifier } = await request.json();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: '未授权' }, { status: 401 });

        if (!identifier) return NextResponse.json({ error: '请提供地址' }, { status: 400 });

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await saveVerificationCode(identifier, code);

        if (type === 'email') {
            await sendVerificationEmail(identifier, code);
        } else {
            console.log(`[MOCK SMS] Sending code ${code} to phone ${identifier}`);
        }

        return NextResponse.json({ success: true, message: '验证码已发送' });
    } catch (error) {
        console.error('Send change code error:', error);
        return NextResponse.json({ error: '发送失败' }, { status: 500 });
    }
}
