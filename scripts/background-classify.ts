
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Import the existing classification pipeline function
// Using dynamic import to avoid potential issues with early env loading
async function runContinuousClassification() {
    console.log('🚀 启动后台实时分类器...');
    const { runClassificationPipeline } = await import('../lib/services/classify');

    let emptyRuns = 0;
    const MAX_EMPTY_RUNS = 10; // After 10 empty runs, we can slow down or stop

    while (emptyRuns < MAX_EMPTY_RUNS) {
        try {
            console.log('\n[Background Classify] 正在扫描未分类条目...');
            const stats = await runClassificationPipeline();

            if (stats.processed > 0) {
                console.log(`[Background Classify] ✅ 成功分类 ${stats.successCount} 条。`);
                emptyRuns = 0; // Reset empty runs counter
            } else {
                emptyRuns++;
                console.log(`[Background Classify] 😴 没有发现未分类条目 (${emptyRuns}/${MAX_EMPTY_RUNS})。`);
                // Wait longer if no items found
                await new Promise(resolve => setTimeout(resolve, 10000));
                continue;
            }

            // Wait a bit between batches to be nice to the API
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error('[Background Classify] ❌ 出错:', error);
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }

    console.log('🏁 后台分类器任务结束。');
}

runContinuousClassification();
