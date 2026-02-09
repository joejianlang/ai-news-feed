
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local manually
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const env = fs.readFileSync(envPath, 'utf8');
        env.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                process.env[key] = value;
            }
        });
    }
}
loadEnv();

import { analyzeContentWithGemini } from '../lib/ai/gemini';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixBrokenAI() {
    console.log('🔍 Inspecting database content...');

    const { data: recentItems, error: fetchError } = await supabase
        .from('news_items')
        .select('id, title, ai_summary, ai_commentary')
        .order('created_at', { ascending: false })
        .limit(5);

    if (fetchError) {
        console.error('Fetch error:', fetchError);
        return;
    }

    recentItems?.forEach(item => {
        console.log(`- [${item.id}] Title: ${item.title}`);
        console.log(`  Summary: "${item.ai_summary}"`);
        console.log(`  Commentary: "${item.ai_commentary}"`);
    });

    console.log('\n🔍 Finding news items with failed AI analysis...');

    // Try finding items that contain "(AI 服务暂时不可用)" or "(AI服务暂时不可用)"
    // or "(AI评论服务暂时不可用)"
    // Find items by title or content
    const { data: brokenItems, error } = await supabase
        .from('news_items')
        .select('id, title, content, source_id, ai_summary, ai_commentary')
        .or('ai_summary.ilike.%AI服务暂时不可用%,ai_commentary.ilike.%AI评论服务暂时不可用%,title.ilike.%Alanis%,ai_summary.is.null,ai_commentary.is.null')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Database error:', error);
        return;
    }

    if (!brokenItems || brokenItems.length === 0) {
        console.log('✅ No broken items found.');
        return;
    }

    console.log(`🛠 Found ${brokenItems.length} broken items. Re-analyzing...`);

    for (const item of brokenItems) {
        try {
            console.log(`Processing: ${item.title}`);
            const result = await analyzeContentWithGemini(item.content, item.title, "专业、深度");

            const { error: updateError } = await supabase
                .from('news_items')
                .update({
                    ai_summary: result.summary,
                    ai_commentary: result.commentary,
                    title: result.translatedTitle || item.title
                })
                .eq('id', item.id);

            if (updateError) {
                console.error(`Failed to update DB for ${item.id}:`, updateError);
            } else {
                console.log(`✅ Success for ${item.id}`);
            }
        } catch (err) {
            console.error(`Failed to process ${item.id}:`, err);
        }
    }
}

fixBrokenAI();
