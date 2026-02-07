import { NextResponse } from 'next/server';
import { runClassificationPipeline } from '@/lib/services/classify';

export async function GET() {
    try {
        const stats = await runClassificationPipeline();

        return NextResponse.json({
            success: true,
            message: `分类完成`,
            ...stats
        });

    } catch (error) {
        console.error('分类失败:', error);
        return NextResponse.json(
            { success: false, error: '分类失败' },
            { status: 500 }
        );
    }
}
