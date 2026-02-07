import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/adminAuth';
import { runFetchPipeline } from '@/lib/services/fetch_service';

// POST - 手动触发抓取（仅管理员）
export async function POST(request: Request) {
  // 验证管理员权限
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
  }

  try {
    const { sourceId } = await request.json();

    const result = await runFetchPipeline(sourceId);

    // 自动运行后续流水线（分类 -> 深度分析）
    (async () => {
      try {
        console.log('🔗 启动自动分类流水线...');
        const { runClassificationPipeline } = await import('@/lib/services/classify');
        await runClassificationPipeline();

        console.log('🔗 启动深度分析流水线...');
        const { runDeepDivePipeline } = await import('@/lib/services/deep_dive');
        await runDeepDivePipeline();

        console.log('✅ 全自动流水线执行完毕');
      } catch (pipelineError) {
        console.error('❌ 流水线执行出错:', pipelineError);
      }
    })();

    return NextResponse.json({
      message: '抓取完成，后台流水线已启动',
      ...result
    });
  } catch (error) {
    console.error('Error in fetch API:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

// GET - 定时任务触发（通过cron job调用）
export async function GET(request: Request) {
  // 验证cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 执行抓取逻辑
  return POST(request);
}
