import { runFetchPipeline } from '@/lib/services/fetch_service';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchTrendingNow() {
    const { data: source } = await supabase
        .from('news_sources')
        .select('id')
        .eq('url', 'youtube_trending://US')
        .single();

    if (!source) {
        console.log('Trending source not found');
        return;
    }

    console.log('🚀 Triggering manual fetch for YouTube Trending...');
    try {
        const result = await runFetchPipeline(source.id);
        console.log('✅ Fetch result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('❌ Pipeline failed:', err);
    }
}

fetchTrendingNow();
