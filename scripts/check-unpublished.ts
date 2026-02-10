
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUnpublishedVideos() {
    console.log('--- 正在查询未发布的视频 ---');

    const { data, error } = await supabase
        .from('news_items')
        .select('id, title, original_url, ai_summary, batch_completed_at, is_published, created_at')
        .eq('content_type', 'video')
        .eq('is_published', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('查询出错:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('没有发现未发布的视频。');
        return;
    }

    console.log(`共发现 ${data.length} 个未发布的视频：\n`);

    const summary = {
        missingSummary: 0,
        missingBatchTime: 0,
        manualDraft: 0
    };

    data.forEach((item, index) => {
        let reasons = [];
        if (!item.ai_summary) {
            reasons.push('缺少 AI 摘要');
            summary.missingSummary++;
        }
        if (!item.batch_completed_at) {
            reasons.push('缺少批次完成时间');
            summary.missingBatchTime++;
        }

        if (reasons.length === 0) {
            reasons.push('手动设置为草稿 (is_published=false)');
            summary.manualDraft++;
        }

        console.log(`${index + 1}. [${item.title || '无标题'}]`);
        console.log(`   URL: ${item.original_url}`);
        console.log(`   创建时间: ${item.created_at}`);
        console.log(`   未发布原因: ${reasons.join(', ')}`);
        console.log('---');
    });

    console.log('\n--- 统计摘要 ---');
    console.log(`总计未发布: ${data.length}`);
    console.log(`缺少 AI 摘要: ${summary.missingSummary}`);
    console.log(`缺少批次时间: ${summary.missingBatchTime}`);
    console.log(`手动草稿: ${summary.manualDraft}`);
}

checkUnpublishedVideos();
