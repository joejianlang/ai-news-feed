import { NextResponse } from 'next/server';
import { getSystemSetting } from '@/lib/supabase/queries';

export async function GET() {
    try {
        const pricing = await getSystemSetting('ad_pricing');

        // Default pricing if not found in DB
        const defaultPricing = {
            scope: { local: 50, city: 100, province: 200, national: 500 },
            duration: { '1': 10, '3': 25, '7': 50, '14': 80, '30': 150 }
        };

        return NextResponse.json({
            pricing: pricing || defaultPricing
        });
    } catch (error) {
        console.error('获取广告配置失败:', error);
        return NextResponse.json(
            { error: '获取广告配置失败' },
            { status: 500 }
        );
    }
}
