import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/adminAuth';
import { getFailoverStatus, resetFailoverStatus } from '@/lib/ai';

// GET - 获取 AI 健康状态（仅管理员）
export async function GET() {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const status = getFailoverStatus();
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      services: status,
    });
  } catch (error) {
    console.error('Failed to get AI health status:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}

// POST - 重置故障计数（仅管理员）
export async function POST(request: Request) {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { provider } = body;

    if (provider && provider !== 'gemini' && provider !== 'claude') {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    resetFailoverStatus(provider);

    return NextResponse.json({
      success: true,
      message: provider
        ? `${provider} 故障计数已重置`
        : '所有 AI 故障计数已重置',
    });
  } catch (error) {
    console.error('Failed to reset failover status:', error);
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
  }
}
