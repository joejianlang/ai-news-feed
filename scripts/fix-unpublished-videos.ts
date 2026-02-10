
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixVideos() {
    console.log('--- 开始修复未发布的视频 ---');

    // 1. 修复有摘要但没批次时间导致无法发布的视频
    console.log('步骤 1: 正在查找有摘要但缺少批次时间的视频...');

    const { data: stuckVideos, error: fetchError } = await supabase
        .from('news_items')
        .select('id, created_at')
        .eq('content_type', 'video')
        .eq('is_published', false)
        .not('ai_summary', 'is', null);

    if (fetchError) {
        console.error('获取视频失败:', fetchError);
        return;
    }

    if (stuckVideos && stuckVideos.length > 0) {
        console.log(`发现 ${stuckVideos.length} 个“被卡住”的视频。正在批量补充时间并发布...`);

        let successCount = 0;
        for (const video of stuckVideos) {
            const { error: updateError } = await supabase
                .from('news_items')
                .update({
                    batch_completed_at: video.created_at, // 用创建时间补全
                    is_published: true, // 设为发布
                    updated_at: new Date().toISOString()
                })
                .eq('id', video.id);

            if (!updateError) successCount++;
        }
        console.log(`成功发布了 ${successCount} 个视频。`);
    } else {
        console.log('没有发现有摘要但未发布的视频。');
    }

    // 2. 报告那些彻底没摘要的视频（需要 AI 重处理）
    const { data: brokenVideos } = await supabase
        .from('news_items')
        .select('id, title')
        .eq('content_type', 'video')
        .is('ai_summary', null);

    if (brokenVideos && brokenVideos.length > 0) {
        console.log(`\n提示: 仍有 ${brokenVideos.length} 个视频彻底缺少 AI 摘要，建议运行脚本重新处理这些条目。`);
    }
}

fixVideos();
