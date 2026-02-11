import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const trendingRegions = [
    { name: 'YouTube Trending (US)', code: 'US' },
    { name: 'YouTube Trending (CA)', code: 'CA' },
    { name: 'YouTube Trending (HK)', code: 'HK' },
    { name: 'YouTube Trending (TW)', code: 'TW' },
    { name: 'YouTube Trending (GB)', code: 'GB' },
    { name: 'YouTube Trending (JP)', code: 'JP' },
];

async function addTrendingSources() {
    const trendingCategoryId = '6d40b34f-1c0b-4b96-987b-327f4922ef00'; // 热点分类 ID

    console.log('🚀 Starting to add multi-region trending sources...');

    for (const region of trendingRegions) {
        const url = `youtube_trending://${region.code}`;

        // 检查是否已存在
        const { data: existing } = await supabase
            .from('news_sources')
            .select('id')
            .eq('url', url)
            .maybeSingle();

        if (existing) {
            console.log(`- [${region.code}] Source already exists, skipping.`);
            continue;
        }

        const { data, error } = await supabase
            .from('news_sources')
            .insert([{
                name: region.name,
                url: url,
                source_type: 'youtube',
                category_id: trendingCategoryId,
                is_active: true,
                fetch_interval: 360, // 6小时
                commentary_style: `以客观视角总结${region.name}的热门内容，并分析其中的社会趋势。`,
            }])
            .select()
            .single();

        if (error) {
            console.error(`- [${region.code}] Error:`, error.message);
        } else {
            console.log(`- [${region.code}] Successfully added: ${region.name}`);
        }
    }

    console.log('\n✅ All requested regions processed.');
}

addTrendingSources();
