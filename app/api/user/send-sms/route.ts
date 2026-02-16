import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { savePhoneVerificationCode } from '@/lib/supabase/queries';

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID || '',
    process.env.TWILIO_AUTH_TOKEN || ''
);

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        // 1. 生成 6 位随机验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. 将验证码存入数据库 (10分钟有效期)
        await savePhoneVerificationCode(phone, code);

        // 3. 调用 Twilio 发送真实短信
        // 确保手机号包含 +1 (如果是加拿大/北美)
        const targetPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;

        await client.messages.create({
            body: `【AI News】您身份核实的验证码为：${code}，请于10分钟内输入。`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: targetPhone
        });

        console.log(`[SMS] Verification code ${code} sent to ${targetPhone}`);

        return NextResponse.json({
            success: true,
            message: '验证码已通过 Twilio 发送'
        });
    } catch (error: any) {
        console.error('Error sending SMS via Twilio:', error);
        return NextResponse.json({
            error: '发送失败，请确认号码格式及环境变量配置',
            details: error.message
        }, { status: 500 });
    }
}
