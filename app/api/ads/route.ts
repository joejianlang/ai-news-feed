import { NextResponse } from 'next/server';
import { getActiveAds } from '@/lib/supabase/queries';

export async function GET() {
    try {
        const ads = await getActiveAds();
        return NextResponse.json({ ads });
    } catch (error) {
        console.error('Failed to fetch ads:', error);
        return NextResponse.json({ ads: [] }, { status: 500 });
    }
}
