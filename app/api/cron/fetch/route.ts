import { NextResponse } from 'next/server';
import { runFetchPipeline } from '@/lib/services/fetch_service';

// GET - 定时任务触发（通过 cron job 调用）
export async function GET(request: Request) {
  console.log('[Cron] 📥 收到定时抓取请求');

  // 1. 验证认证
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && cronSecret !== 'your-cron-secret' && authHeader !== `Bearer ${cronSecret}`) {
    console.log('[Cron] ❌ 认证失败');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron] ✅ 认证通过，启动流水线...');

  try {
    // 调用统一的流水线服务
    // 该服务现在已经实现了：
    // 1. 先快速抓取所有源（存为草稿，避免超时卡死）
    // 2. 将抓取到的条目打乱（Interleaving，避免内容按源扎堆）
    // 3. 逐条 AI 处理并即时发布（包含分类和地理打标签）
    const stats = await runFetchPipeline();

    return NextResponse.json({
      success: true,
      message: 'Pipeline completed successfully',
      stats
    });

  } catch (error) {
    console.error('[Cron] ❌ 流水线运行失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
