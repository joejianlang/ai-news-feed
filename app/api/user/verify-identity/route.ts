import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPhoneCode } from '@/lib/supabase/queries';

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
}

// POST - 提交身份核实信息
export async function POST(request: NextRequest) {
    try {
        const { userId, realName, idCardNumber, idCardScanUrl, phone, smsCode } = await request.json();

        if (!userId || !realName || !idCardNumber || !idCardScanUrl || !phone || !smsCode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. 验证短信验证码 (使用数据库校验)
        const isCodeValid = await verifyPhoneCode(phone, smsCode);

        if (!isCodeValid) {
            return NextResponse.json({ error: 'Invalid or expired SMS code' }, { status: 400 });
        }

        // 2. 更新用户信息
        const { error } = await getSupabaseAdmin()
            .from('users')
            .update({
                real_name: realName,
                id_card_number: idCardNumber,
                id_card_scan_url: idCardScanUrl,
                phone: phone,
                is_verified: true,
                phone_verified: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error verifying identity:', error);
        return NextResponse.json({ error: 'Failed to verify identity' }, { status: 500 });
    }
}
