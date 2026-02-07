import { NextRequest, NextResponse } from 'next/server';
import { saveVerificationCode } from '@/lib/supabase/queries';
import { sendVerificationEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: '请提供邮箱地址' }, { status: 400 });
        }

        // 生成 6 位随机验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // 保存到数据库
        await saveVerificationCode(email, code);

        // 发送邮件
        await sendVerificationEmail(email, code);

        return NextResponse.json({ success: true, message: '验证码已发送' });
    } catch (error) {
        console.error('发送验证码失败:', error);
        return NextResponse.json({ error: '发送验证码失败' }, { status: 500 });
    }
}
