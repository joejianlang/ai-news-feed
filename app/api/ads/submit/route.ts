import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { createAd } from '@/lib/supabase/queries';

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = verifyToken(token);
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const adData = await request.json();

        // Force security override
        const finalAd = {
            ...adData,
            user_id: payload.userId, // Ensure user ID matches token
            status: 'pending',
            payment_status: 'unpaid', // Must be unpaid when first submitted for approval
            created_at: new Date().toISOString()
        };

        const result = await createAd(finalAd);

        return NextResponse.json({ success: true, ad: result });
    } catch (error) {
        console.error('Failed to create ad via API:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
