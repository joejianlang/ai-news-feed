import { NextResponse } from 'next/server';
import { runDeepDivePipeline } from '@/lib/services/deep_dive';

export async function GET() {
    try {
        const stats = await runDeepDivePipeline();

        return NextResponse.json({
            success: true,
            message: '深度增强完成',
            ...stats
        });

    } catch (error) {
        console.error('深度增强失败:', error);
        return NextResponse.json(
            { success: false, error: '深度增强失败' },
            { status: 500 }
        );
    }
}
