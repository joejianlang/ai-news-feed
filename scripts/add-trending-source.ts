import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addTrendingSource() {
    const trendingCategoryId = '6d40b34f-1c0b-4b96-987b-327f4922ef00'; // 热点

    const { data: existing } = await supabase
        .from('news_sources')
        .select('id')
        .eq('url', 'youtube_trending://US')
        .maybeSingle();

    if (existing) {
        console.log('Trending source already exists');
        return;
    }

    const { data, error } = await supabase
        .from('news_sources')
        .insert([{
            name: 'YouTube Trending (US)',
            url: 'youtube_trending://US',
            source_type: 'youtube',
            category_id: trendingCategoryId,
            is_active: true,
            fetch_interval: 360,
            commentary_style: '以客观视角总结视频核心内容，并给出一个前瞻性的点评。',
        }])
        .select()
        .single();

    if (error) {
        console.error('Error adding trending source:', error);
    } else {
        console.log('Successfully added YouTube Trending source:', data);
    }
}

addTrendingSource();
